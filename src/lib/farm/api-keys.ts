import { createHash, randomBytes } from "crypto";

export function hashApiKey(key: string): string {
  const salt = process.env.FARM_API_KEY_SALT || "ssd-farm-default-salt";
  return createHash("sha256").update(`${salt}:${key}`).digest("hex");
}

export function generateApiKey(prefix: string): string {
  return `${prefix}_${randomBytes(24).toString("hex")}`;
}

export function verifyApiKey(key: string, hash: string | null | undefined): boolean {
  if (!key || !hash) return false;
  return hashApiKey(key) === hash;
}

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.FARM_CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("x-cron-secret") || request.headers.get("authorization");
  return header === secret || header === `Bearer ${secret}`;
}
