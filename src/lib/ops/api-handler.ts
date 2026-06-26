import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleApiError } from "@/lib/errors";
import { requestLogger } from "@/lib/logging/server";
import { metrics } from "@/lib/ops/metrics";
import { rateLimit } from "@/lib/ops/rate-limit";
import { applySecurityHeaders } from "@/lib/ops/security";

export type ApiHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

type WithApiOptions = {
  rateLimit?: { limit: number; windowSec: number };
  name?: string;
};

export function withApi(handler: ApiHandler, options?: WithApiOptions) {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    const start = Date.now();
    const path = new URL(request.url).pathname;
    const method = request.method;

    try {
      if (options?.rateLimit) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const rl = await rateLimit(
          `${options.name || path}:${ip}`,
          options.rateLimit.limit,
          options.rateLimit.windowSec
        );
        if (!rl.success) {
          metrics.increment("ssd_rate_limit_exceeded_total", 1, { path });
          return applySecurityHeaders(
            NextResponse.json({ error: "Too many requests" }, { status: 429 })
          );
        }
      }

      const response = await handler(request, context);
      const duration = Date.now() - start;
      requestLogger.log(method, path, response.status, duration);
      metrics.increment("ssd_http_requests_total", 1, { method, status: String(response.status) });
      metrics.observe("ssd_http_request_duration_ms", duration, { path });
      return applySecurityHeaders(response);
    } catch (error) {
      return handleApiError(error, { method, path, startTime: start });
    }
  };
}
