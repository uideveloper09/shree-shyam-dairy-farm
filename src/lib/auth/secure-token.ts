import { createHash, randomBytes } from "crypto";

export const SECURE_TOKEN_BYTES = 32;

/** Shared pepper for hashed email/reset tokens (NextAuth-compatible secret chain). */
export function tokenPepper(): string | null {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.JWT_ACCESS_SECRET?.trim() ||
    process.env.ENCRYPTION_KEY?.trim() ||
    null
  );
}

export function generateSecureToken(): string {
  return randomBytes(SECURE_TOKEN_BYTES).toString("hex");
}

export function hashSecureToken(token: string): string {
  const pepper = tokenPepper();
  const payload = pepper ? `${token}:${pepper}` : token;
  return createHash("sha256").update(payload, "utf8").digest("hex");
}
