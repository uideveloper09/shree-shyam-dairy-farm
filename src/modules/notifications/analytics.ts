import { prisma } from "@/repositories/prisma";
import type { NotificationChannel } from "@prisma/client";

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function bumpAnalytics(
  tenantId: string | null | undefined,
  channel: NotificationChannel,
  inc: { sent?: number; delivered?: number; failed?: number; opened?: number }
) {
  const date = startOfDay();
  const existing = await prisma.notificationDailyAnalytics.findFirst({
    where: { tenantId: tenantId ?? null, date, channel },
  });

  if (existing) {
    await prisma.notificationDailyAnalytics.update({
      where: { id: existing.id },
      data: {
        sent: { increment: inc.sent ?? 0 },
        delivered: { increment: inc.delivered ?? 0 },
        failed: { increment: inc.failed ?? 0 },
        opened: { increment: inc.opened ?? 0 },
      },
    });
    return;
  }

  await prisma.notificationDailyAnalytics.create({
    data: {
      tenantId: tenantId ?? null,
      date,
      channel,
      sent: inc.sent ?? 0,
      delivered: inc.delivered ?? 0,
      failed: inc.failed ?? 0,
      opened: inc.opened ?? 0,
    },
  });
}

export async function recordDeliveryAnalytics(
  tenantId: string | null | undefined,
  channel: NotificationChannel,
  outcome: "SENT" | "DELIVERED" | "FAILED"
) {
  const inc =
    outcome === "FAILED"
      ? { failed: 1 }
      : outcome === "DELIVERED"
        ? { sent: 1, delivered: 1 }
        : { sent: 1 };

  await bumpAnalytics(tenantId, channel, inc);
}

export async function recordNotificationOpened(userId: string, notificationId: string) {
  const notification = await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
    select: { channel: true },
  });

  await bumpAnalytics(null, notification.channel, { opened: 1 });
}

export async function getNotificationAnalytics(tenantId?: string | null, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.notificationDailyAnalytics.findMany({
    where: {
      tenantId: tenantId ?? null,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
  });

  const byChannel: Record<
    string,
    { sent: number; delivered: number; failed: number; opened: number }
  > = {};
  for (const row of rows) {
    const key = row.channel;
    if (!byChannel[key]) byChannel[key] = { sent: 0, delivered: 0, failed: 0, opened: 0 };
    byChannel[key].sent += row.sent;
    byChannel[key].delivered += row.delivered;
    byChannel[key].failed += row.failed;
    byChannel[key].opened += row.opened;
  }

  const deliveries = await prisma.notificationDelivery.groupBy({
    by: ["status"],
    where: {
      tenantId: tenantId ?? undefined,
      createdAt: { gte: since },
    },
    _count: true,
  });

  return {
    daily: rows,
    byChannel,
    deliveryStatus: Object.fromEntries(deliveries.map((d) => [d.status, d._count])),
    periodDays: days,
  };
}

export async function getDeliveryReports(
  tenantId?: string | null,
  opts: { limit?: number; status?: string; channel?: string } = {}
) {
  return prisma.notificationDelivery.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      status: opts.status as never,
      channel: opts.channel as never,
    },
    take: opts.limit ?? 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      channel: true,
      status: true,
      attempts: true,
      recipient: true,
      lastError: true,
      sentAt: true,
      deliveredAt: true,
      priority: true,
      title: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });
}
