# Testing

Test strategy for the Shree Shyam Dairy Farm ERP platform.

## Stack

| Tool          | Purpose                                   |
| ------------- | ----------------------------------------- |
| Vitest        | Unit and integration tests                |
| TypeScript    | `npm run typecheck`                       |
| ESLint        | `npm run lint`                            |
| Next.js build | `npm run build` — compile-time validation |

## CI Pipeline

Every PR and push runs (`.github/workflows/ci.yml`):

1. `npm ci`
2. `prisma generate`
3. `npm run lint`
4. `npm run typecheck`
5. `npm run test`
6. `npm run build`

## Running Tests Locally

```bash
npm run test          # single run
npm run test:watch    # watch mode
npm run typecheck
npm run lint
```

## Test Suites

| File                     | Coverage area                               |
| ------------------------ | ------------------------------------------- |
| `tests/ops.test.ts`      | Metrics, env helpers, security sanitization |
| `tests/security.test.ts` | Permissions, ABAC, brute force, gate        |
| `tests/mobile.test.ts`   | Offline sync, GPS, scanner helpers          |
| `tests/api.test.ts`      | API key auth, scopes, webhook signatures    |
| `tests/tenant.test.ts`   | Tenant resolution, i18n, usage metering     |

See [unit-tests.md](./unit-tests.md) for patterns and conventions.

## What Is Not Covered (yet)

- End-to-end browser tests (Playwright/Cypress)
- Load testing
- MQTT integration tests against live broker
- OpenAI API mocks in CI (AI routes tested at service level where possible)

## Related

- [Deployment](../architecture/deployment.md) — CI/CD
- [ADR Index](../adr/README.md)
