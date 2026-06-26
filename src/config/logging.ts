import { z } from "zod";

export const LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal", "silent"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const loggingEnvSchema = z.object({
  LOG_LEVEL: z.enum(LOG_LEVELS).optional(),
  LOG_PRETTY: z.string().optional(),
  LOG_FILE_ENABLED: z.string().optional(),
  LOG_FILE_PATH: z.string().optional(),
  LOG_FILE_SYNC: z.string().optional(),
  LOG_SERVICE_NAME: z.string().optional(),
});

export type LoggingEnvInput = z.infer<typeof loggingEnvSchema>;

function envFlag(value: string | boolean | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

export type LoggingConfig = {
  level: LogLevel;
  pretty: boolean;
  serviceName: string;
  file: {
    enabled: boolean;
    path: string;
    sync: boolean;
  };
};

export function buildLoggingConfig(
  data: LoggingEnvInput,
  opts?: { isProduction?: boolean; nodeEnv?: string }
): LoggingConfig {
  const isProduction = opts?.isProduction ?? false;
  const nodeEnv = opts?.nodeEnv ?? "development";
  const defaultLevel: LogLevel = nodeEnv === "test" ? "silent" : isProduction ? "info" : "debug";

  return {
    level: data.LOG_LEVEL ?? defaultLevel,
    pretty: envFlag(data.LOG_PRETTY) ?? (!isProduction && nodeEnv !== "test"),
    serviceName: data.LOG_SERVICE_NAME ?? "shree-shyam-erp",
    file: {
      enabled: envFlag(data.LOG_FILE_ENABLED) ?? false,
      path: data.LOG_FILE_PATH ?? "logs/app.log",
      sync: envFlag(data.LOG_FILE_SYNC) ?? false,
    },
  };
}
