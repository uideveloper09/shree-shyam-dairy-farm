# Coding Guidelines

Engineering standards for the Shree Shyam Dairy Farm codebase. These guidelines align with existing conventions, ESLint/Prettier config, and the enterprise `src/` layout.

---

## General principles

1. **Minimize scope** — Smallest correct change; do not refactor unrelated code in the same PR
2. **Match existing patterns** — Read surrounding files before adding new code
3. **TypeScript first** — New files should be `.ts` / `.tsx`; migrate legacy `.js` when touching a module
4. **Fail explicitly** — Throw typed errors; avoid silent catches
5. **No secrets in code** — Use environment variables via `@/config`

---

## TypeScript

### Strict mode

`strict: true` is enabled. Do not use `@ts-ignore` without a comment explaining why.

### Types

- Export types from the module that owns them
- Use `import type` for type-only imports
- Prefer `interface` for object shapes; `type` for unions and utilities
- Prefix intentionally unused variables with `_`

```typescript
// Good
import type { Order } from "@/types";
export interface CreateOrderInput {
  productId: string;
  quantity: number;
}

// Avoid
const data: any = await request.json();
```

### Zod validation

Validate all external input (request bodies, query params, webhooks) at API boundaries:

```typescript
import { parseOrThrow } from "@/lib/errors";
import { orderSchema } from "@/lib/validators/order";

const body = parseOrThrow(orderSchema, await request.json());
```

---

## File & naming conventions

| Artifact         | Convention              | Example                   |
| ---------------- | ----------------------- | ------------------------- |
| React components | PascalCase              | `OrderButton.tsx`         |
| Hooks            | `use` prefix, camelCase | `useCart.ts`              |
| Services         | `{domain}/service.ts`   | `services/crm/service.ts` |
| API routes       | `route.ts` in folder    | `api/v1/orders/route.ts`  |
| Constants        | SCREAMING_SNAKE         | `TENANT_HEADER`           |
| Enums (Prisma)   | PascalCase values       | `OrderStatus.PENDING`     |
| Test files       | `{module}.test.ts`      | `tests/crm.test.ts`       |

---

## Layer responsibilities

### API routes (`src/app/api`)

- Parse and validate input
- Authenticate / authorize
- Delegate to services
- Return consistent JSON responses
- **Do not** embed complex business logic

```typescript
import { withApi } from "@/lib/ops/api-handler";
import { assertAuth, successResponse } from "@/lib/errors";
import { getSession } from "@/lib/security/session";

export const GET = withApi(async (request) => {
  const session = await getSession(request);
  assertAuth(session?.userId);
  const data = await orderService.listForUser(session.userId);
  return successResponse(data);
});
```

### Services (`src/services`)

- Orchestrate business rules
- Call repositories and modules
- Throw `AppError` subclasses on expected failures
- No HTTP or React dependencies

### Repositories (`src/repositories`)

- Prisma queries only
- No business rule validation beyond data integrity

### Components (`src/components`, `src/features`)

- Presentation and local UI state only
- Fetch via TanStack Query or server components
- Use `ErrorBoundary` for risky client subtrees

---

## Configuration

Never read `process.env` in business logic. Use the centralized config:

```typescript
import { getConfig } from "@/config";

const { payment, auth, database } = getConfig();
if (!database.configured) throw new DatabaseNotConfiguredError();
```

Validate locally: `npm run env:validate`

---

## Logging

Use domain loggers from `@/lib/logging`:

```typescript
import { apiLogger, paymentLogger, auditLogger, errorLogger } from "@/lib/logging";

paymentLogger.captured({ provider: "razorpay", orderId, amount });
auditLogger.record("order.created", { userId, resourceId: orderId });
errorLogger.api(error, { path, method });
```

Do not use raw `console.log` in production code (ESLint warns). `console.warn` / `console.error` are allowed sparingly.

---

## Error handling

```typescript
import { NotFoundError, ValidationError, assertFound, mapPrismaError } from "@/lib/errors";

assertFound(order, "Order not found");

try {
  await prisma.order.update({ where: { id }, data });
} catch (e) {
  throw mapPrismaError(e);
}
```

- Operational errors → specific `AppError` (4xx)
- Unexpected errors → let `withApi` / `handleApiError` return 500
- Never expose stack traces to clients in production

---

## Security

- Sanitize search inputs: `sanitizeSearchInput()` from `@/lib/ops/security`
- Check permissions: `hasPermission(role, permission)` before admin actions
- Write audit entries for auth and sensitive operations: `writeAudit()` from `@/lib/security/audit`
- Hash secrets with bcrypt; encrypt credentials at rest with `ENCRYPTION_KEY`
- Apply `applySecurityHeaders()` on custom responses (handled by `withApi`)

---

## React & Next.js

- Prefer **Server Components** for data fetching where possible
- Add `"use client"` only when using hooks, events, or browser APIs
- Avoid `force-dynamic` on marketing pages unless required
- Use `next/image` for optimized images
- Tenant theming via `TenantProvider` + `TenantThemeInjector`

---

## Styling

- **Tailwind CSS v4** — utility classes in components
- Design tokens: `btn-premium-navy`, `btn-premium-gold`, `font-heading`, `font-body`
- Mobile-first responsive classes (`sm:`, `md:`, `lg:`)
- No inline styles unless dynamic values are required

---

## Testing

- Add tests for new business logic in `tests/`
- Use Vitest: `describe` / `it` / `expect`
- Mock external services; do not hit real DB in unit tests
- Run `npm run test` and `npm run typecheck` before pushing

```typescript
import { describe, it, expect } from "vitest";

describe("orderService", () => {
  it("rejects negative quantity", () => {
    expect(() => validateQuantity(-1)).toThrow(ValidationError);
  });
});
```

---

## Git & code quality

### Commits (Conventional Commits)

```
feat(cart): add coupon validation
fix(auth): handle expired refresh token
docs: update setup guide
chore: bump prisma to 6.19
```

Enforced by Husky + Commitlint on `commit-msg`.

### Pre-commit

`lint-staged` runs Prettier + ESLint on staged files automatically.

### Manual checks

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run env:validate
```

---

## Code review checklist

- [ ] Input validated with Zod at API boundary
- [ ] AuthZ checked for protected resources
- [ ] Tenant/farm scope applied to queries
- [ ] Errors use `AppError` hierarchy
- [ ] No hardcoded secrets or URLs
- [ ] Logging uses domain loggers (no raw console)
- [ ] Tests added for non-trivial logic
- [ ] No unrelated changes in PR

---

## Related

- [api-guidelines.md](./api-guidelines.md) — REST API standards
- [folder-structure.md](./folder-structure.md) — where code lives
- [testing/unit-tests.md](./testing/unit-tests.md) — test patterns
