# Logging Architecture Review

**Date:** 2025-06-25  
**Scope:** `src/lib/logging`  
**Goal:** Separate client, server, audit, API, and payment concerns while preserving all existing import paths.

---

## Executive summary

The logging module was reorganized from a **flat 15-file layout** into a **layered architecture** with explicit runtime and domain boundaries. All public APIs and behavior are unchanged; `npm run typecheck` passes.

| Layer             | Purpose                                     | Runtime                  |
| ----------------- | ------------------------------------------- | ------------------------ |
| `shared/`         | Types, error serialization, redaction paths | Universal (no Node/Pino) |
| `client/`         | Browser-safe error reporting                | Client (`"use client"`)  |
| `server/core/`    | Pino factory, rotation, app logger          | Server (`server-only`)   |
| `server/domains/` | Domain-specific structured loggers          | Server (`server-only`)   |

---

## Before → After

### Before (flat)

```
src/lib/logging/
  index.ts, server.ts, client.ts
  logger.ts, pino-factory.ts, rotation.ts
  api-logger.ts, audit-logger.ts, payment-logger.ts
  database-logger.ts, request-logger.ts, error-logger.ts
  types.ts, serialize.ts, redact.ts
```

**Issues:**

- Client and server code mixed at the same directory level
- Domain loggers duplicated `getRootPinoLogger().child({ domain })` boilerplate
- No focused import paths for audit / API / payment
- Shared utilities co-located with Pino (risk of accidental client bundling)

### After (layered)

```
src/lib/logging/
  shared/                    # Types, serialize, redact
  client/
    error.ts                 # Browser errorLogger
    index.ts
  server/
    core/
      pino-factory.ts        # Pino root + config
      rotation.ts            # File rotation signals
      logger.ts              # App logger (domain: app)
      domain-child.ts        # createDomainChild() factory
    domains/
      api.ts                 # apiLogger
      audit.ts               # auditLogger
      payment.ts             # paymentLogger
      database.ts            # databaseLogger
      request.ts             # requestLogger
      error.ts               # errorLogger (server)
    index.ts                 # Server barrel + logging facade
  # Entry points (backward + focused):
  index.ts                   # → server (server-only)
  server.ts                  # → server/index (shim)
  client.ts                  # → client/index (shim)
  audit.ts                   # → server/domains/audit
  api.ts                     # → server/domains/api
  payment.ts                 # → server/domains/payment
```

---

## Separation model

### Client (`client/`)

| Export            | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `errorLogger`     | `console.error` / `console.warn` + `window.reportError` |
| `ErrorLogContext` | Client error metadata type                              |

- No `pino`, `fs`, or `server-only`
- Used by: `error.tsx`, `global-error.tsx`, `ErrorBoundary.tsx`

### Server (`server/`)

| Submodule            | Exports                                                            |
| -------------------- | ------------------------------------------------------------------ |
| **core**             | `getLogger`, `createLogger`, `getRootPinoLogger`, rotation helpers |
| **domains/api**      | `apiLogger` — handler lifecycle, validation, rate limits           |
| **domains/audit**    | `auditLogger` — `record`, `security`, `critical` (SIEM-oriented)   |
| **domains/payment**  | `paymentLogger` — Razorpay/Stripe lifecycle + webhooks             |
| **domains/database** | `databaseLogger` — queries, slow queries, migrations               |
| **domains/request**  | `requestLogger` — HTTP request/response timing                     |
| **domains/error**    | `errorLogger` — structured server-side errors                      |

**Unified facade** (unchanged):

```typescript
import { logging } from "@/lib/logging/server";

logging.api.handlerCompleted("GET", "/api/health", 200, 12);
logging.audit.record("auth.login.success", { userId: "u1" });
logging.payment.initiated({ provider: "razorpay", orderId: "ord_1" });
```

### Shared (`shared/`)

- `types.ts` — `LogMeta`, `AuditLogMeta`, `PaymentLogMeta`, `LogDomain`, etc.
- `serialize.ts` — `serializeError()` (used by client + server)
- `redact.ts` — `LOG_REDACT_PATHS`, `LOG_REDACT_CENSOR` (Pino redaction)

