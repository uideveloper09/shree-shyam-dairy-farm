/** Machine-readable error codes (stable API contract). */
export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  DATABASE_UNAVAILABLE: "DATABASE_UNAVAILABLE",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Snake_case aliases used in JSON `error` field (legacy-friendly). */
export const ERROR_SLUGS: Record<ErrorCode, string> = {
  BAD_REQUEST: "bad_request",
  VALIDATION_FAILED: "validation_failed",
  UNAUTHORIZED: "unauthorized",
  INVALID_CREDENTIALS: "invalid_credentials",
  TOKEN_EXPIRED: "token_expired",
  FORBIDDEN: "forbidden",
  INSUFFICIENT_PERMISSIONS: "insufficient_permissions",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMITED: "rate_limited",
  INTERNAL_ERROR: "internal_error",
  DATABASE_ERROR: "database_error",
  DATABASE_UNAVAILABLE: "database_unavailable",
  SERVICE_UNAVAILABLE: "service_unavailable",
};
