import { NextResponse } from "next/server";

/** Security headers applied via next.config + API helpers */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
};

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function getCspHeader(isProd: boolean): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://api.openai.com",
    "frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://www.google.com https://maps.google.com https://*.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (isProd) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

/** Basic SQL injection pattern guard for user-provided search strings */
export function sanitizeSearchInput(input: string): string {
  return input
    .replace(/['";\\]|(--)|(\/\*)/g, "")
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|UNION|ALTER|CREATE|TRUNCATE|EXEC)\b/gi, "")
    .trim()
    .slice(0, 200);
}

export function validateOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return allowedOrigins.some((o) => origin === o || origin.endsWith(o));
}
