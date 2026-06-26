import { z } from "zod";
import { isPlaceholder, isValidUrl } from "./_shared";

export const appEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  APP_ENV: z.string().optional(),
  APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_APP_DOMAIN: z.string().optional(),
  DEFAULT_TENANT_SLUG: z.string().optional(),
  /** @deprecated Use NEXT_PUBLIC_APP_URL */
  NEXTAUTH_URL: z.string().optional(),
  ADMIN_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  METRICS_TOKEN: z.string().optional(),
});

export type AppEnvInput = z.infer<typeof appEnvSchema>;

export type AppConfigSlice = {
  nodeEnv: string;
  env: import("./_shared").AppEnvironment;
  version: string;
  isProduction: boolean;
  public: {
    url: string;
    domain: string;
    tenantSlug: string;
  };
  admin: {
    secret: string | undefined;
    configured: boolean;
  };
  cron: {
    secret: string | undefined;
    configured: boolean;
  };
  metrics: {
    token: string | undefined;
    configured: boolean;
  };
};

export function refineAppEnv(data: AppEnvInput, ctx: z.RefinementCtx): void {
  if (data.NEXTAUTH_URL && !isValidUrl(data.NEXTAUTH_URL)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "NEXTAUTH_URL must be a valid URL",
      path: ["NEXTAUTH_URL"],
    });
  }
  if (data.NEXT_PUBLIC_APP_URL && !isValidUrl(data.NEXT_PUBLIC_APP_URL)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "NEXT_PUBLIC_APP_URL must be a valid URL",
      path: ["NEXT_PUBLIC_APP_URL"],
    });
  }
  if (data.ADMIN_SECRET && data.ADMIN_SECRET.length < 16) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ADMIN_SECRET must be at least 16 characters",
      path: ["ADMIN_SECRET"],
    });
  }
}

export function buildAppConfig(
  data: AppEnvInput,
  appEnv: import("./_shared").AppEnvironment
): AppConfigSlice {
  const adminSecret = data.ADMIN_SECRET;
  return {
    nodeEnv: data.NODE_ENV || "development",
    env: appEnv,
    version: data.APP_VERSION || "0.1.0",
    isProduction: appEnv === "production",
    public: {
      url: data.NEXT_PUBLIC_APP_URL || data.NEXTAUTH_URL || "http://localhost:3000",
      domain: data.NEXT_PUBLIC_APP_DOMAIN || "shree-shyam-dairy-farm.vercel.app",
      tenantSlug: data.DEFAULT_TENANT_SLUG || "default",
    },
    admin: {
      secret: adminSecret,
      configured: Boolean(adminSecret && !isPlaceholder(adminSecret)),
    },
    cron: {
      secret: data.CRON_SECRET,
      configured: Boolean(data.CRON_SECRET && !isPlaceholder(data.CRON_SECRET)),
    },
    metrics: {
      token: data.METRICS_TOKEN,
      configured: Boolean(data.METRICS_TOKEN),
    },
  };
}

export function validateAppStrict(app: AppConfigSlice, errors: string[], warnings: string[]): void {
  if (app.isProduction && !app.admin.configured) {
    errors.push("ADMIN_SECRET is required in production");
  }
  if (app.isProduction && !app.public.url.startsWith("https://")) {
    warnings.push("NEXT_PUBLIC_APP_URL should use https:// in production");
  }
}

export function validateAppDev(app: AppConfigSlice, warnings: string[]): void {
  if (!app.admin.configured) {
    warnings.push("ADMIN_SECRET not set — content admin API unprotected");
  }
}