---

## New focused import paths

| Import                  | Use when                               |
| ----------------------- | -------------------------------------- |
| `@/lib/logging/audit`   | Security audit trail only              |
| `@/lib/logging/api`     | API route instrumentation only         |
| `@/lib/logging/payment` | Payment flows and webhooks only        |
| `@/lib/logging/client`  | Client error boundaries                |
| `@/lib/logging/server`  | Full server surface                    |
| `@/lib/logging`         | Same as server (default server barrel) |

---

## Backward compatibility

All existing imports continue to work without code changes:

| Legacy import          | Status                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `@/lib/logging`        | ✅ Re-exports `server/index`                                                    |
| `@/lib/logging/server` | ✅ Shim → `server/index`                                                        |
| `@/lib/logging/client` | ✅ Shim → `client/index`                                                        |
| `@/lib/ops/logger`     | ✅ Unchanged — `logger.info`, `logger.audit`, `logger.request`                  |
| `logging` facade       | ✅ Same shape: `app`, `api`, `audit`, `database`, `payment`, `request`, `error` |
| Domain logger APIs     | ✅ Identical method signatures and event names                                  |

**No consumer files were modified.** Deprecation comments on `server.ts`, `client.ts`, and `@/lib/ops/logger` point to preferred paths.

---

## Architectural improvements

### 1. `createDomainChild()` factory

Replaces repeated pattern in every domain file:

```typescript
const pino = createDomainChild("api", "api");
```

Ensures consistent `{ domain, logType }` bindings for log aggregation filters.

### 2. Runtime isolation

| Boundary | Enforcement                                                                                  |
| -------- | -------------------------------------------------------------------------------------------- |
| Server   | `import "server-only"` on `index.ts`, `server/index.ts`, core, domains, focused entry points |
| Client   | `"use client"` on `client/error.ts`                                                          |
| Shared   | No runtime imports — safe for both sides                                                     |

### 3. Domain-oriented files

Each domain owns its event vocabulary (e.g. `payment_webhook_received`, `api_handler_failed`) without cross-importing other domains.

---

## Consumer map (unchanged)

| Consumer               | Import                                                         |
| ---------------------- | -------------------------------------------------------------- |
| Error pages / boundary | `@/lib/logging/client` → `errorLogger`                         |
| API handlers           | `@/lib/logging/server` → `requestLogger`, `errorLogger`        |
| Legacy services        | `@/lib/ops/logger` → `logger`                                  |
| Security audit DB      | `@/lib/ops/logger` → `logger.audit()` → `auditLogger.record()` |
| Tests                  | `@/lib/logging/server`                                         |

---

## Verification

| Check                                   | Result                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| `npm run typecheck`                     | ✅ Pass                                                                      |
| `npm run test -- tests/logging.test.ts` | ❌ Pre-existing `server-only` Vitest issue (not introduced by this refactor) |
| Public API surface                      | ✅ Unchanged                                                                 |
| File count                              | 15 → 23 (structure + entry points; logic equivalent)                         |

---

## Recommended follow-ups (not in scope)

1. **Vitest mock** — Add `server-only` stub in `vitest.config` so `tests/logging.test.ts` runs in CI.
2. **Migrate consumers** — Gradually replace `@/lib/ops/logger` with `@/lib/logging/audit` or `logging.payment` in payment routes.
3. **Edge logging** — Guard `process.on` / `process.stdout` in `server/core/rotation.ts` and `pino-factory.ts` for Edge instrumentation (see `BUILD_VALIDATION.md`).
4. **Sentry** — Wire `errorLogger` client branch when `@sentry/nextjs` is added.

---

## Import cheat sheet

```typescript
// Client components
import { errorLogger } from "@/lib/logging/client";

// API routes — focused
import { apiLogger } from "@/lib/logging/api";
import { requestLogger } from "@/lib/logging/server";

// Payment webhooks
import { paymentLogger } from "@/lib/logging/payment";

// Security / compliance
import { auditLogger } from "@/lib/logging/audit";

// Legacy (still supported)
import { logger } from "@/lib/ops/logger";
```
