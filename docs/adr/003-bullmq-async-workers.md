# ADR-003: BullMQ for Async Background Jobs

**Status:** Accepted  
**Date:** 2025

## Context

The platform needs async processing for:

- Email and SMS notifications
- Developer webhook delivery with retries
- Database/file backups
- Future: report generation, batch analytics

Vercel serverless functions cannot run long-lived background processes.

## Decision

Use **BullMQ** backed by **Redis** (`lib/ops/queue.ts`) with dedicated worker processes:

- `workers/queue.worker.ts`
- `workers/webhook-retry.worker.ts`
- `workers/mqtt-bridge.worker.ts` (IoT-specific)

Workers run in Docker/K8s or locally — not on Vercel.

Queue falls back to in-memory when `REDIS_URL` is unset (development only).

## Consequences

**Positive:**

- Reliable job retries and concurrency control
- Redis already required for rate limiting
- Workers scale independently of web tier

**Negative:**

- Requires Redis in every non-trivial deployment
- Additional operational surface (worker health, queue depth monitoring)

## Follow-up

- Split queues by priority (critical webhooks vs bulk email)
- Add Prometheus gauge for queue depth in `lib/ops/metrics.ts`
