# IoT Device Onboarding

Register sensors and actuators on the farm platform.

## Prerequisites

- Farm admin access (`FARM_MANAGER` or `IOT_OPERATOR`)
- `FARM_API_KEY_SALT` configured
- Seed or manual device registration

## Seed devices

```bash
npm run db:seed-farm
```

Output includes `SEED_DEVICE_API_KEY` — save to `.env.local`.

## Register a device

Devices are stored in `IoTDevice` with:

- `farmId` — matches your tenant slug
- `deviceType` — sensor, actuator, gateway
- `apiKeyHash` — hashed device API key

## Send sensor data

```http
POST /api/v1/iot/data
X-Device-Key: your-device-api-key
Content-Type: application/json

{
  "deviceId": "sensor-temp-01",
  "metric": "temperature",
  "value": 4.2,
  "unit": "celsius"
}
```

Data is stored in `SensorReading` and evaluated by the autonomy engine.

## Edge gateway

For Pi-based aggregation, deploy `edge/gateway/`:

1. Set `MQTT_BROKER_URL` and `SSD_CLOUD_URL`
2. Configure farm API key
3. Gateway subscribes to MQTT topics and forwards to `/api/v1/iot/data`

See [MQTT Configuration](./mqtt-setup.md).

## Health check

```http
GET /api/v1/mqtt/health
```

## Related

- [Farm setup](./setup.md)
- [ER diagram: Farm & IoT](../er-diagrams/farm-iot.md)
