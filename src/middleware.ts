import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveTenantFromHost } from "@/lib/tenant/resolve-host";
import { TENANT_COOKIE, TENANT_HEADER } from "@/constants/tenant";
import { AUTH_COOKIE } from "@/constants/auth";
import { isValidAccessToken } from "@/lib/auth/jwt-edge";
import { requiresCsrfProtection, validateCsrf } from "@/lib/security/csrf";
import { checkRateLimitEdge, isRateLimitExempt } from "@/lib/ops/rate-limit-edge";

const authRoutes = ["/login", "/signup"];

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/account")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname === "/m" || pathname.startsWith("/m/")) return true;
  return false;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(AUTH_COOKIE.access)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIE.refresh)?.value;

  const requestHeaders = new Headers(request.headers);
  const host = request.headers.get("host") || "";
  const subdomainSlug = resolveTenantFromHost(host);
  if (subdomainSlug) {
    requestHeaders.set(TENANT_HEADER, subdomainSlug);
  }

  // Global API rate limiting
  if (pathname.startsWith("/api/") && !isRateLimitExempt(pathname)) {
    const ip = clientIp(request);
    const rl = checkRateLimitEdge(`api:${ip}`, 120, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // CSRF protection for state-changing API requests
  if (requiresCsrfProtection(request.method, pathname) && !validateCsrf(request)) {
    return NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 });
  }

  const hasValidAccess = await isValidAccessToken(accessToken);
  const hasSession = hasValidAccess || Boolean(refreshToken);

  const isProtected = isProtectedPath(pathname);
  const isAuthRoute = authRoutes.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasValidAccess) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (subdomainSlug) {
    response.cookies.set(TENANT_COOKIE, subdomainSlug, { path: "/", sameSite: "lax" });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|images/).*)"],
};
