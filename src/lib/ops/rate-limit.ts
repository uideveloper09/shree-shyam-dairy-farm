import { cacheGet, cacheSet } from "@/lib/ops/redis";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export async function rateLimit(key: string, limit = 60, windowSec = 60): Promise<RateLimitResult> {
  const now = Date.now();
  const redisKey = `rl:${key}`;

  const cached = await cacheGet(redisKey);
  if (cached) {
    const parsed = JSON.parse(cached) as { count: number; resetAt: number };
    if (parsed.resetAt > now) {
      const success = parsed.count < limit;
      if (success) {
        parsed.count += 1;
        await cacheSet(redisKey, JSON.stringify(parsed), Math.ceil((parsed.resetAt - now) / 1000));
      }
      return {
        success,
        limit,
        remaining: Math.max(0, limit - parsed.count),
        resetAt: parsed.resetAt,
      };
    }
  }

  const bucket = memoryBuckets.get(key);
  if (bucket && bucket.resetAt > now) {
    const success = bucket.count < limit;
    if (success) bucket.count += 1;
    const result = {
      success,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: bucket.resetAt,
    };
    await cacheSet(redisKey, JSON.stringify(bucket), windowSec);
    return result;
  }

  const resetAt = now + windowSec * 1000;
  const fresh = { count: 1, resetAt };
  memoryBuckets.set(key, fresh);
  await cacheSet(redisKey, JSON.stringify(fresh), windowSec);

  return { success: true, limit, remaining: limit - 1, resetAt };
}
