# TECHNICAL_DEBT.md

**Project:** Shree Shyam Dairy Farm  
**Date:** June 25, 2026 · **Sprint 0 updated:** June 26, 2026  
**Source:** `MASTER_PROJECT_AUDIT.md` Phases 1–8 + foundation validation + `SPRINT0_SUMMARY.md`  
**Purpose:** Living register of technical debt — prioritized, actionable, justified

---

## How to Use This Document

- **P0** — Blocks release or CI; fix immediately (see [NEXT_SPRINT_PLAN.md](./NEXT_SPRINT_PLAN.md))
- **P1** — High impact on quality, security, or velocity; schedule within 2–4 weeks
- **P2** — Maintenance burden; address when touching related code
- **P3** — Nice-to-have; long-term cleanup

Do not pay debt by rewriting working features. Prefer incremental refactoring.

---

## P0 — Release Blockers

| ID     | Debt                          | Location                           | Impact        | Status                                                |
| ------ | ----------------------------- | ---------------------------------- | ------------- | ----------------------------------------------------- |
| TD-001 | Pino logging in client bundle | `error.tsx`, `global-error.tsx`    | Build fails   | ✅ **Resolved** Sprint 0 — `@/lib/logging/client`     |
| TD-002 | CI validate job red           | `.github/workflows/ci.yml`         | Unsafe merges | 🟡 **Partial** — build/lint pass; **test step fails** |
| TD-003 | ESLint errors (10)            | Navbar, PaymentCheckoutModal, etc. | CI lint fails | ✅ **Resolved** Sprint 0 — 0 errors                   |

### P0 — New (post Sprint 0)

| ID     | Debt                                 | Location                                                             | Impact              | Recommended fix                                |
| ------ | ------------------------------------ | -------------------------------------------------------------------- | ------------------- | ---------------------------------------------- |
| TD-004 | Vitest `server-only` incompatibility | `tests/errors.test.ts`, `tests/logging.test.ts`, `tests/env.test.ts` | CI test step red    | Vitest alias mock for `server-only`            |
| TD-005 | Deploy not gated on CI               | `.github/workflows/deploy.yml`                                       | Deploy while CI red | `workflow_run` dependency or branch protection |

---

## P1 — Architecture & Platform

| ID     | Debt                                                 | Location                                                 | Impact                                             | Recommended fix                                           |
| ------ | ---------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| TD-010 | Monolithic Prisma schema (~100 models, ~3,200 lines) | `prisma/schema.prisma`                                   | Slow codegen; merge conflicts; cognitive load      | Domain schema modules (long-term) or ownership boundaries |
| TD-011 | Single migration file                                | `prisma/migrations/20260626102505_initial_schema/`       | `db:push` drift risk                               | Baseline migrations; ban push in prod                     |
| TD-012 | Dual language stack (JS + TS)                        | `src/components/*.jsx`, `src/utils/*.js`, payment routes | Inconsistent validation/types                      | Incremental TS migration per touched file                 |
| TD-013 | `getConfig()` not adopted                            | ~60 files use `process.env` directly                     | Bypasses validated config                          | Migrate high-risk paths (auth, payment) first             |
| TD-014 | `withApi` / `AppError` not adopted                   | ~173 API routes; 0 uses `parseOrThrow` in routes         | Inconsistent error JSON                            | Migrate auth + payment routes first                       |
| TD-015 | `withApi` unused by routes                           | `src/lib/ops/api-handler.ts`                             | Knip flags as unused; handler exists but not wired | Adopt in new/edited routes                                |
| TD-016 | Legacy API paths outside v1                          | `/api/payment/*`, `/api/chat`, `/api/products`           | Versioning inconsistency                           | Migrate to `/api/v1/` with compat redirects               |
| TD-017 | File-based CMS                                       | `data/content.json`, `src/utils/data.js`                 | Split-brain with DB products                       | DB-backed CMS or headless integration                     |
| TD-018 | No repository layer beyond Prisma                    | Services call `prisma` directly                          | Harder to test/swap data layer                     | Optional thin repos per domain                            |
| TD-019 | 13 duplicate admin layouts                           | `src/app/admin/*/layout.jsx`                             | UI inconsistency; duplicate nav code               | Shared `AdminShell` component                             |
| TD-020 | Middleware deprecation                               | `src/middleware.ts`                                      | Future Next.js 16 break                            | Plan migration to `proxy` convention                      |

