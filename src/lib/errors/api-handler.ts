import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/ops/security";
import { errorLogger } from "@/lib/logging/server";
import { requestLogger } from "@/lib/logging/server";
import { metrics } from "@/lib/ops/metrics";
import { normalizeError, logErrorContext } from "./normalize";
import { errorResponse } from "./response";
import type { ErrorContext } from "./types";

export type ApiErrorHandlerContext = ErrorContext & {
  startTime?: number;
  log?: boolean;
  metrics?: boolean;
  headers?: Record<string, string>;
};

/**
 * Central API error handler — maps errors to consistent JSON responses.
 */
export function handleApiError(error: unknown, context?: ApiErrorHandlerContext): NextResponse {
  const normalized = normalizeError(error);
  const path = context?.path;
  const method = context?.method;

  if (context?.log !== false) {
    if (normalized.statusCode >= 500) {
      errorLogger.api(normalized.original, logErrorContext(error, context));
    } else if (normalized.statusCode >= 400) {
      errorLogger.warn("api_client_error", normalized.original, logErrorContext(error, context));
    }
  }

  if (context?.metrics !== false && path) {
    metrics.increment("ssd_http_errors_total", 1, {
      path,
      code: normalized.code,
      status: String(normalized.statusCode),
    });
  }

  if (method && path && context?.startTime !== undefined) {
    requestLogger.log(method, path, normalized.statusCode, Date.now() - context.startTime);
  }

  return applySecurityHeaders(
    errorResponse(error, {
      method: context?.method,
      path: context?.path,
      requestId: context?.requestId,
      tenantId: context?.tenantId,
      userId: context?.userId,
      headers: context?.headers,
    })
  );
}

export type ApiRouteHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap a route handler with centralized error handling.
 * Prefer `withApi` from `@/lib/ops/api-handler` for rate-limit + metrics.
 */
export function withApiErrorHandler(handler: ApiRouteHandler) {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    const start = Date.now();
    const path = new URL(request.url).pathname;
    const method = request.method;

    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error, { method, path, startTime: start });
    }
  };
}
