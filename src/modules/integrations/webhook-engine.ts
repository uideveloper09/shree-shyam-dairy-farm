import { prisma } from "@/repositories/prisma";
import type { IntegrationProvider } from "@prisma/client";
import { getProvider } from "@/modules/integrations/registry";
import { dispatchWebhookEvent } from "@/lib/api/webhooks";
import type { WebhookEvent } from "@/lib/api/scopes";

export async function logIntegrationEvent(input: {
  provider: IntegrationProvider;
  direction: "inbound" | "outbound";
  event: string;
  status: string;
  tenantId?: string | null;
  payload?: unknown;
  response?: unknown;
}) {
  return prisma.integrationEventLog.create({
    data: {
      provider: input.provider,
      direction: input.direction,
      event: input.event,
      status: input.status,
      tenantId: input.tenantId,
      payload: input.payload as object,
      response: input.response as object,
    },
  });
}

export async function handleInboundWebhook(
  providerId: IntegrationProvider,
  headers: Headers,
  body: string,
  tenantId?: string | null
) {
  const adapter = getProvider(providerId);
  if (!adapter) {
    return { ok: false, error: "unknown_provider" };
  }

  if (adapter.verifyWebhook && !adapter.verifyWebhook(headers, body)) {
    await logIntegrationEvent({
      provider: providerId,
      direction: "inbound",
      event: "webhook.rejected",
      status: "failed",
      tenantId,
      payload: { reason: "invalid_signature" },
    });
    return { ok: false, error: "invalid_signature" };
  }

  let result: { ok: boolean; event?: string; data?: unknown } = { ok: true };
  if (adapter.handleWebhook) {
    result = await adapter.handleWebhook(headers, body);
  } else {
    try {
      result = { ok: true, event: "webhook.received", data: JSON.parse(body) };
    } catch {
      result = { ok: true, event: "webhook.received", data: body };
    }
  }

  await logIntegrationEvent({
    provider: providerId,
    direction: "inbound",
    event: result.event || "webhook.received",
    status: result.ok ? "success" : "failed",
    tenantId,
    payload: result.data as object,
  });

  if (result.ok && result.event) {
    const mapped = mapToPlatformEvent(providerId, result.event);
    if (mapped) {
      await dispatchWebhookEvent(mapped as WebhookEvent, {
        provider: providerId,
        ...(typeof result.data === "object" && result.data ? result.data : {}),
      }).catch(() => {});
    }
  }

  return result;
}

function mapToPlatformEvent(provider: IntegrationProvider, event: string): string | null {
  const map: Partial<Record<IntegrationProvider, Record<string, string>>> = {
    RAZORPAY: {
      "payment.captured": "payment.captured",
      "order.paid": "order.created",
    },
    SHIPROCKET: { shipment_created: "order.updated" },
    DELHIVERY: { Delivered: "order.delivered" },
  };
  return map[provider]?.[event] ?? null;
}

export async function getWebhookLogs(limit = 50, provider?: IntegrationProvider) {
  return prisma.integrationEventLog.findMany({
    where: provider ? { provider } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
