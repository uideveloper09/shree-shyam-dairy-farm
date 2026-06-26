# Database

PostgreSQL database managed with **Prisma 6**. The schema contains **~100 models** spanning e-commerce, farm IoT, multi-tenancy, CRM, fleet, retail, processing, workflows, documents, integrations, notifications, and SaaS marketplace features.

**Schema file:** `prisma/schema.prisma`  
**Client:** `src/repositories/prisma.ts`

---

## Connection

```env
DATABASE_URL=postgresql://user:password@host:5432/shree_shyam?sslmode=require
```

Recommended providers: **Neon**, **Supabase**, **Railway**, or self-hosted PostgreSQL 15+.

The Prisma client uses lazy initialization. Call `isDatabaseConfigured()` before DB operations in routes that must work without a database (build time, health checks).

```typescript
import { prisma, isDatabaseConfigured } from "@/repositories/prisma";

if (!isDatabaseConfigured()) {
  throw new DatabaseNotConfiguredError();
}
```

---

## Domain map

| Domain                  | Key models                                                                                 | Notes                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **Auth & users**        | `User`, `Session`, `RefreshToken`, `OtpCode`, `EmailToken`, `WebAuthnCredential`           | Roles: `CUSTOMER`, `ADMIN`, `DELIVERY`, `FARM_MANAGER`, … |
| **E-commerce**          | `Product`, `Category`, `Cart`, `Order`, `Payment`, `Coupon`, `Review`                      | Order lifecycle via `OrderStatus` enum                    |
| **Subscriptions**       | `Subscription`, `SubscriptionDelivery`                                                     | Milk delivery schedules                                   |
| **Mobile**              | `PushSubscription`, `OfflineSyncRecord`, `DeliveryAssignment`, `GpsPing`, `BarcodeScan`    | PWA + field operations                                    |
| **Developer API**       | `DeveloperAccount`, `ApiKey`, `WebhookEndpoint`, `WebhookDelivery`                         | Scoped API keys                                           |
| **Farm IoT**            | `IoTDevice`, `SensorReading`, `EdgeGateway`, `MqttOfflineMessage`                          | Scoped by `farmId`                                        |
| **Automation**          | `AutomationRule`, `ActuatorDevice`, `FarmAutonomyConfig`, `EmergencyEvent`                 | Rule engine + actuators                                   |
| **AI**                  | `AIConversation`, `AIPrediction`, `VisionDetection`, `AgentRun`, `VoiceSession`            | OpenAI integration                                        |
| **Tenant**              | `Tenant`, `TenantMember`, `TenantBranding`, `TenantDomain`, `TenantBillingSubscription`    | Multi-tenant SaaS                                         |
| **Notifications**       | `NotificationTemplate`, `NotificationJob`, `NotificationDelivery`, `NotificationBroadcast` | Multi-channel dispatch                                    |
| **Workflows**           | `WorkflowDefinition`, `WorkflowInstance`, `WorkflowStepInstance`                           | Approval flows                                            |
| **Documents**           | `DocumentFolder`, `Document`, `DocumentVersion`, `DocumentSignature`                       | DMS with OCR                                              |
| **Integrations**        | `IntegrationConnection`, `IntegrationPlugin`, `IntegrationEventLog`                        | Third-party connectors                                    |
| **CRM**                 | `CrmLead`, `CrmCustomer`, `CrmOpportunity`, `CrmQuotation`, `CrmSupportTicket`             | Sales pipeline                                            |
| **Fleet**               | Vehicle, trip, maintenance models (see schema)                                             | Logistics                                                 |
| **Retail / processing** | Batch, quality, POS models (see schema)                                                    | Plant operations                                          |
| **SaaS**                | `SaasMarketplaceListing`, `SaasPartner`, regional/tax/shipping settings                    | Global platform                                           |
| **Security**            | `AuditLog`, `DataExportRequest`                                                            | GDPR + compliance                                         |

Full ER diagrams: [er-diagrams/](./er-diagrams/README.md)

---

## Tenancy & isolation

### E-commerce and tenant data

- Users belong to tenants via `TenantMember`
- Tenant-specific branding, domains, billing, and locale in `Tenant*` models
- Queries must filter by `tenantId` where applicable

### Farm / IoT data

Farm and IoT models use `farmId` as the isolation key. At runtime:

```
tenant.slug  →  farmId  →  Prisma queries filtered by farmId
```