---

## P1 — Performance

| ID     | Debt                                         | Location                                     | Impact                                          | Recommended fix                                             |
| ------ | -------------------------------------------- | -------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| TD-030 | Root layout explicit `force-dynamic`         | `src/app/layout.jsx`                         | Redundant export                                | ✅ **Resolved** Sprint 0 — `headers()` still dynamic        |
| TD-031 | Homepage explicit `force-dynamic`            | `src/app/page.jsx`                           | Redundant export                                | ✅ **Resolved** Sprint 0                                    |
| TD-032 | 170+ `force-dynamic` exports                 | API routes + pages                           | APIs expected; 3 UI pages had redundant exports | 🟡 **Partial** — UI pages cleaned; 173 API routes unchanged |
| TD-033 | Marketing fully dynamic (tenant `headers()`) | `src/app/layout.jsx`                         | Poor SEO/TTFB vs static ISR                     | Split tenant theme from root layout                         |
| TD-034 | Duplicate icon libraries                     | `lucide-react` + `react-icons`               | Larger client bundle                            | Consolidate to lucide                                       |
| TD-035 | Raw `<img>` usage                            | `src/app/m/customer/page.jsx`                | LCP/bandwidth                                   | `next/image`                                                |
| TD-036 | `framer-motion` everywhere                   | Marketing components                         | Bundle weight                                   | Lazy-load below fold                                        |
| TD-037 | No bundle analyzer in CI                     | `package.json`                               | Regressions invisible                           | Add `@next/bundle-analyzer` post-build                      |
| TD-038 | No `test:coverage`                           | CI                                           | Coverage gaps hidden                            | Vitest coverage thresholds                                  |
| TD-039 | Edge logging warnings                        | `server/core/rotation.ts`, `pino-factory.ts` | Edge instrumentation warnings at build          | Guard Node APIs or exclude from edge bundle                 |

---

## P1 — Security & Compliance

| ID     | Debt                                  | Location                            | Impact                             | Recommended fix                |
| ------ | ------------------------------------- | ----------------------------------- | ---------------------------------- | ------------------------------ |
| TD-040 | npm audit moderate (postcss via next) | `node_modules/next`                 | XSS in CSS stringify (transitive)  | Track Next.js release          |
| TD-041 | CI audit non-blocking                 | `ci.yml` `continue-on-error: true`  | Moderate+ may ship                 | Fail on high; warn on moderate |
| TD-042 | Sentry env without SDK                | `.env.example`, no `@sentry/nextjs` | False sense of monitoring          | Wire SDK or remove env vars    |
| TD-043 | JWT not verified in middleware        | `src/middleware.ts`                 | Cookie presence only, not validity | Optional edge JWT verify       |
| TD-044 | GraphQL endpoint                      | `/api/graphql`                      | Attack surface if unauthenticated  | Audit auth + complexity limits |
| TD-045 | Admin content API                     | `/api/content` PUT + `ADMIN_SECRET` | Single shared secret               | Rotate + IP allowlist option   |

---

## P1 — E-Commerce Product Debt

