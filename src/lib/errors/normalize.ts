import { ZodError } from "zod";
import { ERROR_CODES, ERROR_SLUGS } from "./codes";
import { AppError, isAppError } from "./app-error";
import { InternalServerError } from "./http-errors";
import { ValidationError } from "./validation-error";
import { isPrismaClientError, mapPrismaError } from "./prisma";
import type { ErrorContext } from "./types";

export type NormalizedError = {
  appError: AppError;
  statusCode: number;
  code: AppError["code"];
  slug: string;
  message: string;
  details?: AppError["details"];
  isOperational: boolean;
  original: unknown;
};

/**
 * Coerce any thrown value into a structured AppError.
 */
export function normalizeError(error: unknown): NormalizedError {
  if (isAppError(error)) {
    return toNormalized(error, error);
  }

  if (error instanceof ZodError) {
    const appError = ValidationError.fromZod(error);
    return toNormalized(appError, error);
  }

  if (isPrismaClientError(error)) {
    const appError = mapPrismaError(error);
    return toNormalized(appError, error);
  }

  if (error instanceof Error) {
    const appError = new InternalServerError(error.message, error);
    return toNormalized(appError, error);
  }

  const appError = new InternalServerError("An unexpected error occurred");
  return toNormalized(appError, error);
}

function toNormalized(appError: AppError, original: unknown): NormalizedError {
  return {
    appError,
    statusCode: appError.statusCode,
    code: appError.code,
    slug: appError.slug,
    message: appError.message,
    details: appError.details,
    isOperational: appError.isOperational,
    original,
  };
}

export function getErrorStatus(error: unknown): number {
  return normalizeError(error).statusCode;
}

export function getErrorCode(error: unknown): string {
  const normalized = normalizeError(error);
  return normalized.code;
}

export function getErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (isAppError(error)) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export function isOperationalError(error: unknown): boolean {
  return normalizeError(error).isOperational;
}

export function shouldExposeErrorDetails(error: unknown, isProduction: boolean): boolean {
  if (!isProduction) return true;
  return isOperationalError(error);
}

export function logErrorContext(error: unknown, context?: ErrorContext) {
  return {
    ...context,
    code: getErrorCode(error),
    status: getErrorStatus(error),
    operational: isOperationalError(error),
  };
}

export { ERROR_CODES, ERROR_SLUGS };
