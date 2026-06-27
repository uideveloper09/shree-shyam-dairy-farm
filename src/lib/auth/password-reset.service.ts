import { createHash, randomBytes } from "crypto";
import { prisma } from "@/repositories/prisma";

/** Matches NextAuth-style reset flow; uses NEXTAUTH_SECRET when set for token hashing. */
export const PASSWORD_RESET_PURPOSE = "reset_password" as const;
export const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_BYTES = 32;

export type PasswordResetTokenError = "invalid" | "expired";

export type PasswordResetVerification =
  | { ok: true; userId: string }
  | { ok: false; error: PasswordResetTokenError; message: string };

const ERROR_MESSAGES: Record<PasswordResetTokenError, string> = {
  invalid: "This reset link is invalid. Request a new password reset link.",
  expired: "This reset link has expired. Request a new password reset link.",
};

/**
 * Pepper for SHA-256 — prefers NEXTAUTH_SECRET (NextAuth convention), then JWT secret.
 * Plain SHA-256 of token alone is used when no secret is configured (tests only).
 */
function resetTokenPepper(): string | null {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.JWT_ACCESS_SECRET?.trim() ||
    process.env.ENCRYPTION_KEY?.trim() ||
    null
  );
}

/** Plain token sent in email — 32 cryptographically secure random bytes as hex. */
export function generatePasswordResetToken(): string {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");
}

/** SHA-256 hash stored in the database (never store the plain token). */
export function hashPasswordResetToken(token: string): string {
  const pepper = resetTokenPepper();
  const payload = pepper ? `${token}:${pepper}` : token;
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

import { getSiteUrl } from "@/lib/site-url";

export function getPasswordResetUrl(token: string): string {
  return `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

/** Persist hashed token + 15-minute expiry on User; return plain token for Resend email. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const plainToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(plainToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  return plainToken;
}

/** Verify plain token from reset link against stored SHA-256 hash and expiry. */
export async function verifyPasswordResetToken(token: string): Promise<PasswordResetVerification> {
  if (!token?.trim()) {
    return { ok: false, error: "invalid", message: ERROR_MESSAGES.invalid };
  }

  const tokenHash = hashPasswordResetToken(token);
  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: tokenHash, isActive: true, deletedAt: null },
    select: { id: true, passwordResetExpiresAt: true },
  });

  if (!user?.passwordResetExpiresAt) {
    return { ok: false, error: "invalid", message: ERROR_MESSAGES.invalid };
  }

  if (user.passwordResetExpiresAt <= new Date()) {
    return { ok: false, error: "expired", message: ERROR_MESSAGES.expired };
  }

  return { ok: true, userId: user.id };
}

/** Clear reset token hash and expiry after successful password change. */
export async function clearPasswordResetToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
}
