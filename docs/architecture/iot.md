# IoT Architecture

MQTT-based sensor ingest, edge gateway relay, offline queuing, and autonomy rule evaluation on the Shree Shyam farm platform.

## Topology

```
ESP32 / RFID / Sensors
        │ MQTT (1883 / 8883 TLS)
        ▼
   MQTT Broker (Mosquitto / EMQX / HiveMQ)
        │
        ├── edge/gateway/ (Node.js on Raspberry Pi)
        │       └── HTTP + FARM_API_KEY → Next.js API
        │
        └── workers/mqtt-bridge.worker.ts
                └── POST /api/v1/iot/data
                        │
                        ▼
              PostgreSQL (SensorReading, IoTDevice)
                        │
                        ▼
              Autonomy Engine (AutomationRule)
                        │
                        ▼
              ActuatorDevice commands / alerts
```

## Components

| Component       | Path                                    | Role                      |
| --------------- | --------------------------------------- | ------------------------- |
| MQTT service    | `lib/services/farm/mqtt.service.ts`     | Health, offline queue     |
| IoT ingest      | `lib/services/farm/iot.service.ts`      | Sensor data persistence   |
| Gateway service | `lib/services/farm/gateway.service.ts`  | Edge gateway registration |
| Autonomy        | `lib/services/farm/autonomy.service.ts` | Rule evaluation on ingest |
| MQTT worker     | `workers/mqtt-bridge.worker.ts`         | Broker → API bridge       |
| Edge gateway    | `edge/gateway/`                         | Pi-side MQTT → HTTP       |
| Vision edge     | `edge/vision/`                          | Python YOLO on Jetson     |

## API Endpoints

| Method     | Path                  | Auth               |
| ---------- | --------------------- | ------------------ |
| `POST`     | `/api/v1/iot/data`    | Device API key     |
| `GET`      | `/api/v1/mqtt/health` | Farm role          |
| `GET/POST` | `/api/v1/gateway`     | Gateway API key    |
| `GET/POST` | `/api/v1/autonomy`    | Farm role          |
| `GET/POST` | `/api/v1/weather`     | Farm role / device |
| `POST`     | `/api/v1/cctv/events` | Camera webhook key |

## Data Models

| Model                               | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `IoTDevice`                         | Registered sensors/actuators per `farmId` |
| `SensorReading`                     | Time-series readings                      |
| `EdgeGateway` / `GatewayHeartbeat`  | Edge node health                          |
| `MqttOfflineMessage`                | Store-and-forward when broker down        |
| `AutomationRule` / `ActuatorDevice` | Autonomy config                           |
| `EmergencyEvent`                    | Critical alerts                           |
| `WeatherStation` / `WeatherReading` | Weather data                              |
| `CctvCamera` / `CctvEvent`          | CCTV events                               |

## Environment

```env
MQTT_BRIDGE_ENABLED=true
MQTT_BROKER_URL=mqtts://broker.example.com:8883
FARM_API_KEY_SALT=random-string
SEED_DEVICE_API_KEY=...        # from seed output
SSD_CLOUD_URL=https://your-domain.com
```

## Workers

MQTT bridge does not run on Vercel serverless:

```bash
MQTT_BRIDGE_ENABLED=true npm run worker:mqtt
```

Docker prod: `docker-compose.prod.yml` → `worker-mqtt` service.

## Offline Resilience

1. Gateway buffers messages when cloud unreachable
2. `MqttOfflineMessage` table stores pending payloads
3. Worker replays on reconnect via `mqtt.service.ts`

## Admin UI

`/admin/farm` — dashboards for IoT, MQTT, gateway, autonomy, weather, CCTV, vision.

See [farm-guides](../farm-guides/setup.md).

## Related

- [AI](./ai.md) — vision and predictions on sensor data
- [Deployment](./deployment.md) — worker deployment
- [ER diagram](../er-diagrams/farm-iot.md)
