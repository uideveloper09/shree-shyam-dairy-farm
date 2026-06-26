# Unit Tests

Vitest test suites in `tests/` cover core platform modules without requiring a live database or Redis in most cases.

## Conventions

- Test files: `tests/<domain>.test.ts`
- Import from `@/` path alias
- Mock external services (Redis, Prisma) at module boundary when needed
- Prefer testing pure functions and service logic over full HTTP integration

## Example

```typescript
import { describe, it, expect } from "vitest";
import { hasPermission } from "@/lib/security/permissions";

describe("RBAC", () => {
  it("grants ADMIN full access", () => {
    expect(hasPermission("ADMIN", "security:audit:read")).toBe(true);
  });
});
```

## Suite Overview

### `ops.test.ts`

- `getAppEnv()` environment detection
- `sanitizeSearchInput()` SQL keyword stripping
- Metrics counter increments

### `security.test.ts`

- Role → permission matrix
- ABAC ownership checks
- Brute force lockout thresholds
- Security gate rate limit headers

### `mobile.test.ts`

- Offline sync queue serialization
- GPS coordinate validation
- Barcode scan payload format

### `api.test.ts`

- API key hashing and verification
- Scope enforcement
- Webhook HMAC signature generation

### `tenant.test.ts`

- Tenant slug resolution order
- i18n string lookup (en/hi)
- Usage record aggregation

## Adding Tests

1. Create `tests/<feature>.test.ts`
2. Run `npm run test:watch` during development
3. Ensure CI passes before merging

## Related

- [Testing overview](./README.md)