| ID     | Debt                                   | Location                           | Impact                       | Recommended fix            |
| ------ | -------------------------------------- | ---------------------------------- | ---------------------------- | -------------------------- |
| TD-050 | Account pages are placeholders         | `account/orders`, `account/[slug]` | Poor customer UX             | Implement Phase 3–5 pages  |
| TD-051 | Wishlist model, no API/UI              | `WishlistItem` model               | Incomplete feature           | API + account page         |
| TD-052 | Address model, no checkout UI          | `Address` model                    | Orders lack shipping address | Checkout step              |
| TD-053 | No product search                      | —                                  | Discovery gap                | Search API + navbar        |
| TD-054 | No admin product CRUD                  | —                                  | Ops depends on seeds/JSON    | Admin module               |
| TD-055 | No admin order management              | —                                  | Support cannot manage orders | Admin orders list          |
| TD-056 | Invoice generation missing             | —                                  | B2B / GST compliance gap     | PDF service post-payment   |
| TD-057 | Storefront payment webhooks incomplete | Razorpay tenant webhooks only      | Payment state drift          | Storefront webhook handler |

---

## P2 — Code Quality

| ID     | Debt                           | Location                                    | Impact                           | Recommended fix                                |
| ------ | ------------------------------ | ------------------------------------------- | -------------------------------- | ---------------------------------------------- |
| TD-060 | 581 Prettier drifts            | Codebase-wide                               | Format noise in PRs              | Dedicated `npm run format` PR                  |
| TD-061 | 53 ESLint warnings             | Seeds, workers, unused vars                 | Noise hides real issues          | Overrides for seeds; fix unused                |
| TD-062 | 19 Knip unused files           | See foundation report                       | Dead code confusion              | Verify and delete                              |
| TD-063 | ~200 unused exports (Knip)     | `@/lib/errors`, `@/config`                  | False positives + real dead code | Export only what's used OR document public API |
| TD-064 | Brand naming drift (Anmasa)    | `AnmasaHero.jsx`, `WhyAnmasa.jsx`           | Confusion for contributors       | Rename to neutral internal names               |
| TD-065 | Duplicate component candidates | `src/components/` vs `components/` at root? | Import confusion                 | Verify; remove root duplicates if any          |
| TD-066 | `ErrorBoundary` not wired      | `src/components/errors/`                    | Dead infrastructure              | Wrap account/admin client trees                |
| TD-067 | `sdk/typescript/` unused       | Knip                                        | SDK not published/consumed       | Publish or move to separate repo               |
| TD-068 | `edge/gateway/` orphan         | Outside `src/`                              | Unclear deployment               | Document or integrate                          |
| TD-069 | `public/sw.js` unreferenced    | Knip                                        | PWA inconsistency                | Wire or remove                                 |
| TD-070 | `sharp` flagged unused         | Knip                                        | False positive — Next images     | Ignore or document                             |

---

## P2 — Database

| ID     | Debt                                  | Location                            | Impact                   | Recommended fix                 |
| ------ | ------------------------------------- | ----------------------------------- | ------------------------ | ------------------------------- |
| TD-080 | Missing domain models                 | Warehouse, Supplier, Breeding, Calf | ERP checklist gaps       | Add when product prioritized    |
| TD-081 | `farmId` vs `tenantId` dual isolation | Farm IoT vs ecommerce               | Query mistakes           | Lint rule or service helpers    |
| TD-082 | Index coverage uneven                 | Some high-volume tables             | Slow dashboards at scale | Profile + add composite indexes |
| TD-083 | No read replicas documented           | Neon                                | Scale ceiling            | Document pooling + replicas     |
| TD-084 | Seed script proliferation             | 14 `db:seed-*` commands             | Onboarding complexity    | `db:seed:all` meta-script       |

---

## P2 — Testing

| ID     | Debt                         | Location                | Impact                       | Recommended fix                   |
| ------ | ---------------------------- | ----------------------- | ---------------------------- | --------------------------------- |
| TD-090 | No E2E tests                 | —                       | Regressions in checkout/auth | Playwright smoke suite            |
| TD-091 | API route coverage ~8%       | 125 tests vs 173 routes | Payment bugs undetected      | Tests for payment/auth paths      |
| TD-092 | Vitest `server-only`         | `vitest.config.ts`      | 3 suites fail to load        | Mock `server-only` module         |
| TD-093 | No integration tests with DB | Vitest unit only        | Prisma logic untested live   | Test DB in CI optional job        |
| TD-094 | Tests not colocated          | `tests/` at root        | Harder to find               | Accept or adopt colocation policy |

