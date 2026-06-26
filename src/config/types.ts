import type { AppEnvironment } from "./_shared";
import type { AppConfigSlice } from "./app";
import type { AuthConfig } from "./auth";
import type { DatabaseConfig } from "./database";
import type { PaymentConfig } from "./payment";
import type { AiConfig } from "./ai";
import type { EmailConfig } from "./email";
import type { StorageConfig } from "./storage";
import type { RuntimeConstants } from "./constants";
import type { LoggingConfig } from "./logging";

/** Root application configuration — strongly typed, validated at startup. */
export interface AppConfig {
  app: AppConfigSlice;
  auth: AuthConfig;
  database: DatabaseConfig;
  payment: PaymentConfig;
  ai: AiConfig;
  email: EmailConfig;
  storage: StorageConfig;
  logging: LoggingConfig;
  constants: RuntimeConstants;
}

export type EnvValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  config: AppConfig;
};

/** @deprecated Use AppConfig */
export type EnvConfig = {
  nodeEnv: string;
  appEnv: AppEnvironment;
  appVersion: string;
  isProduction: boolean;
  database: DatabaseConfig;
  jwt: AuthConfig["jwt"];
  app: AppConfigSlice["public"];
  razorpay: PaymentConfig["razorpay"];
  openai: AiConfig;
  email: EmailConfig;
  admin: AppConfigSlice["admin"];
  redis: DatabaseConfig["redis"];
  security: AuthConfig["security"];
};

export function toLegacyEnvConfig(config: AppConfig): EnvConfig {
  return {
    nodeEnv: config.app.nodeEnv,
    appEnv: config.app.env,
    appVersion: config.app.version,
    isProduction: config.app.isProduction,
    database: config.database,
    jwt: config.auth.jwt,
    app: config.app.public,
    razorpay: config.payment.razorpay,
    openai: config.ai,
    email: config.email,
    admin: config.app.admin,
    redis: config.database.redis,
    security: config.auth.security,
  };
}
