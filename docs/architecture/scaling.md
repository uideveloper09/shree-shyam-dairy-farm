# Scaling Architecture

Horizontal and vertical scaling strategies for the Shree Shyam Dairy Farm ERP platform.

## Application Tier

| Strategy           | Implementation                                         |
| ------------------ | ------------------------------------------------------ |
| Horizontal scaling | Docker `replicas: 2`, K8s HPA max 10 pods              |
| Stateless app      | JWT in cookies; no in-memory session affinity required |
| Load balancing     | Nginx `least_conn`, K8s Service, Vercel edge           |
| CDN                | Cloudflare for static assets and tenant custom domains |

### HPA (Kubernetes)

`k8s/hpa.yaml`:

- Scale on CPU 70%, Memory 80%
- Min replicas: 2, Max: 10
- Cooldown periods prevent flapping

## Database (Neon PostgreSQL)

| Strategy           | Notes                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| Connection pooling | Use Neon pooler URL for Vercel/serverless                              |
| Direct connections | BullMQ workers, long-running jobs                                      |
| Read replicas      | Neon supports read replicas for analytics dashboards                   |
| Indexing           | `farmId`, `createdAt`, foreign keys — see [database.md](./database.md) |

### Query optimization

- Paginate audit logs and sensor readings
- `TenantDailyAnalytics` pre-aggregates tenant metrics
- Avoid N+1 with Prisma `include` selectively

## Redis

| Use case      | Scaling                                        |
| ------------- | ---------------------------------------------- |
| Rate limiting | Single Redis instance sufficient to ~10k req/s |
| BullMQ        | Dedicated Redis; increase worker count         |
| Session cache | Optional; JWT is primary auth                  |

Upstash Redis works for Vercel serverless. Self-hosted Redis in Docker/K8s for workers.

## Queue (BullMQ)

| Pattern          | Benefit                                           |
| ---------------- | ------------------------------------------------- |
| Multiple workers | `worker-queue` replicas process jobs in parallel  |
| Job concurrency  | Configure per-worker in `workers/queue.worker.ts` |
| Separate queues  | Email, webhooks, backups can split queues later   |

See [ADR-003](../adr/003-bullmq-async-workers.md).

## Object Storage

S3/R2 scales automatically. Use Cloudflare R2 + CDN for proof photos and uploads.

## IoT Ingest

| Bottleneck   | Mitigation                                              |
| ------------ | ------------------------------------------------------- |
| MQTT burst   | Edge gateway batching + `MqttOfflineMessage` queue      |
| API rate     | Device API keys per farm; horizontal API replicas       |
| Write volume | Partition `SensorReading` by time (future: TimescaleDB) |

## API Rate Limits

| Tier                  | Limit                      |
| --------------------- | -------------------------- |
| Public API free       | 60 req/min                 |
| Public API pro        | 300 req/min                |
| Public API enterprise | 1000 req/min               |
| Nginx                 | 30 req/s per IP (API zone) |

## Caching Layers

```
Browser → Cloudflare CDN → Nginx → Next.js (ISR/static where possible)
                              → Redis (rate limits, hot keys)
                              → PostgreSQL
```

Public product catalog can use `Cache-Control` headers on `/api/public/v1/products`.

## Monitoring for Scale

- Prometheus metrics: request duration, queue depth, Redis latency
- `/api/health` for orchestrator probes
- Alert on DB connection pool exhaustion, queue backlog > threshold

## Vercel Limits

Serverless functions have execution time limits. Long-running tasks must use:

- BullMQ workers (external)
- MQTT bridge worker (external)
- Edge functions only for lightweight middleware

## Related

- [Deployment](./deployment.md)
- [Backend](./backend.md)