---

## P2 — DevOps & Operations

| ID     | Debt                             | Location              | Impact                            | Recommended fix                    |
| ------ | -------------------------------- | --------------------- | --------------------------------- | ---------------------------------- |
| TD-100 | Workers not on Vercel            | `workers/*.ts`        | Queue/MQTT inactive in serverless | Railway/Fly worker deploy          |
| TD-101 | Backup scripts bash-only         | `scripts/backup-*.sh` | Windows dev friction              | Document WSL requirement           |
| TD-102 | `allowedDevOrigins` hardcoded IP | `next.config.ts`      | Dev machine coupling              | Env-driven                         |
| TD-103 | No staging env verification doc  | —                     | Release risk                      | Staging checklist in deployment.md |

---

## P3 — Documentation & Process

| ID     | Debt                                           | Location                                                   | Impact                   | Recommended fix                     |
| ------ | ---------------------------------------------- | ---------------------------------------------------------- | ------------------------ | ----------------------------------- |
| TD-110 | `project-audit.md` references pre-`src/` paths | `docs/project-audit.md`                                    | Stale guidance           | Add deprecation banner              |
| TD-111 | ADR-001 mentions next-auth                     | `docs/adr/001-*`                                           | Contradicts JWT decision | Update ADR                          |
| TD-112 | Multiple deployment doc paths                  | `devops.md`, `deployment.md`, `architecture/deployment.md` | Navigation confusion     | Keep canonical `docs/deployment.md` |
| TD-113 | `@commitlint/types` unlisted                   | `commitlint.config.mjs`                                    | Knip warning             | Add devDependency                   |

---

## P3 — Feature Stubs (Schema/API Without UI)

| ID     | Debt                                  | Notes                          |
| ------ | ------------------------------------- | ------------------------------ |
| TD-120 | Apple Sign-In                         | `AuthProvider.APPLE` enum only |
| TD-121 | Buy again / recently viewed / compare | Not started                    |
| TD-122 | Delivery OTP at door                  | Auth OTP only                  |
| TD-123 | Milk collection ledger                | Forecasting/tank only          |
| TD-124 | Supplier / warehouse                  | No models                      |
| TD-125 | Breeding / calf                       | No models                      |
| TD-126 | Full finance GL                       | Wallet + expense workflow only |

---

## Debt Paydown Strategy

```
Sprint 0  →  TD-001 ✅, TD-003 ✅, TD-030/031 ✅, logging reorg ✅
Sprint 0.1 → TD-004, TD-002 (Vitest mock → full CI green)
Sprint 1  →  TD-050–TD-057 (customer commerce MVP)
Sprint 2  →  TD-033, TD-054–TD-055 (tenant ISR + admin)
Ongoing   →  TD-012–TD-014 on every touched file
Quarterly →  TD-010, TD-011 (schema hygiene)
```

---

## Metrics to Track

| Metric                     | Pre Sprint 0 | Post Sprint 0             | Target (Q3 2026) |
| -------------------------- | ------------ | ------------------------- | ---------------- |
| Build pass rate            | 0%           | **100%**                  | 100%             |
| ESLint errors              | 10           | **0**                     | 0                |
| UI `force-dynamic` exports | 3            | **0**                     | 0                |
| CI validate job green      | 0%           | **~75%** (test step only) | 100%             |
| Routes using `AppError`    | ~0%          | ~0%                       | 30%              |
| `process.env` in services  | ~60 files    | ~60 files                 | <20 files        |
| Test suites loading        | 18/18        | **15/18**                 | 18/18            |
| Production readiness       | 52/100       | **~68/100**               | 75/100           |

---

## Related

- [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- [NEXT_SPRINT_PLAN.md](./NEXT_SPRINT_PLAN.md)
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)
- [SPRINT0_SUMMARY.md](./SPRINT0_SUMMARY.md)

---

_Updated post Sprint 0 (June 26, 2026). No code modified in this update._
