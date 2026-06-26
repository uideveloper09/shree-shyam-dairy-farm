import "server-only";

import { createDomainChild } from "../core/domain-child";
import { serializeError } from "../../shared/serialize";
import type { LogMeta } from "../../shared/types";

const pino = createDomainChild("api", "api");

export const apiLogger = {
  debug(message: string, meta?: LogMeta) {
    pino().debug(meta ?? {}, message);
  },
  info(message: string, meta?: LogMeta) {
    pino().info(meta ?? {}, message);
  },
  warn(message: string, meta?: LogMeta) {
    pino().warn(meta ?? {}, message);
  },
  error(message: string, meta?: LogMeta) {
    pino().error(meta ?? {}, message);
  },
  handlerStarted(method: string, path: string, meta?: LogMeta) {
    pino().debug({ method, path, ...meta }, "api_handler_started");
  },
  handlerCompleted(
    method: string,
    path: string,
    status: number,
    durationMs: number,
    meta?: LogMeta
  ) {
    pino().info({ method, path, status, durationMs, ...meta }, "api_handler_completed");
  },
  handlerFailed(method: string, path: string, error: unknown, meta?: LogMeta) {
    pino().error({ method, path, err: serializeError(error), ...meta }, "api_handler_failed");
  },
  validationFailed(path: string, issues: unknown, meta?: LogMeta) {
    pino().warn({ path, issues, ...meta }, "api_validation_failed");
  },
  rateLimited(path: string, meta?: LogMeta) {
    pino().warn({ path, ...meta }, "api_rate_limited");
  },
};
