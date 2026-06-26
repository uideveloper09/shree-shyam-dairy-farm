"use client";

import { serializeError } from "../shared/serialize";
import type { LogMeta } from "../shared/types";

export type ErrorLogContext = LogMeta & {
  method?: string;
  path?: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  digest?: string;
  sentry?: boolean;
  source?: string;
  componentStack?: string | null;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function reportToBrowser(error: unknown): void {
  if (typeof window === "undefined") return;
  const reportError = (window as Window & { reportError?: (err: unknown) => void }).reportError;
  if (typeof reportError === "function") {
    try {
      reportError(toError(error));
    } catch {
      // Browser may reject non-Error values; ignore.
    }
  }
}

function write(
  level: "error" | "warn",
  message: string,
  error: unknown,
  context?: ErrorLogContext
): void {
  const payload = {
    message,
    err: serializeError(error),
    domain: "error",
    logType: "error",
    runtime: "client",
    ...context,
  };

  reportToBrowser(error);

  if (level === "warn") {
    console.warn(message, payload);
  } else {
    console.error(message, payload);
  }
}

/** Browser-safe error logger — no Node or Pino dependencies. */
export const errorLogger = {
  log(message: string, error: unknown, context?: ErrorLogContext) {
    write("error", message, error, context);
  },
  unhandled(error: unknown, context?: ErrorLogContext) {
    write("error", "unhandled_error", error, { unhandled: true, ...context });
  },
  api(error: unknown, context?: ErrorLogContext) {
    write("error", "api_error", error, { source: "api", ...context });
  },
  worker(error: unknown, context?: ErrorLogContext) {
    write("error", "worker_error", error, { source: "worker", ...context });
  },
  external(service: string, error: unknown, context?: ErrorLogContext) {
    write("error", "external_service_error", error, {
      source: "external",
      service,
      ...context,
    });
  },
  warn(message: string, error: unknown, context?: ErrorLogContext) {
    write("warn", message, error, context);
  },
};
