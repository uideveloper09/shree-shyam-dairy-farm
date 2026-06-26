import { ERROR_CODES, ERROR_SLUGS } from "./codes";
import type { AppErrorOptions, ErrorDetails } from "./types";

/**
 * Base application error — operational errors map to HTTP responses;
 * non-operational errors become 500 in production.
 */
export class AppError extends Error {
  readonly code: AppErrorOptions["code"];
  readonly statusCode: number;
  readonly details?: ErrorDetails;
  readonly isOperational: boolean;
  override readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.cause = options.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get slug(): string {
    return ERROR_SLUGS[this.code];
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      slug: this.slug,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      isOperational: this.isOperational,
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function assertAppError(
  condition: unknown,
  error: AppError | (() => AppError)
): asserts condition {
  if (!condition) {
    throw typeof error === "function" ? error() : error;
  }
}
