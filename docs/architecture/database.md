# Database Architecture

PostgreSQL on Neon with Prisma 6 ORM. 60+ models spanning e-commerce, farm IoT, multi-tenancy, security, and developer platform.

## Connection

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

Prisma client: `lib/db/prisma.ts` — lazy init, `isDatabaseConfigured()` guard for build-time.

## Schema Organization

| Domain        | Models (sample)                                                                        |
| ------------- | -------------------------------------------------------------------------------------- |
| Auth & users  | `User`, `Session`, `RefreshToken`, `OtpCode`, `WebAuthnCredential`                     |
| E-commerce    | `Product`, `Cart`, `Order`, `Payment`, `Subscription`, `Review`                        |
| Mobile        | `PushSubscription`, `OfflineSyncRecord`, `DeliveryAssignment`, `GpsPing`               |
| Developer API | `DeveloperAccount`, `ApiKey`, `WebhookEndpoint`, `WebhookDelivery`                     |
| Farm IoT      | `IoTDevice`, `SensorReading`, `EdgeGateway`, `MqttOfflineMessage`                      |
| Automation    | `AutomationRule`, `ActuatorDevice`, `FarmAutonomyConfig`, `EmergencyEvent`             |
| AI            | `AIConversation`, `AIPrediction`, `VisionDetection`, `AgentRun`, `VoiceSession`        |
| Tenant        | `Tenant`, `TenantBranding`, `TenantDomain`, `TenantBillingSubscription`, `UsageRecord` |
| Security      | `AuditLog`, `DataExportRequest`                                                        |

Full schema: `prisma/schema.prisma`

## ER Diagrams

- [Core & Auth](../er-diagrams/core.md)
- [E-commerce](../er-diagrams/ecommerce.md)
- [Farm & IoT](../er-diagrams/farm-iot.md)
- [Multi-Tenant](../er-diagrams/tenant.md)

## Tenant Isolation

`tenant.slug` maps to `farmId` on farm/IoT models. E-commerce data is scoped by tenant membership (`TenantMember`).

```
Request → resolve tenant slug → farmId = slug → Prisma queries filtered by farmId
```

See [ADR-002](../adr/002-tenant-farmid-isolation.md).

## Migrations

```bash
npm run db:generate    # prisma generate
npm run db:migrate     # prisma migrate dev
npm run db:push        # schema push (dev/prototype)
npm run db:studio      # Prisma Studio GUI
```

## Seeds

| Script     | Command                  | Purpose                    |
| ---------- | ------------------------ | -------------------------- |
| Storefront | `npm run db:seed`        | Products, categories       |
| Farm       | `npm run db:seed-farm`   | IoT devices, rules         |
| Tenant     | `npm run db:seed-tenant` | Default tenant (`default`) |

## Backups

```bash
npm run backup:db
./scripts/restore-db.sh backups/db/ssd_db_YYYYMMDD_HHMMSS.sql.gz
```

Retention: 30 days (`RETENTION_DAYS`).

## Indexing Strategy

- Foreign keys indexed by Prisma defaults
- `farmId` on IoT tables for tenant-scoped queries
- `orderNumber`, `slug` unique constraints
- `AuditLog.createdAt` for dashboard pagination

## Neon Considerations

- Serverless PostgreSQL — connection pooling via Neon pooler URL recommended for serverless (Vercel)
- Use `?pgbouncer=true` or Neon's pooled connection string for high concurrency
- Long-running workers (BullMQ) can use direct connection

## Related

- [Scaling](./scaling.md) — read replicas, connection pooling
- [Security](./security.md) — encryption at rest for TOTP secrets
