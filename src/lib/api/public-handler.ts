import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticateApiKey, extractApiKey } from "@/lib/api/auth";
import { hasScope, type ApiScope } from "@/lib/api/scopes";
import { apiVersionHeaders, CURRENT_API_VERSION } from "@/lib/api/versioning";
import { AuthenticationError, ForbiddenError, handleApiError, errorResponse } from "@/lib/errors";
import type { ApiKeyContext } from "@/lib/api/auth";
import { rateLimit } from "@/lib/ops/rate-limit";
import { applySecurityHeaders } from "@/lib/ops/security";
import { logger } from "@/lib/ops/logger";
import { metrics } from "@/lib/ops/metrics";

export type PublicApiHandler = (
  request: NextRequest,
  context: { apiKey: ApiKeyContext; params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

type PublicApiOptions = {
  scope: ApiScope;
  version?: string;
};

export function withPublicApi(handler: PublicApiHandler, options: PublicApiOptions) {
  return async (
    request: NextRequest,
    routeContext?: { params?: Promise<Record<string, string>> }
  ) => {
    const start = Date.now();
    const path = new URL(request.url).pathname;

    try {
      const rawKey = extractApiKey(request);
      if (!rawKey) {
        return publicError(
          new AuthenticationError(
            "Provide API key via Authorization: Bearer ssd_live_... or X-API-Key header",
            { reason: "missing_api_key" }
          )
        );
      }

      const apiKey = await authenticateApiKey(rawKey);
      if (!apiKey) {
        return publicError(
          new AuthenticationError("Invalid or revoked API key", { reason: "invalid_api_key" })
        );
      }

      if (!hasScope(apiKey.scopes, options.scope)) {
        return publicError(
          new ForbiddenError(`Required scope: ${options.scope}`, {
            reason: "insufficient_scope",
            requiredScope: options.scope,
          })
        );
      }

      const rl = await rateLimit(`apikey:${apiKey.keyId}`, apiKey.rateLimit, 60);
      if (!rl.success) {
        metrics.increment("ssd_public_api_rate_limited", 1);
        return applySecurityHeaders(
          NextResponse.json(
            { error: "rate_limit_exceeded", message: "Too many requests" },
            {
              status: 429,
              headers: {
                ...apiVersionHeaders(CURRENT_API_VERSION),
                "X-RateLimit-Limit": String(rl.limit),
                "X-RateLimit-Remaining": String(rl.remaining),
                "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
                "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
              },
            }
          )
        );
      }

      const response = await handler(request, { apiKey, params: routeContext?.params });
      const duration = Date.now() - start;

      response.headers.set("X-RateLimit-Limit", String(rl.limit));
      response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      response.headers.set("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1000)));
      Object.entries(apiVersionHeaders()).forEach(([k, v]) => response.headers.set(k, v));

      logger.request(request.method, path, response.status, duration, { apiKey: apiKey.keyPrefix });
      metrics.increment("ssd_public_api_requests", 1, { path, status: String(response.status) });

      return applySecurityHeaders(response);
    } catch (error) {
      return handleApiError(error, {
        path,
        method: request.method,
        startTime: start,
        headers: apiVersionHeaders(),
      });
    }
  };
}

function publicError(error: AuthenticationError | ForbiddenError) {
  return applySecurityHeaders(
    errorResponse(error, { headers: apiVersionHeaders(CURRENT_API_VERSION) })
  );
}

export function publicJson(data: unknown, status = 200) {
  return NextResponse.json(
    { data, meta: { version: CURRENT_API_VERSION, timestamp: new Date().toISOString() } },
    { status, headers: apiVersionHeaders() }
  );
}
