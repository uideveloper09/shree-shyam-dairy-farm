import "server-only";

import type { Logger as PinoLogger } from "pino";
import { getRootPinoLogger } from "./pino-factory";
import type { LogMeta } from "../../shared/types";

export type AppLogger = {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
  fatal(message: string, meta?: LogMeta): void;
  child(bindings: LogMeta): AppLogger;
  pino: PinoLogger;
};

function wrapPino(pino: PinoLogger): AppLogger {
  return {
    debug(message, meta) {
      pino.debug(meta ?? {}, message);
    },
    info(message, meta) {
      pino.info(meta ?? {}, message);
    },
    warn(message, meta) {
      pino.warn(meta ?? {}, message);
    },
    error(message, meta) {
      pino.error(meta ?? {}, message);
    },
    fatal(message, meta) {
      pino.fatal(meta ?? {}, message);
    },
    child(bindings) {
      return wrapPino(pino.child(bindings));
    },
    pino,
  };
}

/** Root application logger — use domain loggers for structured categories. */
export function createLogger(bindings?: LogMeta): AppLogger {
  const root = getRootPinoLogger();
  const instance = bindings
    ? root.child({ domain: "app", ...bindings })
    : root.child({ domain: "app" });
  return wrapPino(instance);
}

let defaultLogger: AppLogger | null = null;

export function getLogger(): AppLogger {
  if (!defaultLogger) {
    defaultLogger = createLogger();
  }
  return defaultLogger;
}

export function resetLoggerCache(): void {
  defaultLogger = null;
}
