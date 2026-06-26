# Farm Platform Setup

Production IoT + AI layer on the existing Next.js ERP.

## Architecture

```
ESP32 / RFID / Sensors → MQTT Broker → Edge Gateway (Node-RED)
    → Next.js API (/api/v1/*) → PostgreSQL → Admin Dashboard (/admin/farm)
    → Android/iOS PWA · WhatsApp alerts
```

## Quick start

```bash
npx prisma db push
npx prisma generate
npm run db:seed-farm
npm run dev
```

Visit `/admin/farm` (requires ADMIN or FARM_MANAGER role).

## Admin modules

| Module          | Route                     |
| --------------- | ------------------------- |
| Overview        | `/admin/farm`             |
| IoT devices     | `/admin/farm/iot`         |
| MQTT            | `/admin/farm/mqtt`        |
| Edge Gateway    | `/admin/farm/gateway`     |
| Autonomous Farm | `/admin/farm/autonomy`    |
| Weather         | `/admin/farm/weather`     |
| CCTV            | `/admin/farm/cctv`        |
| AI Vision       | `/admin/farm/vision`      |
| AI Platform     | `/admin/farm/ai`          |
| Voice AI        | `/admin/farm/voice`       |
| Farm Agent      | `/admin/farm/agent`       |
| Predictions     | `/admin/farm/predictions` |

## Environment

```env
DATABASE_URL=...
FARM_API_KEY_SALT=random-string
SEED_DEVICE_API_KEY=...        # from seed output
VISION_WEBHOOK_API_KEY=...
MQTT_BRIDGE_ENABLED=false
MQTT_BROKER_URL=mqtt://localhost:1883
SSD_CLOUD_URL=http://localhost:3000
CRON_SECRET=...
OPENAI_API_KEY=...             # optional, for AI chat
```

## Workers (not on Vercel)

```bash
npm run worker:mqtt
```

## Edge components

- `edge/gateway/` — Node.js gateway for Raspberry Pi
- `edge/vision/` — Python YOLO/OpenCV (Jetson)

## Related guides

- [IoT Device Onboarding](./iot-setup.md)
- [MQTT Configuration](./mqtt-setup.md)
- [AI & Vision](./ai-platform.md)
- [IoT architecture](../architecture/iot.md)
