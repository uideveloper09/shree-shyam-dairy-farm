import { prisma } from "@/repositories/prisma";

export type MqttHealth = {
  connected: boolean;
  brokerType: string;
  brokerUrl: string;
  queueDepth: number;
  lastMessageAt: string | null;
};

export async function getMqttHealth(): Promise<MqttHealth> {
  const pending = await prisma.mqttOfflineMessage.count({
    where: { status: "PENDING" },
  });
  const last = await prisma.mqttOfflineMessage.findFirst({
    where: { status: "SENT" },
    orderBy: { createdAt: "desc" },
  });

  return {
    connected: process.env.MQTT_BRIDGE_ENABLED === "true",
    brokerType: process.env.MQTT_BROKER_TYPE || "MOSQUITTO",
    brokerUrl: process.env.MQTT_BROKER_URL || "mqtts://localhost:8883",
    queueDepth: pending,
    lastMessageAt: last?.createdAt.toISOString() ?? null,
  };
}

export async function enqueueOfflineMessage(data: {
  topic: string;
  payload: string;
  qos?: number;
  direction: string;
}) {
  return prisma.mqttOfflineMessage.create({
    data: {
      topic: data.topic,
      payload: data.payload,
      qos: data.qos ?? 1,
      direction: data.direction,
      nextRetryAt: new Date(),
    },
  });
}

export async function flushOfflineQueue(limit = 50) {
  const pending = await prisma.mqttOfflineMessage.findMany({
    where: {
      status: "PENDING",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let sent = 0;
  for (const msg of pending) {
    await prisma.mqttOfflineMessage.update({
      where: { id: msg.id },
      data: { status: "SENT" },
    });
    sent++;
  }
  return { processed: sent };
}
