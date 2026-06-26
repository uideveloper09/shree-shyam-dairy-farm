import type { ChannelSendResult } from "@/modules/notifications/types";

type ChannelInput = {
  userId?: string;
  recipient?: string;
  title: string;
  body: string;
  subject?: string;
  html?: string;
};

export async function sendEmail(input: ChannelInput): Promise<ChannelSendResult> {
  const to = input.recipient;
  if (!to) return { ok: false, error: "No email recipient" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: true, providerId: `mock_email_${Date.now()}`, delivered: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "noreply@shreeshyamdairyfarm.com",
      to: [to],
      subject: input.subject || input.title,
      html: input.html || `<p>${input.body.replace(/\n/g, "<br>")}</p>`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err };
  }

  const data = (await res.json()) as { id?: string };
  return { ok: true, providerId: data.id, delivered: true };
}
