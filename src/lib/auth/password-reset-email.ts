import { sendEmail } from "@/modules/notifications/channels/email";
import { getPasswordResetUrl } from "@/lib/auth/password-reset.service";
import { CUSTOMER_BRAND_NAME } from "@/constants/brand";
type SendPasswordResetEmailInput = {
  email: string;
  token: string;
  userName?: string | null;
};

export type PasswordResetEmailResult = {
  ok: boolean;
  delivered: boolean;
  error?: string;
};

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput
): Promise<PasswordResetEmailResult> {
  const resetUrl = getPasswordResetUrl(input.token);
  const greeting = input.userName?.trim() ? `Hello ${input.userName.trim()},` : "Hello,";

  const result = await sendEmail({
    recipient: input.email,
    title: "Reset your password",
    subject: `Reset your ${CUSTOMER_BRAND_NAME} password`,
    body: "Use the link below to reset your password. This link expires in 15 minutes.",
    html: `
      <p>${greeting}</p>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <p>This link expires in <strong>15 minutes</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#082F63;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Reset password
        </a>
      </p>
      <p style="word-break:break-all;font-size:13px;color:#555;">Or copy this link:<br><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });

  return {
    ok: result.ok,
    delivered: result.ok && result.delivered === true,
    error: result.error,
  };
}
