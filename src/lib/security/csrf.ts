import { AUTH_COOKIE } from "@/constants/auth";

const CSRF_HEADER = "x-csrf-token";

/** Paths exempt from CSRF (webhooks, cron, device ingest, public auth). */
const CSRF_EXEMPT_PREFIXES = [
  "/api/payment/webhook",
  "/api/v1/tenant/billing/stripe/webhook",
  "/api/v1/tenant/billing/razorpay/webhook",
  "/api/v1/integrations/webhooks",
  "/api/health",
  "/api/metrics",
  "/api/cron",
  "/api/v1/iot/data",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/oauth/google",
  "/api/v1/auth/otp",
  "/api/public/",
  "/api/graphql",
];

export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

export function requiresCsrfProtection(method: string, pathname: string): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) return false;
  if (!pathname.startsWith("/api/")) return false;
  return !isCsrfExempt(pathname);
}

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Double-submit: cookie ssd_csrf must match X-CSRF-Token header when cookie is set. */
export function validateCsrf(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie");
  const cookieToken = parseCookie(cookieHeader, AUTH_COOKIE.csrf);
  if (!cookieToken) return true;

  const headerToken = request.headers.get(CSRF_HEADER);
  if (!headerToken) return false;
  return cookieToken === headerToken;
}

export { CSRF_HEADER };
