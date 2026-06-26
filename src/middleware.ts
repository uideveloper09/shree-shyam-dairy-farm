import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveTenantFromHost } from "@/lib/tenant/resolve";
import { TENANT_COOKIE, TENANT_HEADER } from "@/constants/tenant";

const protectedPrefixes = ["/account", "/admin", "/m"];
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("ssd_access")?.value;

  const requestHeaders = new Headers(request.headers);
  const host = request.headers.get("host") || "";
  const subdomainSlug = resolveTenantFromHost(host);
  if (subdomainSlug) {
    requestHeaders.set(TENANT_HEADER, subdomainSlug);
  }

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthRoute = authRoutes.some((p) => pathname.startsWith(p));

  if (isProtected && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (subdomainSlug) {
    response.cookies.set(TENANT_COOKIE, subdomainSlug, { path: "/", sameSite: "lax" });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
