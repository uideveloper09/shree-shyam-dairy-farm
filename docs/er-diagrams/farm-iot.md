# ER Diagram — Farm & IoT

```mermaid
erDiagram
  IoTDevice ||--o{ SensorReading : produces
  EdgeGateway ||--o{ GatewayHeartbeat : sends
  AutomationRule ||--o{ AutomationLog : triggers
  ActuatorDevice ||--o{ AutomationLog : executes
  CctvCamera ||--o{ CctvEvent : records
  CctvCamera ||--o{ VisionDetection : detects
  Cow ||--o{ AIPrediction : analyzed_by
  AIConversation ||--o{ AIConversationMessage : contains
  AgentRun ||--o{ AgentAction : performs

  IoTDevice {
    string id PK
    string farmId
    string deviceType
    string apiKeyHash
    datetime lastSeenAt
  }

  SensorReading {
    string id PK
    string deviceId FK
    string farmId
    string metric
    float value
    datetime recordedAt
  }

  AutomationRule {
    string id PK
    string farmId
    string trigger
    json conditions
    json actions
    boolean enabled
  }

  EmergencyEvent {
    string id PK
    string farmId
    string severity
    string message
    datetime createdAt
  }
```

## Isolation

All farm models include `farmId` — scoped to `tenant.slug` for multi-tenant isolation.

## Data flow

```
IoTDevice → SensorReading → AutomationRule → ActuatorDevice
                         → AIPrediction / AIAlert
                         → EmergencyEvent
```

## Related

- [IoT architecture](../architecture/iot.md)
- [Farm guides](../farm-guides/setup.md)
