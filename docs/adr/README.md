# Architecture Decision Records (ADR)

Lightweight records of significant architectural decisions.

## Format

Each ADR follows:

1. **Status** — Proposed | Accepted | Deprecated | Superseded
2. **Context** — What problem are we solving?
3. **Decision** — What did we choose?
4. **Consequences** — Trade-offs and follow-ups

## Index

| ADR                                     | Title                              | Status   |
| --------------------------------------- | ---------------------------------- | -------- |
| [001](./001-jwt-auth-over-authjs.md)    | Custom JWT auth over Auth.js       | Accepted |
| [002](./002-tenant-farmid-isolation.md) | `tenant.slug` → `farmId` isolation | Accepted |
| [003](./003-bullmq-async-workers.md)    | BullMQ for async background jobs   | Accepted |

## Creating a new ADR

1. Copy the template from any existing ADR
2. Number sequentially: `004-short-title.md`
3. Link from this index and relevant architecture docs
