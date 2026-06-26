import { z } from "zod";
import { isPlaceholder } from "./_shared";

export const authEnvSchema = z.object({
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRES: z.string().optional(),
  JWT_REFRESH_EXPIRES: z.string().optional(),
  JWT_REFRESH_REMEMBER_EXPIRES: z.string().optional(),
  /** @deprecated Use JWT_ACCESS_SECRET */
  NEXTAUTH_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  OTP_SALT: z.string().optional(),
  ACCOUNT_LOCK_ATTEMPTS: z.string().optional(),
  ACCOUNT_LOCK_MINUTES: z.string().optional(),
  BOT_DETECTION_ENABLED: z.string().optional(),
  GEO_BLOCKING_ENABLED: z.string().optional(),
});

export type AuthEnvInput = z.infer<typeof authEnvSchema>;

export type AuthConfig = {
  jwt: {
    accessSecret: string | undefined;
    refreshSecret: string | undefined;
    accessExpires: string;
    refreshExpires: string;
    refreshRememberExpires: string;
  };
  cookies: {
    access: string;
    refresh: string;
  };
  security: {
    encryptionKey: string | undefined;
    otpSalt: string;
    accountLockAttempts: number;
    accountLockMinutes: number;
    botDetectionEnabled: boolean;
    geoBlockingEnabled: boolean;
  };
};

export const AUTH_COOKIE_NAMES = {
  access: "ssd_access",
  refresh: "ssd_refresh",
} as const;

export function refineAuthEnv(data: AuthEnvInput, ctx: z.RefinementCtx): void {
  const jwtAccess = data.JWT_ACCESS_SECRET || data.NEXTAUTH_SECRET;
  if (jwtAccess && jwtAccess.length < 32) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "JWT_ACCESS_SECRET (or NEXTAUTH_SECRET) must be at least 32 characters",
      path: ["JWT_ACCESS_SECRET"],
    });
  }
}

export function buildAuthConfig(data: AuthEnvInput): AuthConfig {
  const jwtAccess = data.JWT_ACCESS_SECRET || data.NEXTAUTH_SECRET;
  const jwtRefresh = data.JWT_REFRESH_SECRET || jwtAccess;

  return {
    jwt: {
      accessSecret: jwtAccess,
      refreshSecret: jwtRefresh,
      accessExpires: data.JWT_ACCESS_EXPIRES || "15m",
      refreshExpires: data.JWT_REFRESH_EXPIRES || "7d",
      refreshRememberExpires: data.JWT_REFRESH_REMEMBER_EXPIRES || "30d",
    },
    cookies: AUTH_COOKIE_NAMES,
    security: {
      encryptionKey: data.ENCRYPTION_KEY,
      otpSalt: data.OTP_SALT || "ssd-otp",
      accountLockAttempts: Number(data.ACCOUNT_LOCK_ATTEMPTS || 5),
      accountLockMinutes: Number(data.ACCOUNT_LOCK_MINUTES || 30),
      botDetectionEnabled: data.BOT_DETECTION_ENABLED !== "false",
      geoBlockingEnabled: data.GEO_BLOCKING_ENABLED === "true",
    },
  };
}

export function collectAuthWarnings(warnings: string[]): void {
  if (process.env.NEXTAUTH_SECRET && !process.env.JWT_ACCESS_SECRET) {
    warnings.push("NEXTAUTH_SECRET is deprecated — set JWT_ACCESS_SECRET instead");
  }
  if (process.env.NEXTAUTH_SECRET && process.env.JWT_ACCESS_SECRET) {
    warnings.push(
      "Both NEXTAUTH_SECRET and JWT_ACCESS_SECRET are set — JWT_ACCESS_SECRET takes precedence"
    );
  }
}

export function validateAuthStrict(auth: AuthConfig, errors: string[]): void {
  if (!auth.jwt.accessSecret || auth.jwt.accessSecret.length < 32) {
    errors.push("JWT_ACCESS_SECRET (min 32 chars) is required in production");
  }
  if (!auth.jwt.refreshSecret || auth.jwt.refreshSecret.length < 32) {
    errors.push("JWT_REFRESH_SECRET (min 32 chars) is required in production");
  }
}

export function validateAuthDev(auth: AuthConfig, warnings: string[]): void {
  if (!auth.jwt.accessSecret) {
    warnings.push("JWT_ACCESS_SECRET not set — auth will fail at runtime");
  }
}

/** Token TTL values aligned with auth config (for session/cookie code). */
export function tokenTtlFromAuth(auth: AuthConfig) {
  return {
    access: auth.jwt.accessExpires,
    refresh: auth.jwt.refreshExpires,
    refreshRemember: auth.jwt.refreshRememberExpires,
    emailVerify: 24 * 60 * 60,
    resetPassword: 60 * 60,
    otp: 10 * 60,
  } as const;
}
