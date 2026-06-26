import { AppError } from "./app-error";
import type { AppErrorOptions } from "./types";

/** Factory for custom domain errors without subclassing. */
export function createAppError(message: string, options: AppErrorOptions): AppError {
  return new AppError(message, options);
}

export type {
  AppErrorOptions,
  ErrorDetails,
  ErrorContext,
  ApiErrorBody,
  ApiSuccessBody,
} from "./types";
export { ERROR_CODES, ERROR_SLUGS } from "./codes";
export type { ErrorCode } from "./codes";

export { AppError, isAppError, assertAppError } from "./app-error";
export {
  BadRequestError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
} from "./http-errors";
export {
  ValidationError,
  parseOrThrow,
  parseOrThrowAsync,
  zodIssuesToValidationIssues,
  type ValidationIssue,
} from "./validation-error";
export {
  AuthenticationError,
  InvalidCredentialsError,
  TokenExpiredError,
  ForbiddenError,
  InsufficientPermissionsError,
} from "./auth-error";
export {
  DatabaseError,
  DatabaseNotConfiguredError,
  type DatabaseErrorMeta,
} from "./database-error";
export { isPrismaClientError, mapPrismaError } from "./prisma";
export {
  normalizeError,
  getErrorStatus,
  getErrorCode,
  getErrorMessage,
  isOperationalError,
  shouldExposeErrorDetails,
  logErrorContext,
  type NormalizedError,
} from "./normalize";
export {
  buildErrorBody,
  errorResponse,
  successResponse,
  throwNotFound,
  throwUnauthorized,
  throwForbidden,
  throwValidation,
  throwInternal,
} from "./response";
export { handleApiError, withApiErrorHandler, type ApiErrorHandlerContext } from "./api-handler";
export {
  assertFound,
  assertAuth,
  assertPermission,
  assertDatabaseConfigured,
  rethrowIfAppError,
} from "./assert";
