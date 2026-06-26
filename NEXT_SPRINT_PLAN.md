# NEXT_SPRINT_PLAN.md

**Project:** Shree Shyam Dairy Farm  
**Sprint:** Sprint 0 — Production Stabilization  
**Duration:** 1 week (5 working days)  
**Date:** June 25, 2026  
**Source:** `MASTER_PROJECT_AUDIT.md` Phase 10 — **one sprint only**

---

## Sprint Goal

**Restore a green production build and CI pipeline** while fixing blocking lint errors and securing the logging architecture — without adding new product features.

Until `npm run build` passes, no deployment, bundle analysis, or feature work should take priority over this sprint.

---

## Why This Sprint (Not Feature Work)

| Signal            | Finding                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| Build             | ❌ Fails — Pino/`fs` in client bundle via `error.tsx`, `global-error.tsx` |
| CI                | `.github/workflows/ci.yml` runs build on every PR — **currently red**     |
| TypeScript        | ✅ Passes — code is type-safe but not shippable                           |
| Tests             | ✅ 148/148 — foundation tests healthy                                     |
| Foundation report | P0 explicitly: server-only logging split                                  |

Feature gaps (wishlist, order history, admin products) are real but **secondary** while the artifact cannot compile for production.

---

## Sprint Backlog

### Day 1–2: Logging architecture fix (P0)

| #   | Task                                   | Acceptance criteria                                                       |
| --- | -------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Create `src/lib/logging/client.ts`     | Browser-safe `logError()` shim (no Pino); no Node imports                 |
| 2   | Mark server modules with `server-only` | `pino-factory.ts`, `rotation.ts`, `ops/logger.ts` cannot import in client |
| 3   | Split `@/lib/logging` barrel           | Client components import `@/lib/logging/client` only                      |
| 4   | Update `error.tsx`, `global-error.tsx` | Use client logging shim                                                   |
| 5   | Update `instrumentation.ts`            | Dynamic import server logger on Node runtime only                         |
| 6   | Verify                                 | `npm run build` completes with zero `fs`/`worker_threads` errors          |

**Do not** remove Pino — fix the import boundary only.

---

### Day 2–3: ESLint error resolution (P0)

| #   | Task                            | File(s)                                                                                                       | Approach                                                      |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 7   | Fix `set-state-in-effect`       | `Navbar.jsx`, `ChatAssistant.jsx`, `PaymentCheckoutModal.jsx`, `OfflineBanner.jsx`, `SubscriptionManager.jsx` | Derive state, lazy init, or event handlers — no rewrite of UX |
| 8   | Fix `no-assign-module-variable` | `src/app/api/v1/ai/analyze/route.ts`                                                                          | Rename `module` variable                                      |
| 9   | Fix `no-require-imports`        | `crop-logo.js`, `sdk/typescript/src/client.ts`                                                                | Convert to ESM or exclude from lint scope                     |
| 10  | Verify                          | —                                                                                                             | `npm run lint` exits 0 **errors** (warnings acceptable)       |

---

### Day 3–4: CI verification + minimal performance win

| #   | Task                                    | Acceptance criteria                                                     |
| --- | --------------------------------------- | ----------------------------------------------------------------------- |
| 11  | Full local validation                   | `typecheck` + `test` + `lint` + `build` all pass                        |
| 12  | Remove `force-dynamic` from root layout | `src/app/layout.jsx` — marketing can use default static where safe      |
| 13  | Remove `force-dynamic` from homepage    | `src/app/page.jsx` — verify content still loads                         |
| 14  | Document worker deployment note         | Add paragraph to `docs/deployment.md`: queue/MQTT workers not on Vercel |
| 15  | Update `docs/foundation-report.md`      | Mark build P0 resolved (if fixed)                                       |

---

### Day 4–5: Hardening + debt cleanup (P1, no features)

| #   | Task                                       | Acceptance criteria                                               |
| --- | ------------------------------------------ | ----------------------------------------------------------------- |
| 16  | Add `server-only` package if missing       | `package.json` dependency                                         |
| 17  | ESLint ignore or fix seed `console.log`    | Reduce warning noise OR `overrides` for `prisma/seed*.ts`         |
| 18  | Delete verified dead files                 | `crop-logo.js`, unused `About.jsx` etc. (per Knip — verify first) |
| 19  | Add `@commitlint/types` to devDependencies | Fix unlisted dependency warning                                   |
| 20  | Run CI dry-run checklist                   | Push branch; confirm GitHub Actions green                         |

---

## Out of Scope (Explicit)

The following are **not** in this sprint:

- New customer features (wishlist, search, order history UI)
- Admin products/orders CRUD
- Prettier mass-format (581 files) — separate PR
- `withApi` / `getConfig()` migration across 173 routes
- Prisma schema changes or new migrations
- Apple Sign-In, breeding/calf ERP
- Playwright E2E setup
- Sentry integration

---

## Team & Ownership

| Area             | Owner suggestion            |
| ---------------- | --------------------------- |
| Logging split    | Backend / platform engineer |
| React lint fixes | Frontend engineer           |
| CI verification  | DevOps / lead               |
| Docs update      | Whoever completes build fix |

---

## Definition of Done

- [ ] `npm run build` — exit 0
- [ ] `npm run typecheck` — exit 0
- [ ] `npm run test` — 148+ tests pass
- [ ] `npm run lint` — 0 errors
- [ ] GitHub Actions `validate` job — green on `main`
- [ ] No Pino/Node APIs in client bundle (verify via build output)
- [ ] `PROJECT_STATUS.md` Blocked section updated to reflect build status
- [ ] No new product features merged under guise of “fixes”

---

## Success Metrics

| Metric                     | Before | Target  |
| -------------------------- | ------ | ------- |
| Build                      | Fail   | Pass    |
| ESLint errors              | 10     | 0       |
| Production readiness score | 52/100 | ≥65/100 |
| CI build step              | Red    | Green   |

---

## Risks During Sprint

| Risk                                         | Mitigation                                         |
| -------------------------------------------- | -------------------------------------------------- |
| `server-only` throws at wrong import site    | Audit all `@/lib/logging` imports with build trace |
| Removing `force-dynamic` breaks tenant theme | Test with `TenantThemeInjector` on static page     |
| React effect refactors introduce UX bugs     | Manual smoke: cart, checkout modal, navbar scroll  |
| Windows Prisma EPERM on generate             | Non-blocking; document workaround                  |

---

## Post-Sprint (Preview Only — Not This Sprint)

After Sprint 0 is green, the **recommended Sprint 1** would be **Customer Commerce MVP**: order history UI, forgot/reset password pages, checkout address step. That is documented in `IMPLEMENTATION_CHECKLIST.md` — not scheduled here per master audit rule of **one sprint only**.

---

## References

- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Full status and scores
- [docs/foundation-report.md](./docs/foundation-report.md) — Build failure root cause
- [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) — Items deferred from this sprint
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) — Full roadmap

---

_Single sprint plan per MASTER_PROJECT_AUDIT.md. No implementation included in this document._
