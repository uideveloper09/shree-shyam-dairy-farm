import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/repositories/prisma";
import { getRedis } from "@/lib/ops/redis";
import { isQueueAvailable } from "@/lib/ops/queue";
import { getAppEnv } from "@/config";
import { getStorageProvider } from "@/lib/ops/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<
    string,
    {
      status: string;
      latencyMs?: number;
      error?: string;
      provider?: string;
      broker?: string;
      model?: string;
    }
  > = {};

  checks.app = { status: "ok" };

  if (isDatabaseConfigured()) {
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch (e) {
      checks.database = { status: "error", error: (e as Error).message };
    }
  } else {
    checks.database = { status: "not_configured" };
  }

  const redisStart = Date.now();
  try {
    const redis = await getRedis();
    if (redis) {
      await redis.ping();
      checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
    } else {
      checks.redis = { status: "not_configured" };
    }
  } catch (e) {
    checks.redis = { status: "error", error: (e as Error).message };
  }

  checks.queue = { status: isQueueAvailable() ? "ok" : "not_configured" };
  checks.storage = { status: "ok", provider: getStorageProvider() };

  checks.mqtt = {
    status: process.env.MQTT_BRIDGE_ENABLED === "true" ? "ok" : "not_configured",
    broker: process.env.MQTT_BROKER_URL ? "configured" : "not_configured",
  };

  checks.ai = {
    status:
      process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your_")
        ? "ok"
        : "not_configured",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };

  const unhealthy = Object.values(checks).some((c) => c.status === "error");
  const status = unhealthy ? 503 : 200;

  return NextResponse.json(
    {
      status: unhealthy ? "unhealthy" : "healthy",
      env: getAppEnv(),
      version: process.env.APP_VERSION || "0.1.0",
      storage: getStorageProvider(),
      layers: {
        frontend: "nextjs",
        api: "app-router",
        auth: "jwt-rbac",
        queue: checks.queue?.status,
        cache: checks.redis?.status,
        database: checks.database?.status,
        storage: checks.storage?.provider,
        mqtt: checks.mqtt?.status,
        ai: checks.ai?.status,
      },
      uptimeSec: Math.floor(process.uptime()),
      checks,
      latencyMs: Date.now() - start,
    },
    { status }
  );
}
