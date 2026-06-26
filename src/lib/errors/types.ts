import type { ErrorCode } from "./codes";

export type ErrorDetails = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type ApiErrorBody = {
  success: false;
  error: string;
  message: string;
  code: ErrorCode;
  details?: ErrorDetails;
  requestId?: string;
};

export type ApiSuccessBody<T = unknown> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiResponseBody<T = unknown> = ApiSuccessBody<T> | ApiErrorBody;

export type ErrorContext = {
  method?: string;
  path?: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
};

export type AppErrorOptions = {
  code: ErrorCode;
  statusCode: number;
  details?: ErrorDetails;
  cause?: unknown;
  isOperational?: boolean;
};
