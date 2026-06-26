# AI & Vision Platform

Farm intelligence: chat, predictions, voice, autonomous agent, and computer vision.

## Prerequisites

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini    # optional
VISION_WEBHOOK_API_KEY=...  # for camera ingest
```

## Farm AI chat

**Admin:** `/admin/farm/ai`  
**API:** `POST /api/v1/ai/chat`

Context includes sensor readings, cow records, milk tank levels, and recent alerts.

## Voice AI

**Admin:** `/admin/farm/voice`  
**API:** `POST /api/v1/voice`

Voice sessions stored in `VoiceSession` / `VoiceTranscript`.

## Farm Agent

**Admin:** `/admin/farm/agent`  
**API:** `POST /api/v1/agent`

Autonomous agent plans and logs actions in `AgentRun` / `AgentAction`. Approved actions may trigger actuators via the autonomy engine.

## Predictions

**Admin:** `/admin/farm/predictions`  
**API:** `POST /api/v1/predictions`

Milk yield, health risk, and production planning stored in `AIPrediction` / `PredictionSnapshot`.

## Vision / CCTV

### Camera events

`POST /api/v1/cctv/events` — motion, intrusion events from NVR

### AI vision ingest

`POST /api/v1/vision/ingest` — YOLO detections from Jetson

Deploy `edge/vision/` on NVIDIA Jetson for on-device inference.

Detections stored in `VisionDetection`; critical detections may create `EmergencyEvent`.

## Storefront chat (separate)

Customer-facing chat at `/api/chat` uses `lib/chatAssistant.js` — product and order context, not farm data.

## Cost management

- OpenAI calls are server-side only
- Farm AI routes require authenticated farm roles
- Monitor usage via tenant `UsageRecord` for API metering

## Related

- [AI architecture](../architecture/ai.md)
- [Farm setup](./setup.md)
