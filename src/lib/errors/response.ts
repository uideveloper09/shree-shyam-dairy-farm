import { NextResponse } from "next/server";
import { resolveAppEnv } from "@/config/_shared";
import { ERROR_SLUGS } from "./codes";
import { AppError } from "./app-error";
import { NotFoundError } from "./http-errors";
import { InternalServerError } from "./http-errors";
import { AuthenticationError, ForbiddenError } from "./auth-error";
import { ValidationError, type ValidationIssue } from "./validation-error";
import { normalizeError, shouldExposeErrorDetails } from "./normalize";
import type { ApiErrorBody, ApiSuccessBody, ErrorContext } from "./types";

export function buildErrorBody(
  error: AppError,
  options?: { requestId?: string; exposeDetails?: boolean }
): ApiErrorBody {
  const expose = options?.exposeDetails ?? true;
  const body: ApiErrorBody = {
    success: false,
    error: ERROR_SLUGS[error.code],
    message: error.message,
    code: error.code,
  };

  if (options?.requestId) {
    body.requestId = options.requestId;
  }

  if (expose && error.details !== undefined) {
    body.details = error.details;
  }

  return body;
}

export function errorResponse(
  error: unknown,
  context?: ErrorContext & { headers?: Record<string, string> }
): NextResponse<ApiErrorBody> {
  const isProduction = resolveAppEnv() === "production";
  const normalized = normalizeError(error);
  const exposeDetails = shouldExposeErrorDetails(normalized.appError, isProduction);

  const body = buildErrorBody(normalized.appError, {
    requestId: context?.requestId,
    exposeDetails,
  });

  if (!exposeDetails && !normalized.isOperational) {
    body.message = "Internal server error";
    delete body.details;
  }

  return NextResponse.json(body, {
    status: normalized.statusCode,
    headers: context?.headers,
  });
}

export function successResponse<T>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>
): NextResponse<ApiSuccessBody<T>> {
  const body: ApiSuccessBody<T> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status });
}

export function throwNotFound(message?: string, details?: AppError["details"]): never {
  throw new NotFoundError(message, details);
}

export function throwUnauthorized(message?: string, details?: AppError["details"]): never {
  throw new AuthenticationError(message, details);
}

export function throwForbidden(message?: string, details?: AppError["details"]): never {
  throw new ForbiddenError(message, details);
}

export function throwValidation(message?: string, issues?: ValidationIssue[]): never {
  throw new ValidationError(message, issues);
}

export function throwInternal(message?: string, cause?: unknown): never {
  throw new InternalServerError(message, cause);
}
