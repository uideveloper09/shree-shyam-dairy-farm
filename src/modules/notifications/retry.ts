import { prisma } from "@/repositories/prisma";
import { RETRY_DELAYS_MS } from "@/modules/notifications/types";

export async function scheduleRetry(deliveryId: string, attempts: number, error?: string) {
  const delayMs = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
  const nextRetryAt = new Date(Date.now() + delayMs);

  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      status: "QUEUED",
      lastError: error,
      nextRetryAt,
    },
  });

  const { enqueueNotificationDelivery } = await import("@/modules/notifications/queue");
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: deliveryId },
    select: { priority: true },
  });
  await enqueueNotificationDelivery(deliveryId, delivery?.priority ?? "NORMAL", delayMs);

  return nextRetryAt;
}

export async function processRetries() {
  const pending = await prisma.notificationDelivery.findMany({
    where: {
      status: "QUEUED",
      nextRetryAt: { lte: new Date() },
      attempts: { lt: 5 },
    },
    take: 50,
    orderBy: [{ priority: "desc" }, { nextRetryAt: "asc" }],
  });

  const { processDelivery } = await import("@/modules/notifications/dispatcher");
  const results = [];
  for (const d of pending) {
    results.push(await processDelivery(d.id));
  }
  return { processed: results.length, results };
}
