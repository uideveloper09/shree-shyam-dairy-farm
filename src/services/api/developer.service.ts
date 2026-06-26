import { prisma } from "@/repositories/prisma";
import { generateApiKeyValue, getKeyPrefix, hashApiKey } from "@/lib/api/auth";
import { DEFAULT_SCOPES, TIER_RATE_LIMITS } from "@/lib/api/scopes";
import { generateWebhookSecret } from "@/lib/api/webhooks";

export async function getOrCreateDeveloperAccount(userId: string, company?: string) {
  return prisma.developerAccount.upsert({
    where: { userId },
    create: { userId, company },
    update: company ? { company } : {},
    include: {
      apiKeys: { where: { revokedAt: null }, orderBy: { createdAt: "desc" } },
      webhooks: true,
    },
  });
}

export async function createApiKey(developerId: string, name: string, scopes?: string[]) {
  const developer = await prisma.developerAccount.findUnique({ where: { id: developerId } });
  if (!developer) throw new Error("Developer not found");

  const rawKey = generateApiKeyValue(developer.tier === "free" ? "test" : "live");
  const record = await prisma.apiKey.create({
    data: {
      developerId,
      name,
      keyPrefix: getKeyPrefix(rawKey),
      keyHash: hashApiKey(rawKey),
      scopes: scopes?.length ? scopes : [...DEFAULT_SCOPES],
      rateLimit: TIER_RATE_LIMITS[developer.tier] ?? 60,
    },
  });

  return { key: rawKey, record };
}

export async function revokeApiKey(developerId: string, keyId: string) {
  return prisma.apiKey.updateMany({
    where: { id: keyId, developerId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function createWebhookEndpoint(
  developerId: string,
  data: { url: string; events: string[] }
) {
  return prisma.webhookEndpoint.create({
    data: {
      developerId,
      url: data.url,
      events: data.events,
      secret: generateWebhookSecret(),
    },
  });
}

export async function deleteWebhookEndpoint(developerId: string, webhookId: string) {
  return prisma.webhookEndpoint.deleteMany({
    where: { id: webhookId, developerId },
  });
}

export async function listWebhookDeliveries(developerId: string, limit = 20) {
  return prisma.webhookDelivery.findMany({
    where: { endpoint: { developerId } },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      event: true,
      status: true,
      statusCode: true,
      attempts: true,
      createdAt: true,
      deliveredAt: true,
      endpoint: { select: { url: true } },
    },
  });
}
