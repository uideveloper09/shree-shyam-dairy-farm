import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { AUTH_COOKIE } from "@/constants/auth";

const secure = process.env.NODE_ENV === "production";

function csrfCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: false as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

/** Set double-submit CSRF cookie (readable by client for X-CSRF-Token header). */
export async function setCsrfCookie(existingToken?: string | null) {
  const jar = await cookies();
  const token = existingToken?.trim() || nanoid(32);
  jar.set(AUTH_COOKIE.csrf, token, csrfCookieOptions(60 * 60 * 24 * 30));
  return token;
}

export async function setAuthCookies(accessToken: string, refreshToken: string, remember = false) {
  const jar = await cookies();
  const refreshMaxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;

  jar.set(AUTH_COOKIE.access, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  jar.set(AUTH_COOKIE.refresh, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge,
  });

  const existingCsrf = jar.get(AUTH_COOKIE.csrf)?.value;
  await setCsrfCookie(existingCsrf);
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE.access);
  jar.delete(AUTH_COOKIE.refresh);
  jar.delete(AUTH_COOKIE.csrf);
}

export async function getAccessTokenFromCookies() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE.access)?.value ?? null;
}

export async function getRefreshTokenFromCookies() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE.refresh)?.value ?? null;
}
