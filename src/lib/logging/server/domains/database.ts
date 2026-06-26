import "server-only";

import { createDomainChild } from "../core/domain-child";
import { serializeError } from "../../shared/serialize";
import type { DatabaseLogMeta, LogMeta } from "../../shared/types";

const pino = createDomainChild("database", "database");

export const databaseLogger = {
  debug(message: string, meta?: DatabaseLogMeta) {
    pino().debug(meta ?? {}, message);
  },
  info(message: string, meta?: DatabaseLogMeta) {
    pino().info(meta ?? {}, message);
  },
  warn(message: string, meta?: DatabaseLogMeta) {
    pino().warn(meta ?? {}, message);
  },
  error(message: string, meta?: DatabaseLogMeta) {
    pino().error(meta ?? {}, message);
  },
  query(operation: string, meta?: DatabaseLogMeta) {
    pino().debug({ operation, ...meta }, "db_query");
  },
  slowQuery(operation: string, durationMs: number, meta?: DatabaseLogMeta) {
    pino().warn({ operation, durationMs, slow: true, ...meta }, "db_slow_query");
  },
  connected(meta?: LogMeta) {
    pino().info(meta ?? {}, "db_connected");
  },
  disconnected(meta?: LogMeta) {
    pino().info(meta ?? {}, "db_disconnected");
  },
  errorOccurred(operation: string, error: unknown, meta?: DatabaseLogMeta) {
    pino().error({ operation, err: serializeError(error), ...meta }, "db_error");
  },
  migration(message: string, meta?: LogMeta) {
    pino().info(meta ?? {}, message);
  },
};
