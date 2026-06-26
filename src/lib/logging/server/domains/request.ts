import "server-only";

import { createDomainChild } from "../core/domain-child";
import type { LogMeta, RequestLogMeta } from "../../shared/types";

const pino = createDomainChild("request", "request");

export const requestLogger = {
  log(method: string, path: string, status: number, durationMs: number, meta?: LogMeta) {
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    const payload: RequestLogMeta = { method, path, status, durationMs, ...meta };
    pino()[level](payload, "http_request");
  },
  started(method: string, path: string, meta?: LogMeta) {
    pino().debug({ method, path, ...meta }, "http_request_started");
  },
  completed(method: string, path: string, status: number, durationMs: number, meta?: LogMeta) {
    requestLogger.log(method, path, status, durationMs, meta);
  },
};
