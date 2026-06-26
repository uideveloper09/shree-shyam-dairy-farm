import "server-only";

import pino, { type Logger as PinoLogger, type LoggerOptions } from "pino";
import { buildLoggingConfig, type LoggingConfig } from "@/config/logging";
import { resolveAppEnv } from "@/config/_shared";
import { LOG_REDACT_CENSOR, LOG_REDACT_PATHS } from "../../shared/redact";
import { createRotatableDestination, registerRotationSignalHandlers } from "./rotation";

function resolveLoggingConfig(): LoggingConfig {
  return buildLoggingConfig(
    {
      LOG_LEVEL: process.env.LOG_LEVEL as LoggingConfig["level"] | undefined,
      LOG_PRETTY: process.env.LOG_PRETTY,
      LOG_FILE_ENABLED: process.env.LOG_FILE_ENABLED,
      LOG_FILE_PATH: process.env.LOG_FILE_PATH,
      LOG_FILE_SYNC: process.env.LOG_FILE_SYNC,
      LOG_SERVICE_NAME: process.env.LOG_SERVICE_NAME,
    },
    {
      isProduction: resolveAppEnv() === "production",
      nodeEnv: process.env.NODE_ENV,
    }
  );
}

function buildBaseOptions(config: LoggingConfig): LoggerOptions {
  return {
    level: config.level,
    name: config.serviceName,
    base: {
      env: resolveAppEnv(),
      service: config.serviceName,
      pid: process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [...LOG_REDACT_PATHS],
      censor: LOG_REDACT_CENSOR,
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  };
}

function createPrettyStream() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pretty = require("pino-pretty") as (opts: Record<string, unknown>) => NodeJS.WritableStream;
  return pretty({
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname",
    singleLine: false,
  });
}

export function createRootPinoLogger(config = resolveLoggingConfig()): PinoLogger {
  const options = buildBaseOptions(config);

  if (config.file.enabled) {
    registerRotationSignalHandlers();
    const fileDest = createRotatableDestination(config.file.path, config.file.sync);
    const streams: pino.StreamEntry[] = [{ stream: process.stdout }];

    if (config.pretty && process.env.NODE_ENV !== "test") {
      streams[0] = { stream: createPrettyStream() };
    }

    const fileLevel = config.level === "silent" ? ("trace" as const) : (config.level as pino.Level);
    streams.push({ stream: fileDest, level: fileLevel });
    return pino(options, pino.multistream(streams));
  }

  if (config.pretty && process.env.NODE_ENV !== "test") {
    return pino(options, createPrettyStream());
  }

  return pino(options);
}

let rootLogger: PinoLogger | null = null;

export function getRootPinoLogger(): PinoLogger {
  if (!rootLogger) {
    rootLogger = createRootPinoLogger();
  }
  return rootLogger;
}

/** Reset cached root logger (tests). */
export function resetRootPinoLogger(): void {
  rootLogger = null;
}

export function getLoggingRuntimeConfig(): LoggingConfig {
  return resolveLoggingConfig();
}
