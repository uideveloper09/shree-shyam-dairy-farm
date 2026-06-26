/** Shared helpers for config modules. */

export const PLACEHOLDER_PATTERN = /your_|xxxxx|change[-_]?me|placeholder|sk-your/i;

export function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return PLACEHOLDER_PATTERN.test(value);
}

export function isPostgresUrl(value: string): boolean {
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Map legacy NextAuth env vars to current names. */
export function applyLegacyAliases(): void {
  if (!process.env.JWT_ACCESS_SECRET && process.env.NEXTAUTH_SECRET) {
    process.env.JWT_ACCESS_SECRET = process.env.NEXTAUTH_SECRET;
  }
  if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NEXTAUTH_URL) {
    process.env.NEXT_PUBLIC_APP_URL = process.env.NEXTAUTH_URL;
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export type AppEnvironment = "development" | "testing" | "staging" | "production";

export function resolveAppEnv(): AppEnvironment {
  const env = process.env.APP_ENV || process.env.NODE_ENV || "development";
  if (env === "production") return "production";
  if (env === "staging") return "staging";
  if (env === "test" || env === "testing") return "testing";
  return "development";
}

export function isProductionEnv(): boolean {
  return resolveAppEnv() === "production";
}
