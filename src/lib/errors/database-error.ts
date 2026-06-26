import { ERROR_CODES } from "./codes";
import { AppError } from "./app-error";
import type { ErrorDetails } from "./types";

export type DatabaseErrorMeta = {
  prismaCode?: string;
  model?: string;
  field?: string;
  operation?: string;
};

export class DatabaseError extends AppError {
  readonly meta: DatabaseErrorMeta;

  constructor(
    message = "Database error",
    options?: {
      statusCode?: number;
      details?: ErrorDetails;
      cause?: unknown;
      meta?: DatabaseErrorMeta;
      isOperational?: boolean;
    }
  ) {
    const statusCode = options?.statusCode ?? 500;
    const code = statusCode === 503 ? ERROR_CODES.DATABASE_UNAVAILABLE : ERROR_CODES.DATABASE_ERROR;

    super(message, {
      code,
      statusCode,
      details: options?.details,
      cause: options?.cause,
      isOperational: options?.isOperational ?? statusCode < 500,
    });
    this.meta = options?.meta ?? {};
  }
}

export class DatabaseNotConfiguredError extends DatabaseError {
  constructor(message = "Database not configured") {
    super(message, { statusCode: 503, isOperational: true });
  }
}
