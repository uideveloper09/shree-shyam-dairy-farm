# Error Handling Review

**Date:** 2025-06-25  
**Scope:** Error Boundary, API errors, custom errors, 404, 500  
**Method:** Architecture review only — no rewrites applied

---

## Executive summary

The project has a **well-structured enterprise error layer** in `src/lib/errors/` with consistent JSON contracts, normalization, and UI fallbacks. The **infrastructure is in place** but **adoption is partial**:

| Area                   | Status           | Notes                                                   |
| ---------------------- | ---------------- | ------------------------------------------------------- |
| Custom error classes   | ✅ Complete      | `AppError` hierarchy + Prisma/Zod mapping               |
| API central handler    | ✅ Implemented   | `handleApiError` + `withApi` / `withPublicApi`          |
| API route adoption     | ⚠️ Low           | Most routes still return ad-hoc `{ error: string }`     |
| Error Boundary (React) | ⚠️ Built, unused | Component exists; not mounted in any layout             |
| 404 (pages)            | ✅ Working       | `not-found.tsx` + `notFound()` in category pages        |
| 500 (pages)            | ✅ Working       | `error.tsx` + `global-error.tsx`                        |
| Tests                  | ❌ Blocked       | `tests/errors.test.ts` fails on `server-only` in Vitest |

---

## Architecture map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UI (Client / RSC)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  not-found.tsx (404)          error.tsx (500 segment)                   │
│  global-error.tsx (500 root)    ErrorFallback (shared UI)                 │
│  ErrorBoundary (optional) ──► errorLogger @/lib/logging/client          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                         API Route Handlers                               │
├─────────────────────────────────────────────────────────────────────────┤
│  withApi (@/lib/ops/api-handler)     ──┐                                │
│  withPublicApi (@/lib/api/public-handler)│ catch ──► handleApiError      │
│  withApiErrorHandler (lib/errors)      ──┘         │                    │
│  Legacy: NextResponse.json({ error })  (majority)   │                    │
└─────────────────────────────────────────────────────┼───────────────────┘
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      src/lib/errors/                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  normalizeError()  ◄── AppError, ZodError, Prisma, generic Error        │
│  errorResponse()   ──► ApiErrorBody { success, error, message, code }   │
│  handleApiError()  ──► logging (error/request) + metrics + headers      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Error Boundary

### Location

| File                                      | Role                                                 |
| ----------------------------------------- | ---------------------------------------------------- |
| `src/components/errors/ErrorBoundary.tsx` | Class component; catches render errors in child tree |
| `src/components/errors/ErrorFallback.tsx` | Shared UI for 404/500-style messages                 |
| `src/components/errors/index.ts`          | Barrel export                                        |

### Behavior

- `getDerivedStateFromError` → stores error in state
- `componentDidCatch` → logs via `errorLogger.unhandled()` with `source: "react_error_boundary"` and `componentStack`
- Supports custom `fallback` render prop and `resetKeys` for auto-recovery
- Default fallback: `<ErrorFallback error={error} reset={reset} />`

### Integration status

**Not mounted anywhere.** Grep shows `ErrorBoundary` is only referenced in its own module and barrel export. No layout or feature shell wraps children with it.

### Relationship to Next.js boundaries

| Mechanism               | Catches                            | File                                  |
| ----------------------- | ---------------------------------- | ------------------------------------- |
| `ErrorBoundary` (React) | Client render errors in subtree    | `components/errors/ErrorBoundary.tsx` |
| `error.tsx`             | Errors in route segment + children | `src/app/error.tsx`                   |
| `global-error.tsx`      | Errors in root layout              | `src/app/global-error.tsx`            |

Next.js route `error.tsx` already covers segment-level failures. `ErrorBoundary` is useful for **isolated feature shells** (e.g. admin dashboard, cart drawer) without taking down the whole page.

### Logging

All UI error paths use `@/lib/logging/client` → `errorLogger` (browser-safe, no Pino).

---

## 2. API Errors

### Central pipeline

**Entry:** `handleApiError(error, context)` in `src/lib/errors/api-handler.ts`

| Step | Action                                                     |
| ---- | ---------------------------------------------------------- |
| 1    | `normalizeError(error)` → structured `AppError`            |
| 2    | Log: 5xx → `errorLogger.api`; 4xx → `errorLogger.warn`     |
| 3    | Metrics: `ssd_http_errors_total` with path, code, status   |
| 4    | Request log via `requestLogger.log()` when timing provided |
| 5    | `errorResponse()` → JSON + security headers                |

### Wrappers

| Wrapper               | File                            | Features                                                        |
| --------------------- | ------------------------------- | --------------------------------------------------------------- |
| `withApi`             | `src/lib/ops/api-handler.ts`    | Rate limit, metrics, request logging, `handleApiError` on catch |
| `withApiErrorHandler` | `src/lib/errors/api-handler.ts` | Catch-only wrapper (no rate limit)                              |
| `withPublicApi`       | `src/lib/api/public-handler.ts` | API key auth, scopes, rate limit, `handleApiError` on catch     |

