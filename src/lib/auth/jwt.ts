import { SignJWT, jwtVerify } from "jose";

function resolveAccessSecret(): string {
  return process.env.JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function getAccessSecret() {
  const secret = resolveAccessSecret();
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function parseExpiry(value: string): string {
  return value;
}

export type AccessTokenPayload = {
  sub: string;
  email: string | null;
  role: string;
  type: "access";
};

export async function signAccessToken(payload: Omit<AccessTokenPayload, "type">) {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(parseExpiry(process.env.JWT_ACCESS_EXPIRES || "15m"))
    .sign(getAccessSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getAccessSecret());
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload as unknown as AccessTokenPayload;
}
