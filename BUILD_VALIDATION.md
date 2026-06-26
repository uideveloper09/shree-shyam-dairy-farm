# Build Validation Report

**Date:** 2025-06-25  
**Environment:** Windows, Node (local `.env.local` present)

---

## Summary

| Command             | Status    | Exit code |
| ------------------- | --------- | --------- |
| `npm run typecheck` | ✅ Passed | 0         |
| `npm run lint`      | ✅ Passed | 0         |
| `npm run test`      | ❌ Failed | 1         |
| `npm run build`     | ✅ Passed | 0         |

**Overall:** 3 of 4 checks passed. Tests failed due to `server-only` import chain in Vitest.

---

## Passed

### `npm run typecheck`

```
tsc --noEmit
```

No TypeScript errors.

### `npm run lint`

```
eslint .
✖ 53 problems (0 errors, 53 warnings)
```

Lint exits successfully. Zero errors; warnings documented below.

### `npm run build`

```
next build
✓ Compiled successfully in 17.2s
✓ Generating static pages (14/14)
```

Production build completed. All app routes generated. See warnings for Edge Runtime and middleware deprecation notices.

---

## Failed

### `npm run test`

```
vitest run
Test Files  3 failed | 15 passed (18)
Tests       1 failed | 124 passed (125)
Exit code: 1
```

#### Failed suites (2)

| File                    | Error                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| `tests/errors.test.ts`  | `server-only`: module cannot be imported from a Client Component |
| `tests/logging.test.ts` | Same `server-only` import error                                  |

**Root cause:** Import chain pulls `@/lib/logging/server` (or `@/lib/logging/index`) which includes `import "server-only"`. Vitest does not emulate the Next.js server boundary, so the package throws at load time.

#### Failed test (1)

| File                | Test                                                    | Error                                                               |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `tests/env.test.ts` | `validateConfigAtStartup does not throw in development` | Promise rejected with same `server-only` error instead of resolving |

**Import trace (shared):** `server-only` ← logging server module ← config/startup validation path.

---

## Warnings

### Lint — 53 warnings (0 errors)

| Rule                                | Count |
| ----------------------------------- | ----- |
| `no-console`                        | 35    |
| `@typescript-eslint/no-unused-vars` | 16    |
| `@next/next/no-img-element`         | 1     |
| Other                               | 1     |

Notable locations: `prisma/seed*.ts`, `workers/*.ts`, `src/app/api/v1/auth/oauth/google/route.ts`, `src/components/Navbar.jsx`, various services.

### Build — 5 Turbopack warnings (Edge Runtime)

Node.js APIs used in logging modules that are traced into Edge instrumentation:

| File                              | API                            | Line  |
| --------------------------------- | ------------------------------ | ----- |
| `src/lib/logging/rotation.ts`     | `process.on` (SIGHUP, SIGUSR1) | 71–72 |
| `src/lib/logging/rotation.ts`     | `process.stdout.write`         | 60    |
| `src/lib/logging/pino-factory.ts` | `process.pid`                  | 33    |
| `src/lib/logging/pino-factory.ts` | `process.stdout`               | 65    |

**Import traces:** `src/instrumentation.ts` → `src/lib/ops/logger.ts` → `src/lib/logging/server.ts` → rotation/pino-factory.

Build still succeeds; these are compatibility warnings for Edge Runtime.

### Build — 1 Next.js deprecation warning

```
The "middleware" file convention is deprecated. Please use "proxy" instead.
```

### npm — environment notice

```
npm warn Unknown env config "devdir". This will stop working in the next major version of npm.
```

Observed on all four commands; does not affect exit codes.

---

## Recommended follow-ups (not in scope)

1. **Tests:** Mock `server-only` in Vitest config, or import `@/lib/logging/server` only from server-scoped test helpers; decouple `validateConfigAtStartup` from server-only logging.
2. **Build warnings:** Guard rotation/pino-factory Node APIs with `typeof process !== "undefined"` checks, or exclude logging from Edge instrumentation bundle.
3. **Lint warnings:** Address unused vars and `no-console` in seeds/workers when cleanup is scheduled.
