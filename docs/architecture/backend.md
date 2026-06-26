# Backend Architecture

Monolithic Next.js backend: API routes delegate to service modules in `lib/services/`, with shared ops infrastructure in `lib/ops/`.

## API Surfaces

| Namespace          | Auth                   | Handler                                       |
| ------------------ | ---------------------- | --------------------------------------------- |
| `/api/v1/*`        | JWT cookie / Bearer    | `lib/ops/api-handler.ts` (`withApi`)          |
| `/api/public/v1/*` | API key                | `lib/api/public-handler.ts` (`withPublicApi`) |
| `/api/payment/*`   | Session / guest        | Razorpay checkout                             |
| `/api/chat`        | Optional               | Storefront AI assistant                       |
| `/api/health`      | Public                 | Layer health checks                           |
| `/api/metrics`     | Bearer `METRICS_TOKEN` | Prometheus scrape                             |

## Service Layer

```
lib/services/
├── cart.ts, subscription.ts       # E-commerce
├── api/                           # Public API, webhooks, developer
├── tenant/                        # Multi-tenant SaaS
├── farm/                          # IoT, MQTT, AI, vision, agent
└── mobile/                        # Delivery, dashboards, sync
```

| Domain     | Key modules                                                     |
| ---------- | --------------------------------------------------------------- |
| E-commerce | `cart.ts`, orders via Prisma, Razorpay                          |
| Farm ERP   | `farm/iot.service.ts`, `mqtt.service.ts`, `autonomy.service.ts` |
| AI         | `farm/ai.service.ts`, `voice.service.ts`, `agent.service.ts`    |
| Security   | `lib/security/*` (not under services/)                          |
| Tenant     | `tenant/tenant.service.ts`, billing, analytics                  |
| Mobile     | `mobile/platform.service.ts`, delivery                          |

## Request Pipeline

```
HTTP Request
  → middleware.ts (tenant, auth gate)
  → Route handler (app/api/**/route.ts)
  → withApi / withPublicApi wrapper
  → Security gate (rate limit, bot detection)
  → RBAC / ABAC check
  → Service function
  → Prisma / Redis / Queue / External API
  → JSON response
```

## Async Workers

| Worker      | Script                            | Purpose                       |
| ----------- | --------------------------------- | ----------------------------- |
| Queue       | `workers/queue.worker.ts`         | Email, notifications, backups |
| MQTT bridge | `workers/mqtt-bridge.worker.ts`   | IoT message relay             |
| Webhooks    | `workers/webhook-retry.worker.ts` | Developer webhook retries     |

Run outside Vercel serverless (Docker, K8s, or local):

```bash
npm run worker:queue
npm run worker:mqtt
npm run worker:webhooks
```

## Ops Infrastructure

| Module           | Path                    | Purpose                   |
| ---------------- | ----------------------- | ------------------------- |
| Logger           | `lib/ops/logger.ts`     | Structured JSON logs      |
| Metrics          | `lib/ops/metrics.ts`    | Prometheus counters       |
| Redis            | `lib/ops/redis.ts`      | Cache, rate limits        |
| Queue            | `lib/ops/queue.ts`      | BullMQ abstraction        |
| Storage          | `lib/ops/storage.ts`    | S3 / R2 / local files     |
| Rate limit       | `lib/ops/rate-limit.ts` | Per-IP and per-key limits |
| Security headers | `lib/ops/security.ts`   | CSP, sanitization         |

## Instrumentation

`instrumentation.ts` — startup hooks, Sentry-compatible structured error logging when `SENTRY_DSN` is set.

## Related

- [API docs](../api/README.md)
- [Database](./database.md)
- [Deployment](./deployment.md) — worker deployment
