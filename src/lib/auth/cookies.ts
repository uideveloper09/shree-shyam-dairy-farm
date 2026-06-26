import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/constants/auth";

const secure = process.env.NODE_ENV === "production";

export async function setAuthCookies(accessToken: string, refreshToken: string, remember = false) {
  const jar = await cookies();

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
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE.access);
  jar.delete(AUTH_COOKIE.refresh);
}

export async function getAccessTokenFromCookies() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE.access)?.value ?? null;
}

export async function getRefreshTokenFromCookies() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE.refresh)?.value ?? null;
}
