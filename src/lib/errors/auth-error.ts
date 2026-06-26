import { ERROR_CODES } from "./codes";
import { AppError } from "./app-error";
import type { ErrorDetails } from "./types";

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.UNAUTHORIZED, statusCode: 401, details });
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid credentials", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.INVALID_CREDENTIALS, statusCode: 401, details });
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = "Token expired", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.TOKEN_EXPIRED, statusCode: 401, details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: ErrorDetails) {
    super(message, { code: ERROR_CODES.FORBIDDEN, statusCode: 403, details });
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message = "Insufficient permissions", details?: ErrorDetails) {
    super(message, {
      code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      statusCode: 403,
      details,
    });
  }
}
