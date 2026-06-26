import { z } from "zod";
import { isPlaceholder, isPostgresUrl } from "./_shared";

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export type DatabaseEnvInput = z.infer<typeof databaseEnvSchema>;

export type DatabaseConfig = {
  url: string | undefined;
  configured: boolean;
  redis: {
    url: string | undefined;
    configured: boolean;
  };
};

export function refineDatabaseEnv(data: DatabaseEnvInput, ctx: z.RefinementCtx): void {
  if (data.DATABASE_URL && !isPostgresUrl(data.DATABASE_URL)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "DATABASE_URL must start with postgresql:// or postgres://",
      path: ["DATABASE_URL"],
    });
  }
}

export function buildDatabaseConfig(data: DatabaseEnvInput): DatabaseConfig {
  return {
    url: data.DATABASE_URL,
    configured: Boolean(data.DATABASE_URL && !isPlaceholder(data.DATABASE_URL)),
    redis: {
      url: data.REDIS_URL,
      configured: Boolean(data.REDIS_URL),
    },
  };
}

export function validateDatabaseStrict(db: DatabaseConfig, errors: string[]): void {
  if (!db.configured) {
    errors.push("DATABASE_URL is required in production");
  }
}

export function validateDatabaseDev(db: DatabaseConfig, warnings: string[]): void {
  if (!db.configured) {
    warnings.push("DATABASE_URL not set — database features disabled");
  }
  if (!db.redis.configured) {
    warnings.push("REDIS_URL not set — queue/cache use in-memory fallback");
  }
}
