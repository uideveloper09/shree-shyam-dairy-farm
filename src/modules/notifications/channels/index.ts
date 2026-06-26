import type { NotificationChannel } from "@prisma/client";
import type { ChannelSendResult } from "@/modules/notifications/types";
import { sendEmail } from "@/modules/notifications/channels/email";
import { sendSms } from "@/modules/notifications/channels/sms";
import { sendWhatsApp } from "@/modules/notifications/channels/whatsapp";
import { sendPush } from "@/modules/notifications/channels/push";
import { sendInApp } from "@/modules/notifications/channels/in-app";

export async function sendViaChannel(
  channel: NotificationChannel,
  input: {
    userId?: string;
    recipient?: string;
    title: string;
    body: string;
    subject?: string;
    data?: Record<string, unknown>;
    deliveryId?: string;
    broadcastId?: string;
  }
): Promise<ChannelSendResult> {
  switch (channel) {
    case "EMAIL":
      return sendEmail({
        ...input,
        html: typeof input.data?.html === "string" ? input.data.html : undefined,
      });
    case "SMS":
      return sendSms(input);
    case "WHATSAPP":
      return sendWhatsApp(input);
    case "PUSH":
      return sendPush(input);
    case "IN_APP":
      return sendInApp(input);
    default:
      return { ok: false, error: `Unknown channel: ${channel}` };
  }
}
