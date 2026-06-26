import { SignJWT, jwtVerify } from "jose";

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
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

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
  remember?: boolean;
};

export async function signAccessToken(payload: Omit<AccessTokenPayload, "type">) {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(parseExpiry(process.env.JWT_ACCESS_EXPIRES || "15m"))
    .sign(getAccessSecret());
}

export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">,
  remember = false
) {
  const expires = remember
    ? process.env.JWT_REFRESH_REMEMBER_EXPIRES || "30d"
    : process.env.JWT_REFRESH_EXPIRES || "7d";

  return new SignJWT({ ...payload, type: "refresh", remember })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(parseExpiry(expires))
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getAccessSecret());
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload as unknown as RefreshTokenPayload;
}
