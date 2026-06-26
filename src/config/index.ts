import { z } from "zod";
import {
  applyLegacyAliases,
  isProductionEnv,
  requireEnv,
  resolveAppEnv,
  type AppEnvironment,
} from "./_shared";
import {
  appEnvSchema,
  buildAppConfig,
  refineAppEnv,
  validateAppDev,
  validateAppStrict,
} from "./app";
import {
  authEnvSchema,
  buildAuthConfig,
  collectAuthWarnings,
  refineAuthEnv,
  validateAuthDev,
  validateAuthStrict,
} from "./auth";
import {
  databaseEnvSchema,
  buildDatabaseConfig,
  refineDatabaseEnv,
  validateDatabaseDev,
  validateDatabaseStrict,
} from "./database";
import {
  paymentEnvSchema,
  buildPaymentConfig,
  refinePaymentEnv,
  validatePaymentDev,
} from "./payment";
import { aiEnvSchema, buildAiConfig, refineAiEnv, validateAiDev } from "./ai";
import { emailEnvSchema, buildEmailConfig, refineEmailEnv, validateEmailDev } from "./email";
import { storageEnvSchema, buildStorageConfig, refineStorageEnv } from "./storage";
import { loggingEnvSchema, buildLoggingConfig } from "./logging";
import { RUNTIME_CONSTANTS } from "./constants";
import type { AppConfig, EnvValidationResult } from "./types";
import { toLegacyEnvConfig, type EnvConfig } from "./types";

// ─── Composed schema ─────────────────────────────────────────────────────────

export const envSchema = appEnvSchema
  .merge(authEnvSchema)
  .merge(databaseEnvSchema)
  .merge(paymentEnvSchema)
  .merge(aiEnvSchema)
  .merge(emailEnvSchema)
  .merge(storageEnvSchema)
  .merge(loggingEnvSchema)
  .superRefine((data, ctx) => {
    refineAppEnv(data, ctx);
    refineAuthEnv(data, ctx);
    refineDatabaseEnv(data, ctx);
    refinePaymentEnv(data, ctx);
    refineAiEnv(data, ctx);
    refineEmailEnv(data, ctx);
    refineStorageEnv(data, ctx);
  });

export type EnvInput = z.infer<typeof envSchema>;

// ─── Build full config ───────────────────────────────────────────────────────

export function buildAppConfigFromEnv(data: EnvInput): AppConfig {
  const appEnv = resolveAppEnv();
  return {
    app: buildAppConfig(data, appEnv),
    auth: buildAuthConfig(data),
    database: buildDatabaseConfig(data),
    payment: buildPaymentConfig(data),
    ai: buildAiConfig(data),
    email: buildEmailConfig(data),
    storage: buildStorageConfig(data),
    logging: buildLoggingConfig(data, {
      isProduction: appEnv === "production",
      nodeEnv: data.NODE_ENV,
    }),
    constants: RUNTIME_CONSTANTS,
  };
}

function fallbackEnvInput(): EnvInput {
  return {
    NODE_ENV: process.env.NODE_ENV as EnvInput["NODE_ENV"],
    APP_ENV: process.env.APP_ENV,
    APP_VERSION: process.env.APP_VERSION,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES,
    JWT_REFRESH_REMEMBER_EXPIRES: process.env.JWT_REFRESH_REMEMBER_EXPIRES,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    RAZORPAY_TENANT_WEBHOOK_SECRET: process.env.RAZORPAY_TENANT_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN,
    DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    CRON_SECRET: process.env.CRON_SECRET,
    METRICS_TOKEN: process.env.METRICS_TOKEN,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    OTP_SALT: process.env.OTP_SALT,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

// ─── Validation ────────────────────────────────────────────────────────────────

let cachedConfig: AppConfig | null = null;

export function validateEnv(options: { strict?: boolean } = {}): EnvValidationResult {
  applyLegacyAliases();

  const strict = options.strict ?? isProductionEnv();
  const errors: string[] = [];
  const warnings: string[] = [];

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      errors.push(path ? `${path}: ${issue.message}` : issue.message);
    }
  }

  const parsed = result.success ? result.data : fallbackEnvInput();
  const config = buildAppConfigFromEnv(parsed);

  collectAuthWarnings(warnings);
  if (process.env.NEXTAUTH_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push("NEXTAUTH_URL is deprecated — set NEXT_PUBLIC_APP_URL instead");
  }

  if (strict) {
    validateDatabaseStrict(config.database, errors);
    validateAuthStrict(config.auth, errors);
    validateAppStrict(config.app, errors, warnings);
  } else {
    validateDatabaseDev(config.database, warnings);
    validateAuthDev(config.auth, warnings);
    validateAppDev(config.app, warnings);
    validatePaymentDev(config.payment, warnings);
    validateAiDev(config.ai, warnings);
    validateEmailDev(config.email, warnings);
  }

  return { ok: errors.length === 0, errors, warnings, config };
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv().config;
  }
  return cachedConfig;
}

export async function validateConfigAtStartup(): Promise<EnvValidationResult> {
  applyLegacyAliases();

  const result = validateEnv({ strict: isProductionEnv() });
  const { logger } = await import("@/lib/ops/logger");

  for (const w of result.warnings) {
    logger.warn("env_validation_warning", { message: w });
  }

  if (!result.ok) {
    for (const e of result.errors) {
      logger.error("env_validation_error", { message: e });
    }
    if (isProductionEnv()) {
      throw new Error(`Environment validation failed:\n${result.errors.join("\n")}`);
    }
  } else {
    logger.info("env_validation_ok", {
      appEnv: result.config.app.env,
      database: result.config.database.configured,
      razorpay: result.config.payment.razorpay.configured,
      openai: result.config.ai.configured,
      email: result.config.email.resend.configured,
    });
  }

  cachedConfig = result.config;
  return result;
}

export function resetConfigCache(): void {
  cachedConfig = null;
}

// ─── Convenience accessors ───────────────────────────────────────────────────

export function getAppEnv(): AppEnvironment {
  return resolveAppEnv();
}

export function isProduction(): boolean {
  return isProductionEnv();
}

export { requireEnv };

/** @deprecated Use getConfig() */
export function getEnv(): EnvConfig {
  return toLegacyEnvConfig(getConfig());
}

/** @deprecated Use validateConfigAtStartup() */
export const validateEnvAtStartup = validateConfigAtStartup;

/** @deprecated Use resetConfigCache() */
export const resetEnvCache = resetConfigCache;

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { AppConfig, EnvConfig, EnvValidationResult, AppEnvironment };
export { toLegacyEnvConfig };
export * from "./app";
export * from "./auth";
export * from "./database";
export * from "./payment";
export * from "./ai";
export * from "./email";
export * from "./storage";
export * from "./constants";
