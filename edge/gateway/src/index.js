/**
 * Edge Gateway runtime — Node-RED companion on Raspberry Pi / Jetson
 * Forwards normalized telemetry to cloud REST API
 */
import mqtt from "mqtt";

const CLOUD_URL =
  process.env.SSD_CLOUD_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.NODE_ENV === "production" ? "https://kunwardairy.com" : "http://localhost:3000");
const GATEWAY_KEY = process.env.SSD_GATEWAY_KEY;
const GATEWAY_API_KEY = process.env.SSD_GATEWAY_API_KEY;
const MQTT_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";

if (!GATEWAY_KEY || !GATEWAY_API_KEY) {
  console.error("Set SSD_GATEWAY_KEY and SSD_GATEWAY_API_KEY");
  process.exit(1);
}

const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log("[edge-gateway] Connected to MQTT");
  client.subscribe(`ssd/default/gateways/${GATEWAY_KEY}/commands/#`);
  setInterval(sendHeartbeat, 30000);
});

client.on("message", (topic, payload) => {
  console.log("[edge-gateway] Command:", topic, payload.toString());
});

async function sendHeartbeat() {
  await fetch(`${CLOUD_URL}/api/v1/gateway`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-gateway-id": GATEWAY_KEY,
      "x-gateway-key": GATEWAY_API_KEY,
    },
    body: JSON.stringify({ type: "heartbeat", queueDepth: 0 }),
  });
}

export async function uplink(messages) {
  const res = await fetch(`${CLOUD_URL}/api/v1/gateway`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-gateway-id": GATEWAY_KEY,
      "x-gateway-key": GATEWAY_API_KEY,
    },
    body: JSON.stringify({ messages }),
  });
  return res.json();
}

console.log("[edge-gateway] Running for", GATEWAY_KEY);
