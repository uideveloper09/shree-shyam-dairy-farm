import type { ChannelSendResult } from "@/modules/notifications/types";

type ChannelInput = {
  recipient?: string;
  body: string;
};

export async function sendSms(input: ChannelInput): Promise<ChannelSendResult> {
  const phone = input.recipient?.replace(/\D/g, "");
  if (!phone) return { ok: false, error: "No phone recipient" };

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    return { ok: true, providerId: `mock_sms_${Date.now()}`, delivered: false };
  }

  const url = new URL("https://control.msg91.com/api/v5/flow/");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: templateId,
      recipients: [{ mobiles: phone, var: input.body }],
    }),
  });

  if (!res.ok) {
    return { ok: false, error: await res.text() };
  }

  const data = (await res.json()) as { request_id?: string };
  return { ok: true, providerId: data.request_id, delivered: true };
}
