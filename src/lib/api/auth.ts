import { createHash, timingSafeEqual } from "crypto";
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";
import { TIER_RATE_LIMITS } from "@/lib/api/scopes";

export type ApiKeyContext = {
  keyId: string;
  developerId: string;
  userId: string;
  tier: string;
  scopes: string[];
  rateLimit: number;
  keyPrefix: string;
};

function hashKey(key: string): string {
  const salt = process.env.API_KEY_SALT || process.env.FARM_API_KEY_SALT || "ssd-api-default-salt";
  return createHash("sha256").update(`${salt}:${key}`).digest("hex");
}

export function extractApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token.startsWith("ssd_")) return token;
  }
  const header = request.headers.get("x-api-key");
  if (header?.startsWith("ssd_")) return header.trim();
  return null;
}

export async function authenticateApiKey(key: string): Promise<ApiKeyContext | null> {
  if (!isDatabaseConfigured() || !key.startsWith("ssd_")) return null;

  const keyHash = hashKey(key);
  const record = await prisma.apiKey.findFirst({
    where: { keyHash, revokedAt: null },
    include: {
      developer: { include: { user: { select: { id: true } } } },
    },
  });

  if (!record || !record.developer.isActive) return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;

  const tier = record.developer.tier;
  const rateLimit = record.rateLimit || TIER_RATE_LIMITS[tier] || 60;

  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    keyId: record.id,
    developerId: record.developerId,
    userId: record.developer.userId,
    tier,
    scopes: record.scopes,
    rateLimit,
    keyPrefix: record.keyPrefix,
  };
}

export function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function generateApiKeyValue(env: "live" | "test" = "live"): string {
  const bytes = createHash("sha256")
    .update(`${Date.now()}-${Math.random()}`)
    .digest("hex")
    .slice(0, 48);
  return `ssd_${env}_${bytes}`;
}

export function getKeyPrefix(key: string): string {
  return key.slice(0, 16);
}

export { hashKey as hashApiKey };
