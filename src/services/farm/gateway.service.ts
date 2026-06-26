import { prisma } from "@/repositories/prisma";
import { generateApiKey, hashApiKey, verifyApiKey } from "@/lib/farm/api-keys";
import type { IngestEnvelope } from "@/lib/farm/types";
import { ingestDeviceData } from "@/services/farm/iot.service";

export async function provisionGateway(name: string, platform = "RASPBERRY_PI") {
  const gatewayKey = `GW-SSD-${Date.now().toString(36).toUpperCase()}`;
  const apiKey = generateApiKey("gw");
  const gateway = await prisma.edgeGateway.create({
    data: {
      gatewayKey,
      name,
      platform,
      apiKeyHash: hashApiKey(apiKey),
      status: "PROVISIONED",
    },
  });
  return { gateway, apiKeyPlain: apiKey };
}

export async function authenticateGateway(gatewayKey: string, apiKey: string) {
  const gateway = await prisma.edgeGateway.findUnique({ where: { gatewayKey } });
  if (!gateway || !verifyApiKey(apiKey, gateway.apiKeyHash)) return null;
  return gateway;
}

export async function recordHeartbeat(
  gatewayKey: string,
  payload: { queueDepth?: number; connectivity?: Record<string, unknown> }
) {
  const gateway = await prisma.edgeGateway.findUnique({ where: { gatewayKey } });
  if (!gateway) throw new Error("Gateway not found");

  await prisma.gatewayHeartbeat.create({
    data: {
      gatewayId: gateway.id,
      status: "ONLINE",
      queueDepth: payload.queueDepth ?? 0,
      connectivity: payload.connectivity as object | undefined,
    },
  });

  return prisma.edgeGateway.update({
    where: { id: gateway.id },
    data: { status: "ONLINE", lastSeenAt: new Date() },
  });
}

export async function gatewayIngest(gatewayKey: string, messages: IngestEnvelope[]) {
  const results = [];
  for (const msg of messages) {
    const deviceKey = msg.deviceKey;
    if (!deviceKey) continue;
    results.push(await ingestDeviceData(deviceKey, msg, "GATEWAY"));
  }
  return results;
}

export async function listGateways() {
  return prisma.edgeGateway.findMany({
    orderBy: { createdAt: "desc" },
    include: { heartbeats: { take: 1, orderBy: { recordedAt: "desc" } } },
  });
}

export async function getGatewayConfig(gatewayKey: string) {
  const gateway = await prisma.edgeGateway.findUnique({ where: { gatewayKey } });
  if (!gateway) throw new Error("Gateway not found");
  return {
    gatewayKey: gateway.gatewayKey,
    configVersion: gateway.configVersion,
    config: gateway.config ?? {
      mqtt: { url: process.env.MQTT_BROKER_URL || "mqtts://localhost:8883" },
      uplink: ["MQTT", "REST"],
      adapters: ["mqtt", "modbus", "serial", "weather"],
    },
  };
}
