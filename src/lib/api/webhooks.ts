import { createHmac, randomBytes } from "crypto";
import { prisma } from "@/repositories/prisma";
import type { WebhookEvent } from "@/lib/api/scopes";

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 14_400_000];

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

export function signWebhookPayload(secret: string, payload: string, timestamp: number): string {
  const signed = `${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(signed).digest("hex");
}

export async function dispatchWebhookEvent(event: WebhookEvent, payload: Record<string, unknown>) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { isActive: true, events: { has: event } },
  });

  const deliveries = [];
  for (const endpoint of endpoints) {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        event,
        payload: payload as object,
        status: "pending",
      },
    });
    deliveries.push(delivery);
    deliverWebhook(delivery.id).catch(() => {});
  }

  return { dispatched: deliveries.length };
}

export async function deliverWebhook(deliveryId: string): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: true },
  });
  if (!delivery || !delivery.endpoint.isActive) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    id: delivery.id,
    event: delivery.event,
    created_at: delivery.createdAt.toISOString(),
    data: delivery.payload,
  });
  const signature = signWebhookPayload(delivery.endpoint.secret, body, timestamp);

  try {
    const res = await fetch(delivery.endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ShreeShyam-Webhooks/1.0",
        "X-SSD-Event": delivery.event,
        "X-SSD-Timestamp": String(timestamp),
        "X-SSD-Signature": `v1=${signature}`,
        "X-SSD-Delivery-Id": delivery.id,
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    const responseBody = await res.text().catch(() => "");

    if (res.ok) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "success",
          statusCode: res.status,
          responseBody: responseBody.slice(0, 2000),
          attempts: { increment: 1 },
          deliveredAt: new Date(),
        },
      });
      return;
    }

    await scheduleRetry(deliveryId, delivery.attempts, res.status, responseBody);
  } catch (err) {
    await scheduleRetry(deliveryId, delivery.attempts, 0, (err as Error).message.slice(0, 500));
  }
}

async function scheduleRetry(
  deliveryId: string,
  attempts: number,
  statusCode: number,
  responseBody: string
) {
  const nextAttempt = attempts + 1;
  if (nextAttempt >= MAX_ATTEMPTS) {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "failed",
        statusCode: statusCode || null,
        responseBody: responseBody.slice(0, 2000),
        attempts: nextAttempt,
      },
    });
    return;
  }

  const delay = RETRY_DELAYS_MS[nextAttempt - 1] ?? RETRY_DELAYS_MS.at(-1)!;
  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: "pending",
      statusCode: statusCode || null,
      responseBody: responseBody.slice(0, 2000),
      attempts: nextAttempt,
      nextRetryAt: new Date(Date.now() + delay),
    },
  });
}

export function verifyWebhookSignature(
  secret: string,
  payload: string,
  timestamp: string,
  signature: string
): boolean {
  const ts = Number(timestamp);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = signWebhookPayload(secret, payload, ts);
  const provided = signature.replace(/^v1=/, "");
  return expected === provided;
}
