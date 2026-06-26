/**
 * MQTT Bridge Worker — run outside Vercel (Railway, Pi, Docker)
 * Usage: npm run worker:mqtt
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[mqtt-bridge] Starting…");
  console.log("[mqtt-bridge] Broker:", process.env.MQTT_BROKER_URL || "mqtts://localhost:8883");

  const mqttEnabled = process.env.MQTT_BRIDGE_ENABLED === "true";

  if (!mqttEnabled) {
    console.log("[mqtt-bridge] MQTT_BRIDGE_ENABLED is not true — health-only mode");
    setInterval(async () => {
      const pending = await prisma.mqttOfflineMessage.count({ where: { status: "PENDING" } });
      console.log(`[mqtt-bridge] Queue depth: ${pending}`);
    }, 30000);
    return;
  }

  try {
    const mqtt = await import("mqtt");
    const client = mqtt.connect(process.env.MQTT_BROKER_URL || "mqtt://localhost:1883", {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: `ssd-bridge-${Date.now()}`,
    });

    client.on("connect", () => {
      console.log("[mqtt-bridge] Connected");
      client.subscribe("ssd/+/devices/+/telemetry", { qos: 1 });
      client.subscribe("ssd/+/gateways/+/telemetry", { qos: 1 });
    });

    client.on("message", async (topic, payload) => {
      console.log("[mqtt-bridge] Message:", topic);
      try {
        const body = JSON.parse(payload.toString());
        const baseUrl = process.env.SSD_CLOUD_URL || "http://localhost:3000";
        await fetch(`${baseUrl}/api/v1/iot/data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-key": body.deviceKey || "",
            Authorization: `Bearer ${process.env.SEED_DEVICE_API_KEY || ""}`,
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        await prisma.mqttOfflineMessage.create({
          data: {
            topic,
            payload: payload.toString(),
            direction: "FORWARD_TO_ERP",
            status: "PENDING",
            nextRetryAt: new Date(),
          },
        });
      }
    });
  } catch (e) {
    console.error("[mqtt-bridge] mqtt package not installed or connection failed:", e);
    console.log("[mqtt-bridge] Install: npm install mqtt");
  }
}

main().catch(console.error);