See [ADR-002: Tenant farmId isolation](./adr/002-tenant-farmid-isolation.md).

---

## Migrations

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply migration (development)
npm run db:migrate

# Push schema without migration file (prototyping only)
npm run db:push

# Visual schema browser
npm run db:studio
```

### Migration policy

1. Never edit applied migration SQL in production
2. One logical change per migration when possible
3. Run `npm run typecheck` and `npm run test` after schema changes
4. Review indexes for new foreign keys and filter columns (`tenantId`, `farmId`, `createdAt`)

---

## Seeding

| Command                         | Script                         | Purpose                |
| ------------------------------- | ------------------------------ | ---------------------- |
| `npm run db:seed`               | `prisma/seed.ts`               | Core storefront data   |
| `npm run db:seed-tenant`        | `prisma/seed-tenant.ts`        | Default tenant         |
| `npm run db:seed-farm`          | `prisma/seed-farm-run.ts`      | IoT devices, farm data |
| `npm run db:seed-notifications` | `prisma/seed-notifications.ts` | Notification templates |
| `npm run db:seed-workflows`     | `prisma/seed-workflows.ts`     | Workflow definitions   |
| `npm run db:seed-documents`     | `prisma/seed-documents.ts`     | Document folders       |
| `npm run db:seed-integrations`  | `prisma/seed-integrations.ts`  | Integration plugins    |
| `npm run db:seed-crm`           | `prisma/seed-crm.ts`           | CRM pipeline           |
| `npm run db:seed-fleet`         | `prisma/seed-fleet.ts`         | Fleet vehicles         |
| `npm run db:seed-processing`    | `prisma/seed-processing.ts`    | Processing batches     |
| `npm run db:seed-retail`        | `prisma/seed-retail.ts`        | Retail POS             |
| `npm run db:seed-ai`            | `prisma/seed-ai.ts`            | AI models              |
| `npm run db:seed-saas`          | `prisma/seed-saas.ts`          | SaaS marketplace       |

Seeds are idempotent where possible. Run `db:seed` + `db:seed-tenant` for a minimal dev environment.

---

## Error handling

Map Prisma errors to application errors — do not leak raw Prisma messages to clients in production:

```typescript
import { mapPrismaError } from "@/lib/errors";

try {
  await prisma.order.create({ data });
} catch (error) {
  throw mapPrismaError(error);
}
```

| Prisma code     | Mapped error                       |
| --------------- | ---------------------------------- |
| `P2025`         | `NotFoundError` (404)              |
| `P2002`         | `ConflictError` (409)              |
| `P2003`         | `DatabaseError` (400)              |
| `P1001`–`P1003` | `DatabaseNotConfiguredError` (503) |

Use `databaseLogger` from `@/lib/logging` for query diagnostics in development.

---

## Indexing guidelines

- **Foreign keys** — indexed by Prisma defaults; verify composite indexes for common joins
- **Tenant scope** — index `(tenantId, status)`, `(tenantId, createdAt)` on high-volume tables
- **Farm scope** — index `farmId` on all IoT tables
- **Uniqueness** — `slug`, `orderNumber`, `email` where business rules require
- **Audit** — `AuditLog.createdAt` for paginated security dashboards
- **Time-series** — `SensorReading`, `GpsPing` — consider `(deviceId, recordedAt)` composites

---

## Backups & restore

```bash
# Create backup
npm run backup:db

# Restore (see scripts/restore-db.sh)
./scripts/restore-db.sh backups/db/ssd_db_YYYYMMDD_HHMMSS.sql.gz
```

File storage backups: `npm run backup:files`

---

## Redis (companion store)

Not part of Prisma but required for production features:

```env
REDIS_URL=redis://localhost:6379
```

Used for: session cache, rate limiting, BullMQ queues. Optional in local development — features degrade gracefully.

---

## Neon / serverless Postgres notes

- Use `?sslmode=require` in connection string
- Prefer connection pooling (Neon pooler endpoint or PgBouncer) for serverless/Vercel
- Keep transactions short; avoid long-held connections in edge runtime
- Prisma client should be a singleton (already implemented in `repositories/prisma.ts`)

---

## Related

- [architecture.md](./architecture.md) — system layers
- [architecture/database.md](./architecture/database.md) — extended database notes
- [setup.md](./setup.md) — local DB setup
