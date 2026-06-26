# Dependency Report

**Project:** Shree Shyam Dairy Farm  
**Date:** June 25, 2026  
**Scope:** `package.json` analysis — no packages installed during this review  
**Related:** [project-audit.md](./project-audit.md)

---

## Executive Summary

| Metric                           | Count      |
| -------------------------------- | ---------- |
| Dependencies (before)            | 27         |
| Dev dependencies (before)        | 15         |
| **Removed (unused)**             | **6**      |
| Dependencies (after)             | 21         |
| Dev dependencies (after)         | 13         |
| Duplicate libraries              | 2 pairs    |
| `npm audit` findings             | 4 moderate |
| Recommended enterprise additions | 8          |

The updated `package.json` removes six unused packages, drops a redundant native bcrypt stack, and aligns `vitest` with the version already resolved in the lockfile. **Run `npm install` locally to refresh `package-lock.json`** — this review did not install anything.

---

## Unused Packages (Removed)

| Package                   | Type          | Evidence                                                                                                                                | Action                                              |
| ------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **`next-auth`**           | dependency    | Zero imports in `src/`, `workers/`, `prisma/`. Custom JWT via `jose` is production auth ([ADR-001](./adr/001-jwt-auth-over-authjs.md)). | **Removed** — also eliminates `uuid` advisory chain |
| **`bcrypt`**              | dependency    | Only `bcryptjs` imported in `src/lib/auth/password.ts`.                                                                                 | **Removed**                                         |
| **`@types/bcrypt`**       | devDependency | Types for removed `bcrypt` package.                                                                                                     | **Removed**                                         |
| **`@swc/helpers`**        | dependency    | Not imported in application code; already provided transitively by `next`.                                                              | **Removed**                                         |
| **`react-hook-form`**     | dependency    | No `import` from `react-hook-form` anywhere in codebase.                                                                                | **Removed**                                         |
| **`@hookform/resolvers`** | dependency    | No usage; only existed to pair with react-hook-form.                                                                                    | **Removed**                                         |

### Kept (verified in use)

| Package                        | Usage                                                               |
| ------------------------------ | ------------------------------------------------------------------- |
| `@aws-sdk/client-s3`           | Dynamic import in `src/lib/ops/storage.ts` (S3/R2)                  |
| `@prisma/client`               | Database layer                                                      |
| `@tanstack/react-query`        | Admin/mobile dashboards, `QueryProvider`                            |
| `bcryptjs`                     | `src/lib/auth/password.ts`                                          |
| `bullmq`                       | Dynamic import in `src/lib/ops/queue.ts`, `workers/queue.worker.ts` |
| `framer-motion`                | Marketing UI animations                                             |
| `ioredis`                      | Dynamic import in `src/lib/ops/redis.ts`                            |
| `jose`                         | `src/lib/auth/jwt.ts`                                               |
| `lucide-react`                 | Account, admin, subscription, mobile icons                          |
| `mqtt`                         | `workers/mqtt-bridge.worker.ts`, `edge/gateway`                     |
| `nanoid`                       | Cart, sessions, OTP, OAuth, tenant services                         |
| `next` / `react` / `react-dom` | Framework                                                           |
| `qrcode`                       | Retail/processing labels, mobile QR API                             |
| `razorpay`                     | Payment API routes + utils                                          |
| `react-icons`                  | Marketing components (Fa*, Hi* icons)                               |
| `sharp`                        | `crop-logo.js`; Next.js `next/image` optimization                   |
| `stripe`                       | Dynamic import in `src/lib/billing/stripe.ts`                       |
| `web-push`                     | Dynamic import in `src/services/mobile/platform.service.ts`         |
| `zod`                          | `src/lib/validators/*`                                              |
| `zustand`                      | `src/features/cart/store/useCartStore.js`                           |

---

## Duplicate Libraries

### 1. Password hashing — `bcrypt` + `bcryptjs` (resolved)

| Library    | Role                        | Resolution  |
| ---------- | --------------------------- | ----------- |
| `bcrypt`   | Native bindings, unused     | **Removed** |
| `bcryptjs` | Pure JS, used in production | **Kept**    |

**Note:** `bcryptjs` is slower but avoids native build issues on Windows/Alpine Docker. Acceptable for ERP auth; consider `bcrypt` only if profiling shows hashing as a bottleneck.

### 2. Icon libraries — `lucide-react` + `react-icons` (open)

| Library        | Usage                                            | Files (approx.) |
| -------------- | ------------------------------------------------ | --------------- |
| `lucide-react` | App shell, admin, subscriptions, mobile          | ~25             |
| `react-icons`  | Marketing site (Font Awesome, Heroicons subsets) | ~20             |

**Recommendation:** Consolidate on **one** icon system long-term (prefer `lucide-react` for tree-shaking and consistency). **Not removed** — both are actively imported; consolidation is a UI refactor, not a dependency-only change.

### 3. Duplicate `jose` (resolved by removing `next-auth`)

`next-auth` pulled its own `jose` copy in `node_modules/next-auth/node_modules/jose`. Direct `jose` dependency remains the single auth JWT implementation.

---

## Deprecated / Legacy Items

