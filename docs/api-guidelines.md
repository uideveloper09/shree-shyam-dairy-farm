# API Guidelines

Standards for designing, implementing, and consuming APIs in the Shree Shyam Dairy Farm platform.

---

## API surfaces

| Surface                  | Base path          | Audience                   | Auth                                                        |
| ------------------------ | ------------------ | -------------------------- | ----------------------------------------------------------- |
| **Internal REST**        | `/api/v1/*`        | Web app, mobile PWA, admin | JWT (`ssd_access` cookie or `Authorization: Bearer`)        |
| **Public developer API** | `/api/public/v1/*` | Third-party integrations   | API key (`Authorization: Bearer ssd_live_…` or `X-API-Key`) |
| **Storefront payments**  | `/api/payment/*`   | Checkout flow              | Session / Razorpay                                          |
| **Health**               | `/api/health`      | Load balancers, monitoring | None                                                        |
| **GraphQL**              | `/api/graphql`     | Internal (limited)         | JWT                                                         |

Detailed route catalogs: [api/internal-api.md](./api/internal-api.md) · [api/public-api.md](./api/public-api.md)

OpenAPI spec: `/api/public/openapi.json` · Swagger UI: `/developers/docs`

---

## URL design

### Rules

- Use **nouns** for resources, **verbs** for actions only when non-CRUD (`/cancel`, `/pause`)
- Lowercase paths with hyphens: `/api/v1/subscription-deliveries`
- Version in path: `/api/v1/` (internal), `/api/public/v1/` (public)
- Resource IDs in path: `/api/v1/orders/{id}`
- Nested resources max 2 levels deep where possible

```
GET    /api/v1/orders              # List
POST   /api/v1/orders              # Create
GET    /api/v1/orders/{id}         # Read
PATCH  /api/v1/orders/{id}         # Partial update
DELETE /api/v1/orders/{id}         # Delete
POST   /api/v1/orders/{id}/cancel  # Action
```

### Avoid

```
GET /api/v1/getOrders          # verb in URL
POST /api/v1/order/create      # redundant verb
GET /api/v1/orders/list/all    # redundant hierarchy
```

---

## HTTP methods & status codes

| Method   | Purpose           | Success status                 |
| -------- | ----------------- | ------------------------------ |
| `GET`    | Read (idempotent) | `200`                          |
| `POST`   | Create or action  | `201` (create), `200` (action) |
| `PUT`    | Full replace      | `200`                          |
| `PATCH`  | Partial update    | `200`                          |
| `DELETE` | Remove            | `200` or `204`                 |

| Status | Meaning        | When                                      |
| ------ | -------------- | ----------------------------------------- |
| `200`  | OK             | Successful read/update                    |
| `201`  | Created        | Resource created                          |
| `400`  | Bad request    | Validation failure                        |
| `401`  | Unauthorized   | Missing/invalid auth                      |
| `403`  | Forbidden      | Insufficient permissions                  |
| `404`  | Not found      | Resource does not exist                   |
| `409`  | Conflict       | Duplicate / state conflict                |
| `429`  | Rate limited   | Too many requests                         |
| `500`  | Internal error | Unexpected server failure                 |
| `503`  | Unavailable    | Database not configured / dependency down |

---

## Response format

### Success (recommended for new endpoints)

```json
{
  "success": true,
  "data": { "id": "ord_123", "status": "CONFIRMED" },
  "meta": { "page": 1, "total": 42 }
}
```

Use `successResponse(data, status, meta)` from `@/lib/errors`.

### Error (standard)

```json
{
  "success": false,
  "error": "not_found",
  "message": "Order not found",
  "code": "NOT_FOUND",
  "details": { "id": "ord_123" }
}
```

Use `throw new NotFoundError(...)` or `handleApiError(error)` — never hand-craft inconsistent error shapes in new code.

### Legacy format

Older routes may return `{ "error": "string" }` without the `success` / `code` fields. Migrate to the standard format when touching a route.

---

## Authentication

### Internal API (JWT)

```http
Cookie: ssd_access=<jwt>
# or
Authorization: Bearer <jwt>
```

Obtain tokens via `POST /api/v1/auth/login`. Refresh via `POST /api/v1/auth/refresh`.

### Public API (API keys)

```http
Authorization: Bearer ssd_live_<key>
# or
X-API-Key: ssd_live_<key>
```

Keys are scoped. Check scope before processing:

```typescript
import { withPublicApi } from "@/lib/api/public-handler";

export const GET = withPublicApi(handler, { scope: "orders:read" });
```

### Admin endpoints

Protected by role (`ADMIN`, `OWNER`, `FARM_MANAGER`, …) via `hasPermission()`. Some routes also require `ADMIN_SECRET` header for content APIs.

### Cron / internal jobs

```http
Authorization: Bearer <CRON_SECRET>
```

---

## Validation

1. Parse JSON body safely
2. Validate with Zod schema
3. Throw `ValidationError` on failure

```typescript
import { z } from "zod";
import { parseOrThrow } from "@/lib/errors";

const schema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const POST = withApi(async (request) => {
  const body = parseOrThrow(schema, await request.json());
  // ...
});
```

Error response includes `details.issues` with `{ path, message }` per field.

---

## Pagination

For list endpoints, use cursor or offset pagination consistently:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 156,
    "hasMore": true
  }
}
```

Query params: `?page=1&pageSize=20` or `?cursor=abc&limit=20`

---

## Rate limiting

### Internal API

Use `withApi(handler, { rateLimit: { limit: 60, windowSec: 60 } })`.

### Public API

Per-key limits stored on `ApiKey.rateLimit`. Response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1719234000
Retry-After: 42
```

---

## Security headers

All responses through `withApi` and `withPublicApi` receive:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (production)

Public API also sets `X-API-Version`.

---

## Webhooks (outbound)

Registered via developer portal. Deliveries:

- Signed payload (HMAC)
- Retried by `workers/webhook-retry.worker.ts`
- Logged in `WebhookDelivery` table

---

## Idempotency

For payment and order creation endpoints:

- Accept `Idempotency-Key` header where duplicate submission is costly
- Store key + response hash; return cached response on replay

---

## Route handler template

```typescript
import { NextResponse } from "next/server";
import { withApi } from "@/lib/ops/api-handler";
import { assertAuth, assertFound, successResponse, ValidationError } from "@/lib/errors";
import { getSession } from "@/lib/security/session";
import { orderService } from "@/services/orders";

export const GET = withApi(async (request, { params }) => {
  const session = await getSession(request);
  assertAuth(session?.userId);

  const { id } = await params!;
  const order = await orderService.getById(id, session.userId);
  assertFound(order);

  return successResponse(order);
});

export const POST = withApi(
  async (request) => {
    // validate → service → respond
    return successResponse({ id: "new" }, 201);
  },
  { rateLimit: { limit: 30, windowSec: 60 }, name: "orders-create" }
);
```

---

## Versioning policy

- **Internal API** — breaking changes require coordination with frontend/mobile; version bump to `v2` if needed
- **Public API** — strict backward compatibility within major version; deprecate with `Sunset` header and 6-month notice

---

## Related

- [coding-guidelines.md](./coding-guidelines.md) — implementation standards
- [api/README.md](./api/README.md) — route index
- [architecture/security.md](./architecture/security.md) — auth deep dive
