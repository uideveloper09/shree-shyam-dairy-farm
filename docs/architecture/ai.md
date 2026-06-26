# AI Architecture

LLM-powered features across storefront chat, farm intelligence, voice, vision, and autonomous agent workflows.

## Stack

| Provider | Env              | Default model                  |
| -------- | ---------------- | ------------------------------ |
| OpenAI   | `OPENAI_API_KEY` | `gpt-4o-mini` (`OPENAI_MODEL`) |

Health check: `GET /api/health` → `checks.ai`

## Modules

| Module          | API                          | Service                                   | Admin UI                  |
| --------------- | ---------------------------- | ----------------------------------------- | ------------------------- |
| Storefront chat | `POST /api/chat`             | `lib/chatAssistant.js`                    | `ChatAssistant` component |
| Farm AI chat    | `POST /api/v1/ai/chat`       | `lib/services/farm/ai.service.ts`         | `/admin/farm/ai`          |
| Voice AI        | `POST /api/v1/voice`         | `lib/services/farm/voice.service.ts`      | `/admin/farm/voice`       |
| Farm Agent      | `POST /api/v1/agent`         | `lib/services/farm/agent.service.ts`      | `/admin/farm/agent`       |
| Vision ingest   | `POST /api/v1/vision/ingest` | `lib/services/farm/vision.service.ts`     | `/admin/farm/vision`      |
| Predictions     | `POST /api/v1/predictions`   | `lib/services/farm/prediction.service.ts` | `/admin/farm/predictions` |

## Data Models

| Model                                      | Purpose                        |
| ------------------------------------------ | ------------------------------ |
| `AIConversation` / `AIConversationMessage` | Chat history                   |
| `AIInsight` / `AIAlert`                    | Generated insights and alerts  |
| `AIPrediction` / `PredictionModel`         | ML prediction records          |
| `VisionDetection`                          | Camera/YOLO detections         |
| `AgentRun` / `AgentAction`                 | Autonomous agent execution log |
| `VoiceSession` / `VoiceTranscript`         | Voice interaction records      |

## Storefront Chat Flow

```
User message → /api/chat → OpenAI Chat Completions
                        → Product/order context from site data
                        → Streamed or JSON response
```

## Farm AI Flow

```
Admin / API → ai.service.ts → OpenAI with farm context
                            → SensorReading, Cow, MilkTankMonitor data
                            → Persist AIConversation + insights
```

## Vision Pipeline

```
CCTV / Jetson (edge/vision/) → POST /api/v1/vision/ingest
                             → VisionDetection (PostgreSQL)
                             → Optional alert → EmergencyEvent
```

Edge Python YOLO/OpenCV runs on Jetson; results POST to API with `VISION_WEBHOOK_API_KEY`.

## Agent Architecture

```
Trigger (cron / event / manual)
  → agent.service.ts
  → LLM plans actions
  → AgentAction records (actuator, notification, etc.)
  → Autonomy engine may execute approved actions
```

## Cost & Rate Control

- OpenAI calls are server-side only (key never exposed to client)
- Farm AI endpoints require authenticated farm roles
- Consider caching frequent predictions in `PredictionSnapshot`
- Usage metering for tenant API calls via `UsageRecord` (tenant billing)

## Related

- [Farm guides](../farm-guides/ai-platform.md) — setup and operations
- [IoT](./iot.md) — sensor data feeding AI context
- [ADR-001](../adr/001-jwt-auth-over-authjs.md) — API auth for AI routes