### Standard API error body

```typescript
{
  success: false,
  error: "not_found",      // snake_case slug (ERROR_SLUGS)
  message: "Resource not found",
  code: "NOT_FOUND",       // stable machine code (ERROR_CODES)
  details?: { ... },       // omitted in production for non-operational 500s
  requestId?: string
}
```

### Production masking

`errorResponse()` in `src/lib/errors/response.ts`:

- Operational errors (4xx, most domain errors): message and details exposed
- Non-operational 500 (`InternalServerError`, `isOperational: false`): message replaced with `"Internal server error"`, details stripped

### Adoption gap

The enterprise handler is **wired but rarely used** at the route level:

| Pattern                                                  | Approx. usage                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| `withApi` / `withApiErrorHandler`                        | Defined; **0 route files** import `withApi`                       |
| `withPublicApi`                                          | **5** public API routes                                           |
| `handleApiError` direct                                  | Via wrappers only                                                 |
| Legacy `NextResponse.json({ error: "..." }, { status })` | **Dominant** across `src/app/api/**`                              |
| Auth helpers (`requirePermission`)                       | Return `{ error: "Unauthorized" }` — **not** `ApiErrorBody` shape |

**Examples of legacy responses:**

- `src/lib/auth/session.ts` — `{ error: "Unauthorized" }` (401)
- `src/app/api/payment/verify/route.js` — `{ error: "Payment not configured" }` (503)
- `src/app/api/v1/auth/refresh/route.ts` — `{ error: "Invalid refresh token" }` (401)

**Rate-limit inconsistency:** `withApi` returns `{ error: "Too many requests" }` (429) without `success`/`code` fields, while `withPublicApi` uses `{ error: "rate_limit_exceeded", message: "..." }`.

### Recommended usage (existing API, no rewrite required)

```typescript
import { withApi } from "@/lib/ops/api-handler";
import { NotFoundError, throwValidation } from "@/lib/errors";

export const GET = withApi(async (request) => {
  const item = await findItem(id);
  if (!item) throw new NotFoundError("Item not found", { id });
  return NextResponse.json({ success: true, data: item });
});
```

---

## 3. Custom Errors

### Base class

`AppError` (`src/lib/errors/app-error.ts`):

- `code` — `ERROR_CODES` enum value
- `statusCode` — HTTP status
- `slug` — snake_case via `ERROR_SLUGS`
- `details` — optional structured payload
- `isOperational` — defaults `true`; `false` for unexpected 500s
- `cause` — chained error support

### Hierarchy

| Module                | Classes                                                                                                                       | HTTP                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `http-errors.ts`      | `BadRequestError`, `NotFoundError`, `ConflictError`, `TooManyRequestsError`, `InternalServerError`, `ServiceUnavailableError` | 400, 404, 409, 429, 500, 503 |
| `auth-error.ts`       | `AuthenticationError`, `InvalidCredentialsError`, `TokenExpiredError`, `ForbiddenError`, `InsufficientPermissionsError`       | 401, 403                     |
| `validation-error.ts` | `ValidationError` (+ Zod `fromZod`, `parseOrThrow`)                                                                           | 400                          |
| `database-error.ts`   | `DatabaseError`, `DatabaseNotConfiguredError`                                                                                 | 500/503                      |

### Normalization (`normalize.ts`)

| Input                | Maps to                                                   |
| -------------------- | --------------------------------------------------------- |
| `AppError`           | Pass-through                                              |
| `ZodError`           | `ValidationError.fromZod()`                               |
| Prisma client errors | `mapPrismaError()` (P2025→404, P2002→409, init→503, etc.) |
| `Error`              | `InternalServerError` (non-operational)                   |
| Unknown              | `InternalServerError("An unexpected error occurred")`     |

### Helpers

| Helper                                                                                     | Purpose                     |
| ------------------------------------------------------------------------------------------ | --------------------------- |
| `throwNotFound`, `throwUnauthorized`, `throwForbidden`, `throwValidation`, `throwInternal` | Control-flow throws         |
| `assertFound`, `assertAuth`, `assertPermission`, `assertDatabaseConfigured`                | Type-narrowing guards       |
| `createAppError()`                                                                         | Factory without subclassing |
| `buildErrorBody()` / `successResponse()`                                                   | Response builders           |

### Error codes (`codes.ts`)

14 stable codes with snake_case slugs for JSON `error` field — suitable for client SDKs and public API consumers.

### Test coverage

`tests/errors.test.ts` covers AppError, normalize, Prisma mapping, validation, response body, and asserts. **Currently blocked** in Vitest by `server-only` import chain (see `BUILD_VALIDATION.md`).

---

## 4. 404 (Not Found)

### Page-level (UI)

| Trigger               | Handler                    | UI                                                 |
| --------------------- | -------------------------- | -------------------------------------------------- |
| Unknown route         | Next.js                    | `src/app/not-found.tsx`                            |
| `notFound()` call     | Next.js                    | Same `not-found.tsx`                               |
| Invalid category slug | `category/[slug]/page.jsx` | `notFound()` when `getCategoryBySlug` returns null |