| Item                                      | Status                               | Recommendation                                                                            |
| ----------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **`package.json#prisma.seed`**            | Deprecated in Prisma 7               | Migrate to `prisma.config.ts` before Prisma 7 upgrade                                     |
| **`next-auth` v4**                        | Legacy; Auth.js v5 is successor      | Removed — if OAuth expansion needs Auth.js, add `next-auth@5` / `@auth/core` deliberately |
| **Nested `postcss@8.4.31` inside `next`** | Below patched `8.5.10`               | Monitor Next.js 16.2.x patches; Tailwind already uses `postcss@8.5.15` at top level       |
| **`npm audit fix --force`**               | Suggests downgrading to `next@9.3.3` | **Do not run** — false fix path                                                           |

---

## Security Risks (`npm audit`)

**4 moderate vulnerabilities** (as of review date):

| Advisory                                                                 | Package               | Severity | Path                                                      | Mitigation                                                                   |
| ------------------------------------------------------------------------ | --------------------- | -------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | `postcss` &lt; 8.5.10 | Moderate | `next` → nested `postcss@8.4.31`                          | Upgrade Next when patch ships; low runtime risk (CSS build-time stringify)   |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | `uuid` &lt; 11.1.1    | Moderate | `next-auth` → `uuid`                                      | **Removing `next-auth` resolves this direct dependency** after `npm install` |
| CI `npm audit --audit-level=high`                                        | —                     | —        | `.github/workflows/ci.yml` uses `continue-on-error: true` | Consider failing CI on high/critical after cleanup                           |

**No critical or high severity issues** reported in the current audit output.

---

## Version Updates (in updated `package.json`)

| Package          | Before    | After    | Notes                             |
| ---------------- | --------- | -------- | --------------------------------- |
| `vitest`         | `^3.0.5`  | `^3.2.6` | Matches lockfile resolved version |
| `engines.node`   | (missing) | `>=20`   | Aligns with CI Node 20            |
| Removed packages | —         | —        | See unused table                  |

**Not bumped** (pin intentionally):

- `next@16.2.9` — bleeding edge; verify against `AGENTS.md` before minor bumps
- `react@19.2.4` — matches Next 16 peer
- `prisma@6.19.3` — schema stability

**After `npm install`, consider:**

```bash
npm outdated
```

Review minors for `stripe`, `@aws-sdk/client-s3`, `bullmq`, `ioredis` quarterly.

---

## Recommended Enterprise Packages (Not Added)

These are **not** in `package.json` — add when implementing the corresponding capability.

| Package                                                  | Purpose                    | Project gap                                                                 |
| -------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| **`@sentry/nextjs`**                                     | Error tracking             | `SENTRY_DSN` in `.env.example` but only logger stub in `instrumentation.ts` |
| **`@playwright/test`**                                   | E2E regression             | No `e2e/` suite; checkout/auth untested end-to-end                          |
| **`@vitest/coverage-v8`**                                | Coverage gates             | No `test:coverage` script                                                   |
| **`prettier`** + **`eslint-config-prettier`**            | Formatting consistency     | ESLint only; no formatter                                                   |
| **`husky`** + **`lint-staged`**                          | Pre-commit quality         | Hooks not enforced                                                          |
| **`@opentelemetry/api`** + **`@opentelemetry/sdk-node`** | Distributed tracing        | Metrics route exists; no OTLP export                                        |
| **`pino`** or **`winston`**                              | Structured production logs | Custom `lib/ops/logger` — evaluate upgrade                                  |
| **`dotenv-cli`**                                         | Script env loading         | Workers/seeds rely on shell env                                             |

### Lower priority

| Package                                      | Purpose                                        |
| -------------------------------------------- | ---------------------------------------------- |
| `npm-run-all`                                | Parallel `db:seed-*` orchestration             |
| `cross-env`                                  | Windows-friendly env in npm scripts            |
| `zod-prisma-types` or `prisma-zod-generator` | DB ↔ validator sync                            |
| `dependency-cruiser`                         | Enforce `src/` layer boundaries post-migration |

---

## Icon Library Consolidation Plan (optional)

1. Audit `react-icons` imports in `src/components/` marketing files.
2. Replace Fa/Hi icons with Lucide equivalents.
3. Remove `react-icons` (~save ~500KB+ from client bundles depending on imports).
4. **Estimated effort:** 4–6 hours.

---

## ADR Impact

Removing **`next-auth`** supersedes the “keep for future migration” note in [ADR-001](./adr/001-jwt-auth-over-authjs.md). If Auth.js is needed later, add `next-auth@5` (Auth.js) explicitly with a new ADR — do not restore v4.

---

## Next Steps

1. Run **`npm install`** to apply `package.json` changes and refresh the lockfile.
2. Run **`npm audit`** again — expect **2** moderate issues (postcss via next) down from 4.
3. Run **`npm run typecheck`** and **`npm run test`** — should remain green.
4. Update **ADR-001** footnote when convenient.
5. Plan **Sentry** or **OpenTelemetry** for production observability.

---

## Changelog Summary

```diff
 dependencies:
-  "@hookform/resolvers": "^5.4.0",
-  "@swc/helpers": "^0.5.15",
-  "bcrypt": "^6.0.0",
   "bcryptjs": "^3.0.3",
-  "next-auth": "^4.24.14",
-  "react-hook-form": "^7.80.0",
 devDependencies:
-  "@types/bcrypt": "^6.0.0",
-  "vitest": "^3.0.5",
+  "vitest": "^3.2.6",
+ "engines": { "node": ">=20" }
```

---

_End of dependency report. No packages were installed during this review._
