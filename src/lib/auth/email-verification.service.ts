import { prisma } from "@/repositories/prisma";
import { TOKEN_TTL } from "@/constants/auth";
import { generateSecureToken, hashSecureToken } from "@/lib/auth/secure-token";
import { getSiteUrl } from "@/lib/site-url";

export const EMAIL_VERIFY_PURPOSE = "verify_email" as const;

export type EmailVerifyError = "invalid" | "expired" | "used";

const ERROR_MESSAGES: Record<EmailVerifyError, string> = {
  invalid: "This verification link is invalid. Request a new verification email.",
  expired: "This verification link has expired. Request a new verification email.",
  used: "This verification link has already been used.",
};

export function getEmailVerifyUrl(token: string): string {
  return `${getSiteUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

/** Create hashed verification token; return plain token for Resend email. */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const plainToken = generateSecureToken();
  const tokenHash = hashSecureToken(plainToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL.emailVerify * 1000);

  await prisma.$transaction([
    prisma.emailToken.deleteMany({
      where: { userId, purpose: EMAIL_VERIFY_PURPOSE },
    }),
    prisma.emailToken.create({
      data: {
        userId,
        token: tokenHash,
        purpose: EMAIL_VERIFY_PURPOSE,
        expiresAt,
      },
    }),
  ]);

  return plainToken;
}

export async function verifyEmailToken(
  token: string
): Promise<
  | { ok: true; userId: string; recordId: string }
  | { ok: false; error: EmailVerifyError; message: string }
> {
  if (!token?.trim()) {
    return { ok: false, error: "invalid", message: ERROR_MESSAGES.invalid };
  }

  const tokenHash = hashSecureToken(token);
  const record = await prisma.emailToken.findFirst({
    where: { token: tokenHash, purpose: EMAIL_VERIFY_PURPOSE },
  });

  if (!record) {
    return { ok: false, error: "invalid", message: ERROR_MESSAGES.invalid };
  }

  if (record.usedAt) {
    return { ok: false, error: "used", message: ERROR_MESSAGES.used };
  }

  if (record.expiresAt <= new Date()) {
    return { ok: false, error: "expired", message: ERROR_MESSAGES.expired };
  }

  return { ok: true, userId: record.userId, recordId: record.id };
}

export async function markEmailVerified(userId: string, recordId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailToken.update({
      where: { id: recordId },
      data: { usedAt: new Date() },
    }),
  ]);
}

export async function sendVerificationEmailForUser(userId: string): Promise<{
  sent: boolean;
  error?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true, deletedAt: null },
    select: { id: true, email: true, name: true, emailVerified: true },
  });

  if (!user?.email) {
    return { sent: false, error: "No email on account" };
  }

  if (user.emailVerified) {
    return { sent: false, error: "Email already verified" };
  }

  const { sendEmailVerificationEmail } = await import("@/lib/auth/email-verification-email");
  const token = await createEmailVerificationToken(user.id);
  const result = await sendEmailVerificationEmail({
    email: user.email,
    token,
    userName: user.name,
  });

  return { sent: result.delivered, error: result.error };
}
