import { sendEmail } from "@/modules/notifications/channels/email";
import { getEmailVerifyUrl } from "@/lib/auth/email-verification.service";
import { CUSTOMER_BRAND_NAME } from "@/constants/brand";

type SendEmailVerificationInput = {
  email: string;
  token: string;
  userName?: string | null;
};

export type EmailVerificationResult = {
  ok: boolean;
  delivered: boolean;
  error?: string;
};

export async function sendEmailVerificationEmail(
  input: SendEmailVerificationInput
): Promise<EmailVerificationResult> {
  const verifyUrl = getEmailVerifyUrl(input.token);
  const greeting = input.userName?.trim() ? `Hello ${input.userName.trim()},` : "Hello,";

  const result = await sendEmail({
    recipient: input.email,
    title: "Verify your email",
    subject: `Verify your ${CUSTOMER_BRAND_NAME} account`,
    body: "Click the link below to verify your email address. This link expires in 24 hours.",
    html: `
      <p>${greeting}</p>
      <p>Please verify your email address to secure your account and receive order updates.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#082F63;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Verify email
        </a>
      </p>
      <p style="word-break:break-all;font-size:13px;color:#555;">Or copy this link:<br><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  });

  return {
    ok: result.ok,
    delivered: result.ok && result.delivered === true,
    error: result.error,
  };
}
