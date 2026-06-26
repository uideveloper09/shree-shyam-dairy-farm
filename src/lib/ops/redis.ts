import { logger } from "@/lib/ops/logger";

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
  ping(): Promise<string>;
  quit(): Promise<void>;
};

let client: RedisClient | null = null;
let initFailed = false;

const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

export async function getRedis(): Promise<RedisClient | null> {
  if (initFailed || !process.env.REDIS_URL) return null;
  if (client) return client;

  try {
    const { default: Redis } = await import("ioredis");
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    await redis.connect();
    client = redis as unknown as RedisClient;
    logger.info("redis_connected");
    return client;
  } catch (e) {
    initFailed = true;
    logger.warn("redis_unavailable_using_memory", { error: String(e) });
    return null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getRedis();
  if (redis) return redis.get(key);

  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

export async function cacheSet(key: string, value: string, ttlSec = 300): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(key, value, "EX", ttlSec);
    return;
  }
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.del(key);
    return;
  }
  memoryStore.delete(key);
}
