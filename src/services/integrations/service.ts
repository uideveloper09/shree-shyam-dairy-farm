import { prisma } from "@/repositories/prisma";
import { encrypt, decrypt } from "@/lib/security/encryption";
import type { IntegrationProvider } from "@prisma/client";
import { getProviderCatalog } from "@/modules/integrations/registry";

export async function listConnections(tenantId?: string | null) {
  return prisma.integrationConnection.findMany({
    where: { tenantId: tenantId ?? undefined },
    orderBy: { provider: "asc" },
  });
}

export async function upsertConnection(data: {
  tenantId?: string | null;
  provider: IntegrationProvider;
  name: string;
  config?: Record<string, unknown>;
  credentials?: Record<string, string>;
}) {
  const credentialsEnc = data.credentials ? encrypt(JSON.stringify(data.credentials)) : undefined;

  const existing = await prisma.integrationConnection.findFirst({
    where: { tenantId: data.tenantId ?? null, provider: data.provider },
  });

  if (existing) {
    return prisma.integrationConnection.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        config: data.config as object,
        credentialsEnc,
        status: "ACTIVE",
        lastError: null,
      },
    });
  }

  return prisma.integrationConnection.create({
    data: {
      tenantId: data.tenantId,
      provider: data.provider,
      name: data.name,
      config: data.config as object,
      credentialsEnc,
      status: "ACTIVE",
    },
  });
}

export async function getConnectionCredentials(
  tenantId: string | null | undefined,
  provider: IntegrationProvider
): Promise<Record<string, string> | null> {
  const conn = await prisma.integrationConnection.findFirst({
    where: { tenantId: tenantId ?? null, provider },
  });
  if (!conn?.credentialsEnc) return null;
  try {
    return JSON.parse(decrypt(conn.credentialsEnc)) as Record<string, string>;
  } catch {
    return null;
  }
}

export async function getIntegrationsDashboard(tenantId?: string | null) {
  const [catalog, connections, eventCount] = await Promise.all([
    getProviderCatalog(),
    listConnections(tenantId),
    prisma.integrationEventLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
    }),
  ]);

  const connected = new Set(connections.map((c) => c.provider));

  return {
    catalog,
    connections,
    stats: {
      totalProviders: catalog.length,
      configured: catalog.filter((c) => c.status.configured).length,
      connected: connections.filter((c) => c.status === "ACTIVE").length,
      events24h: eventCount,
    },
    categories: {
      payments: catalog.filter((c) => c.category === "payments"),
      shipping: catalog.filter((c) => c.category === "shipping"),
      accounting: catalog.filter((c) => c.category === "accounting"),
      analytics: catalog.filter((c) => c.category === "analytics"),
    },
    connectedProviders: [...connected],
  };
}
