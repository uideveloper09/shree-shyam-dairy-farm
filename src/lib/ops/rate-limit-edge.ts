/** Lightweight in-memory rate limiter for Edge middleware (per isolate). */
const buckets = new Map<string, { count: number; resetAt: number }>();

export type EdgeRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimitEdge(key: string, limit = 120, windowSec = 60): EdgeRateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSec * 1000;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** API paths that skip global rate limiting. */
export function isRateLimitExempt(pathname: string): boolean {
  const exempt = [
    "/api/payment/webhook",
    "/api/v1/tenant/billing/stripe/webhook",
    "/api/v1/tenant/billing/razorpay/webhook",
    "/api/health",
    "/api/metrics",
    "/_next/",
  ];
  return exempt.some((p) => pathname.startsWith(p));
}