**`not-found.tsx`** — standalone markup (duplicates `ErrorFallback` 404 copy). Does **not** use `ErrorFallback` component.

### API-level

| Mechanism                                         | Response                                                     |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `NotFoundError` / `throwNotFound` / `assertFound` | Standard `ApiErrorBody` when thrown through `handleApiError` |
| Legacy routes                                     | `{ error: "Tenant not found" }` etc. — inconsistent shape    |

### Distinction

- **UI 404** — HTML page for humans (`not-found.tsx`)
- **API 404** — JSON for clients (`NotFoundError` → `code: NOT_FOUND`, `error: not_found`)

These are correctly separated by layer; only the API side lacks consistent adoption.

---

## 5. 500 (Server Error)

### Page-level (UI)

| File                       | Scope                | Behavior                                                                                            |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| `src/app/error.tsx`        | Route segment        | Client component; logs `source: "next_error_page"`; renders `ErrorFallback` with `statusCode={500}` |
| `src/app/global-error.tsx` | Root layout failures | Own `<html><body>`; logs `source: "next_global_error"`; same `ErrorFallback`                        |

Both support **Try again** (`reset()`) and **Back to home**.

### Dev vs production UI

`ErrorFallback` shows `error.message` and `digest` in **non-production** only (`NODE_ENV !== "production"`).

### API-level

| Source                                          | Result                                                       |
| ----------------------------------------------- | ------------------------------------------------------------ |
| Uncaught non-`AppError`                         | `InternalServerError`, `isOperational: false`                |
| `throwInternal()` / `new InternalServerError()` | 500, masked in production                                    |
| Prisma panic / unknown DB                       | `DatabaseError` 500                                          |
| Legacy catch blocks                             | Often `{ error: (e as Error).message }` — may leak internals |

### Logging

Server 500s through `handleApiError` → `errorLogger.api()` → Pino (`domain: error`, `logType: error`).

---

## Component reference

### `ErrorFallback` props

| Prop                    | Default          | Use                              |
| ----------------------- | ---------------- | -------------------------------- |
| `statusCode`            | `500`            | Heading/copy switch (404 vs 500) |
| `title` / `description` | Auto from status | Override copy                    |
| `reset`                 | —                | Show "Try again" button          |
| `showHomeLink`          | `true`           | Show home link                   |

Supports 404 styling when `statusCode={404}` but is **not used** by `not-found.tsx` today.

---

## Gaps and recommendations (no changes made)

| Priority | Gap                                        | Suggestion (use existing architecture)                                         |
| -------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| High     | API routes use legacy error JSON           | Wrap new/changed routes with `withApi`; throw `AppError` subclasses            |
| High     | Auth session errors inconsistent           | Return `errorResponse(new AuthenticationError(...))` from session helpers      |
| Medium   | `ErrorBoundary` unused                     | Mount in `admin/layout.jsx` or `CartProvider` shell for isolated recovery      |
| Medium   | `not-found.tsx` duplicates `ErrorFallback` | Reuse `<ErrorFallback statusCode={404} showHomeLink />` for visual consistency |
| Medium   | Rate-limit 429 shape inconsistent          | Throw `TooManyRequestsError` through `handleApiError` in `withApi`             |
| Low      | `tests/errors.test.ts` blocked             | Mock `server-only` in Vitest config                                            |
| Low      | Payment routes (`.js`)                     | Gradual migration to typed errors when touched                                 |

---

## Import cheat sheet

```typescript
// Custom errors
import { NotFoundError, ValidationError, assertFound } from "@/lib/errors";

// API wrapper (preferred for new routes)
import { withApi } from "@/lib/ops/api-handler";

// Public API
import { withPublicApi, publicJson } from "@/lib/api/public-handler";

// UI
import { ErrorBoundary, ErrorFallback } from "@/components/errors";

// Client error logging (error pages, boundary)
import { errorLogger } from "@/lib/logging/client";
```

---

## File index

| Path                            | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `src/lib/errors/`               | Custom errors, normalize, response, API handler |
| `src/lib/ops/api-handler.ts`    | `withApi` production wrapper                    |
| `src/lib/api/public-handler.ts` | `withPublicApi` for external API                |
| `src/components/errors/`        | `ErrorBoundary`, `ErrorFallback`                |
| `src/app/not-found.tsx`         | Global 404 page                                 |
| `src/app/error.tsx`             | Segment 500 page                                |
| `src/app/global-error.tsx`      | Root 500 page                                   |
| `tests/errors.test.ts`          | Unit tests for error layer                      |

---

## Verdict

The **architecture is sound and complete** for an enterprise ERP: typed errors, normalization, production-safe responses, structured logging, and UI fallbacks. The main gap is **consistent adoption** across ~170 API routes and auth helpers — not missing infrastructure. No rewrite is needed; incremental migration to `withApi` + `AppError` throws aligns existing routes with the established pattern.
