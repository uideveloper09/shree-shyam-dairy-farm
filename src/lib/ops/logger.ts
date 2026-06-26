/**
 * @deprecated Import from `@/lib/logging`, `@/lib/logging/server`, or domain paths
 * (`@/lib/logging/audit`, `@/lib/logging/api`, `@/lib/logging/payment`).
 * Backward-compatible facade used across the codebase.
 */
import { getLogger, requestLogger, auditLogger } from "@/lib/logging/server";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const app = () => getLogger();

export const logger = {
  debug(message: string, meta?: LogMeta) {
    app().debug(message, meta);
  },
  info(message: string, meta?: LogMeta) {
    app().info(message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    app().warn(message, meta);
  },
  error(message: string, meta?: LogMeta) {
    app().error(message, meta);
  },
  audit(action: string, meta?: LogMeta) {
    auditLogger.record(action, meta);
  },
  request(method: string, path: string, status: number, durationMs: number, meta?: LogMeta) {
    requestLogger.log(method, path, status, durationMs, meta);
  },
};
