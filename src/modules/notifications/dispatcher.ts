import { prisma } from "@/repositories/prisma";
import { logger } from "@/lib/ops/logger";
import { sendViaChannel } from "@/modules/notifications/channels";
import { recordDeliveryAnalytics } from "@/modules/notifications/analytics";
import { scheduleRetry } from "@/modules/notifications/retry";
import type { SendNotificationInput } from "@/modules/notifications/types";

export async function resolveRecipient(
  userId: string | undefined,
  channel: string
): Promise<string | undefined> {
  if (!userId) return undefined;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true },
  });
  if (!user) return undefined;
  if (channel === "EMAIL") return user.email ?? undefined;
  if (channel === "SMS" || channel === "WHATSAPP") return user.phone ?? undefined;
  return userId;
}

export async function createDelivery(input: SendNotificationInput) {
  const recipient =
    input.recipient ??
    (input.userId ? await resolveRecipient(input.userId, input.channel) : undefined);

  const scheduledAt = input.scheduledAt;
  const status = scheduledAt && scheduledAt > new Date() ? "SCHEDULED" : "QUEUED";

  return prisma.notificationDelivery.create({
    data: {
      jobId: input.jobId,
      userId: input.userId,
      tenantId: input.tenantId,
      channel: input.channel,
      type: input.type ?? "TRANSACTIONAL",
      priority: input.priority ?? "NORMAL",
      recipient,
      title: input.title,
      body: input.body,
      status,
      maxAttempts: input.maxAttempts ?? 5,
      metadata: input.data as object,
    },
  });
}

export async function processDelivery(deliveryId: string) {
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: deliveryId },
  });
  if (!delivery) return { ok: false, error: "not_found" };
  if (delivery.status === "DELIVERED" || delivery.status === "CANCELLED") {
    return { ok: true, skipped: true };
  }

  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: { status: "PROCESSING", attempts: { increment: 1 } },
  });

  const result = await sendViaChannel(delivery.channel, {
    userId: delivery.userId ?? undefined,
    recipient: delivery.recipient ?? undefined,
    title: delivery.title,
    body: delivery.body,
    subject: delivery.title,
    data: (delivery.metadata as Record<string, unknown>) ?? undefined,
    deliveryId: delivery.id,
    broadcastId: undefined,
  });

  if (result.ok) {
    const status = result.delivered ? "DELIVERED" : "SENT";
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status,
        providerId: result.providerId,
        sentAt: new Date(),
        deliveredAt: result.delivered ? new Date() : null,
        lastError: null,
        nextRetryAt: null,
      },
    });
    await recordDeliveryAnalytics(delivery.tenantId, delivery.channel, status);
    logger.info("notification_sent", { deliveryId, channel: delivery.channel, status });
    return { ok: true, status };
  }

  const updated = await prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
  const attempts = updated?.attempts ?? delivery.attempts + 1;
  const maxAttempts = delivery.maxAttempts;

  if (attempts >= maxAttempts) {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: "FAILED", lastError: result.error },
    });
    await recordDeliveryAnalytics(delivery.tenantId, delivery.channel, "FAILED");
    logger.error("notification_failed_final", { deliveryId, error: result.error });
    return { ok: false, error: result.error };
  }

  await scheduleRetry(deliveryId, attempts, result.error);
  return { ok: false, error: result.error, retry: true };
}

export async function sendNotification(input: SendNotificationInput) {
  const delivery = await createDelivery(input);

  if (delivery.status === "SCHEDULED") {
    return { deliveryId: delivery.id, scheduled: true };
  }

  const { enqueueNotificationDelivery } = await import("@/modules/notifications/queue");
  await enqueueNotificationDelivery(delivery.id, input.priority ?? "NORMAL");

  return { deliveryId: delivery.id, queued: true };
}

export async function sendMultiChannel(
  channels: SendNotificationInput["channel"][],
  base: Omit<SendNotificationInput, "channel">
) {
  const results = [];
  for (const channel of channels) {
    results.push(await sendNotification({ ...base, channel }));
  }
  return results;
}
