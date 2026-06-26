import { sendPushToUser } from "@/services/mobile/platform.service";
import type { ChannelSendResult } from "@/modules/notifications/types";

type ChannelInput = {
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function sendPush(input: ChannelInput): Promise<ChannelSendResult> {
  if (!input.userId) return { ok: false, error: "Push requires userId" };

  const result = await sendPushToUser(input.userId, input.title, input.body, input.data);

  if (result.sent > 0) {
    return { ok: true, providerId: `push_${input.userId}`, delivered: true };
  }

  if (result.queued) {
    return { ok: true, providerId: `push_queued_${input.userId}`, delivered: false };
  }

  return { ok: false, error: "No push subscriptions" };
}
