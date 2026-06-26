import { ERROR_CODES } from "./codes";
import { AppError } from "./app-error";
import type { ErrorDetails } from "./types";

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.BAD_REQUEST, statusCode: 400, details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.NOT_FOUND, statusCode: 404, details });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.CONFLICT, statusCode: 409, details });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.RATE_LIMITED, statusCode: 429, details });
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", cause?: unknown) {
    super(message, {
      code: ERROR_CODES.INTERNAL_ERROR,
      statusCode: 500,
      cause,
      isOperational: false,
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.SERVICE_UNAVAILABLE, statusCode: 503, details });
  }
}
