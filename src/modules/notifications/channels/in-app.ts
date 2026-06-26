import { prisma } from "@/repositories/prisma";
import type { ChannelSendResult } from "@/modules/notifications/types";

type ChannelInput = {
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  deliveryId?: string;
  broadcastId?: string;
};

export async function sendInApp(input: ChannelInput): Promise<ChannelSendResult> {
  if (!input.userId) return { ok: false, error: "In-app requires userId" };

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      channel: "IN_APP",
      type: "TRANSACTIONAL",
      title: input.title,
      body: input.body,
      data: input.data as object,
      sentAt: new Date(),
      deliveryId: input.deliveryId,
      broadcastId: input.broadcastId,
    },
  });

  return { ok: true, providerId: notification.id, delivered: true };
}
