# MQTT Configuration

Configure the MQTT broker, bridge worker, and offline message queue.

## Broker options

- Mosquitto (self-hosted)
- EMQX Cloud
- HiveMQ

## Environment

```env
MQTT_BRIDGE_ENABLED=true
MQTT_BROKER_URL=mqtts://broker.example.com:8883
SSD_CLOUD_URL=https://your-domain.com
```

Use `mqtt://` for local dev (port 1883), `mqtts://` for TLS (port 8883).

## Bridge worker

The worker connects to the broker and relays messages to the Next.js API:

```bash
MQTT_BRIDGE_ENABLED=true npm run worker:mqtt
```

Docker production: `worker-mqtt` service in `docker-compose.prod.yml`.

**Does not run on Vercel** — deploy as a separate process.

## Offline queue

When the cloud is unreachable:

1. Messages stored in `MqttOfflineMessage`
2. Worker replays on reconnect via `lib/services/farm/mqtt.service.ts`

## Admin monitoring

`/admin/farm/mqtt` — broker health, pending offline messages, last message timestamp.

API: `GET /api/v1/mqtt/health`

## Edge gateway

`edge/gateway/src/index.js` — Pi-side MQTT client that forwards to HTTP API with farm API key.

## Topic conventions

Recommended pattern:

```
farm/{farmId}/sensors/{deviceId}/reading
farm/{farmId}/actuators/{deviceId}/command
```

## Related

- [IoT setup](./iot-setup.md)
- [IoT architecture](../architecture/iot.md)
