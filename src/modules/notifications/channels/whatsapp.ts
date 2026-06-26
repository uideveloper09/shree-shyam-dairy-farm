import type { ChannelSendResult } from "@/modules/notifications/types";

type ChannelInput = {
  recipient?: string;
  title: string;
  body: string;
};

/** WhatsApp Business Cloud API or generic webhook */
export async function sendWhatsApp(input: ChannelInput): Promise<ChannelSendResult> {
  const phone = input.recipient?.replace(/\D/g, "");
  if (!phone) return { ok: false, error: "No WhatsApp recipient" };

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: true, providerId: `mock_wa_${Date.now()}`, delivered: false };
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: `*${input.title}*\n\n${input.body}` },
    }),
  });

  if (!res.ok) {
    return { ok: false, error: await res.text() };
  }

  const data = (await res.json()) as { messages?: { id: string }[] };
  return {
    ok: true,
    providerId: data.messages?.[0]?.id,
    delivered: true,
  };
}
