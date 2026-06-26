import type { NotificationChannel, NotificationPriority } from "@prisma/client";
import { PRIORITY_WEIGHT } from "@/modules/notifications/types";
import { enqueueJob } from "@/lib/ops/queue";
import { logger } from "@/lib/ops/logger";

export async function enqueueNotificationDelivery(
  deliveryId: string,
  priority: NotificationPriority = "NORMAL",
  delayMs = 0
) {
  const weight = PRIORITY_WEIGHT[priority];

  if (!process.env.REDIS_URL) {
    const { processDelivery } = await import("@/modules/notifications/dispatcher");
    if (delayMs > 0) {
      setTimeout(
        () =>
          processDelivery(deliveryId).catch((e) =>
            logger.error("notification_inline_fail", { deliveryId, error: String(e) })
          ),
        delayMs
      );
    } else {
      await processDelivery(deliveryId);
    }
    return { id: deliveryId, queued: false, inline: true };
  }

  const job = await enqueueJob({
    name: "notification",
    data: { deliveryId, priority: weight, delayMs },
  });

  return job;
}

export async function processNotificationJob(data: Record<string, unknown>) {
  const deliveryId = data.deliveryId as string;
  if (!deliveryId) return { ok: false, reason: "missing_delivery_id" };

  const delayMs = Number(data.delayMs || 0);
  if (delayMs > 0) {
    await new Promise((r) => setTimeout(r, Math.min(delayMs, 60_000)));
  }

  const { processDelivery } = await import("@/modules/notifications/dispatcher");
  return processDelivery(deliveryId);
}
