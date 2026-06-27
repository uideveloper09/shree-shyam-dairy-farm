import { jwtVerify } from "jose";

/** Edge-safe access JWT verification for middleware (signed HS256 only). */
export async function isValidAccessToken(token: string | undefined | null): Promise<boolean> {
  if (!token?.trim()) return false;

  const secret = process.env.JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return false;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.type === "access";
  } catch {
    return false;
  }
}
