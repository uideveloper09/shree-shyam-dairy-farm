import { prisma } from "@/repositories/prisma";
import type { NotificationChannel } from "@prisma/client";
import { sendMultiChannel } from "@/modules/notifications/dispatcher";
import type { BroadcastInput } from "@/modules/notifications/types";

export async function processScheduledJobs() {
  const now = new Date();

  const [dueJobs, dueBroadcasts] = await Promise.all([
    prisma.notificationJob.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: now } },
      take: 20,
    }),
    prisma.notificationBroadcast.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: now } },
      take: 10,
    }),
  ]);

  const scheduledDeliveries = await prisma.notificationDelivery.findMany({
    where: {
      status: "SCHEDULED",
      job: { scheduledAt: { lte: now } },
    },
    take: 50,
  });

  const { processDelivery } = await import("@/modules/notifications/dispatcher");
  const { enqueueNotificationDelivery } = await import("@/modules/notifications/queue");

  for (const d of scheduledDeliveries) {
    await prisma.notificationDelivery.update({
      where: { id: d.id },
      data: { status: "QUEUED" },
    });
    await enqueueNotificationDelivery(d.id, d.priority);
  }

  for (const job of dueJobs) {
    await prisma.notificationJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING", startedAt: now },
    });
    const payload = job.payload as {
      userId?: string;
      title: string;
      body: string;
      channels?: NotificationChannel[];
    };
    const channels = payload.channels ?? (job.channel ? [job.channel] : ["IN_APP"]);
    await sendMultiChannel(channels, {
      userId: payload.userId,
      tenantId: job.tenantId,
      type: job.type,
      priority: job.priority,
      title: payload.title,
      body: payload.body,
      jobId: job.id,
    });
    await prisma.notificationJob.update({
      where: { id: job.id },
      data: { status: "SENT", completedAt: new Date() },
    });
  }

  for (const broadcast of dueBroadcasts) {
    await executeBroadcast(broadcast.id);
  }

  const { processRetries } = await import("@/modules/notifications/retry");
  const retries = await processRetries();

  return {
    jobs: dueJobs.length,
    broadcasts: dueBroadcasts.length,
    deliveries: scheduledDeliveries.length,
    retries: retries.processed,
  };
}

export async function createBroadcast(input: BroadcastInput) {
  const status = input.scheduledAt && input.scheduledAt > new Date() ? "SCHEDULED" : "PENDING";

  const broadcast = await prisma.notificationBroadcast.create({
    data: {
      tenantId: input.tenantId,
      title: input.title,
      body: input.body,
      channels: input.channels as unknown as object,
      audienceFilter: input.audienceFilter as object,
      type: input.type ?? "BROADCAST",
      priority: input.priority ?? "NORMAL",
      status,
      scheduledAt: input.scheduledAt,
      createdById: input.createdById,
    },
  });

  if (status === "PENDING") {
    await executeBroadcast(broadcast.id);
  }

  return broadcast;
}

export async function createAnnouncement(input: BroadcastInput) {
  return createBroadcast({ ...input, type: "ANNOUNCEMENT" });
}

async function resolveAudience(filter?: BroadcastInput["audienceFilter"]) {
  if (filter?.userIds?.length) {
    return prisma.user.findMany({
      where: { id: { in: filter.userIds }, isActive: true, deletedAt: null },
      select: { id: true },
    });
  }
  if (filter?.roles?.length) {
    return prisma.user.findMany({
      where: { role: { in: filter.roles as never }, isActive: true, deletedAt: null },
      select: { id: true },
    });
  }
  return prisma.user.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true },
    take: 5000,
  });
}

export async function executeBroadcast(broadcastId: string) {
  const broadcast = await prisma.notificationBroadcast.findUnique({
    where: { id: broadcastId },
  });
  if (!broadcast) throw new Error("Broadcast not found");

  const channels = broadcast.channels as NotificationChannel[];
  const filter = broadcast.audienceFilter as BroadcastInput["audienceFilter"];
  const users = await resolveAudience(filter);

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await sendMultiChannel(channels, {
        userId: user.id,
        tenantId: broadcast.tenantId,
        type: broadcast.type,
        priority: broadcast.priority,
        title: broadcast.title,
        body: broadcast.body,
        data: { broadcastId },
      });
      sent++;
    } catch {
      failed++;
    }
  }

  await prisma.notificationBroadcast.update({
    where: { id: broadcastId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      stats: { sent, failed, audience: users.length },
    },
  });

  return { sent, failed, audience: users.length };
}
