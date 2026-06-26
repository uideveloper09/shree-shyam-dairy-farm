# Folder Restructuring — Migration Summary

**Date:** June 25, 2026  
**Based on:** [project-audit.md](./project-audit.md)  
**Status:** Complete — typecheck ✅ · 115 tests ✅

---

## Overview

The codebase was reorganized from a flat Next.js root layout into an **enterprise `src/` structure** without changing routes or UI. All `@/` imports were updated to resolve under `src/`.

---

## New Structure

```
shree-shyam-dairy-farm/
├── src/
│   ├── app/                 # Next.js App Router (unchanged routes)
│   ├── components/          # Marketing + shared UI
│   ├── features/            # Domain UI + client state
│   │   ├── account/
│   │   ├── cart/            # context/ + store/
│   │   ├── mobile/
│   │   ├── providers/
│   │   ├── subscription/
│   │   └── tenant/
│   ├── modules/             # Domain logic (non-service)
│   │   ├── crm/
│   │   ├── fleet/
│   │   ├── retail/
│   │   ├── processing/
│   │   ├── saas/
│   │   ├── ai-platform/
│   │   ├── notifications/
│   │   ├── workflows/
│   │   ├── documents/
│   │   └── integrations/
│   ├── services/            # Application / domain services
│   │   ├── crm/service.ts
│   │   ├── fleet/service.ts
│   │   ├── … (per domain)
│   │   ├── farm/
│   │   ├── mobile/
│   │   ├── api/
│   │   ├── tenant/
│   │   ├── cart.ts
│   │   └── subscription.ts
│   ├── repositories/
│   │   └── prisma.ts        # was lib/db/prisma.ts
│   ├── lib/                 # Infrastructure (auth, security, api, ops, billing, tenant, validators, mobile, farm)
│   ├── utils/               # Legacy JS helpers (data, cart, razorpay, routes, …)
│   ├── types/
│   │   └── index.ts         # Re-exports module types
│   ├── constants/           # tenant.ts, auth.ts, tokens.js, layout.js
│   ├── config/
│   │   └── env.ts           # was lib/ops/env.ts
│   ├── styles/
│   │   └── globals.css      # was app/globals.css
│   ├── assets/              # Non-public importable assets (.gitkeep)
│   ├── hooks/
│   ├── middleware.ts        # Next.js edge middleware (file, not folder — framework requirement)
│   └── instrumentation.ts
├── prisma/                  # Unchanged location
├── scripts/                 # + migrate-to-src.ps1, update-imports.ps1
├── docs/
├── tests/
├── workers/
├── public/                  # Static assets (Next.js requirement — stays at root)
├── data/
├── sdk/
└── k8s/, nginx/, monitoring/, …
```

---

## Path Mapping (imports)

| Old path                                   | New path                                            |
| ------------------------------------------ | --------------------------------------------------- |
| `app/`                                     | `src/app/`                                          |
| `components/`                              | `src/components/`                                   |
| `components/subscription/`                 | `src/features/subscription/`                        |
| `components/mobile/`                       | `src/features/mobile/`                              |
| `components/account/`                      | `src/features/account/`                             |
| `components/tenant/`                       | `src/features/tenant/`                              |
| `components/providers/`                    | `src/features/providers/`                           |
| `context/`                                 | `src/features/cart/context/`                        |
| `store/`                                   | `src/features/cart/store/`                          |
| `hooks/`                                   | `src/hooks/`                                        |
| `middleware.ts`                            | `src/middleware.ts`                                 |
| `instrumentation.ts`                       | `src/instrumentation.ts`                            |
| `app/globals.css`                          | `src/styles/globals.css`                            |
| `@/lib/db/prisma`                          | `@/repositories/prisma`                             |
| `@/lib/services/*`                         | `@/services/*`                                      |
| `@/lib/{domain}/service`                   | `@/services/{domain}/service`                       |
| `@/lib/{domain}/*` (non-service)           | `@/modules/{domain}/*`                              |
| `@/lib/tenant/constants`                   | `@/constants/tenant`                                |
| `@/lib/auth/constants`                     | `@/constants/auth`                                  |
| `@/lib/ops/env`                            | `@/config/env`                                      |
| `@/lib/tokens`                             | `@/constants/tokens`                                |
| `@/lib/layout`                             | `@/constants/layout`                                |
| `@/lib/data`, `utils`, `cart`, `routes`, … | `@/utils/{name}`                                    |
| `@/lib/auth`, `security`, `api`, `ops`, …  | `@/lib/...` (unchanged alias, now under `src/lib/`) |

**328 files** had import paths updated via `scripts/update-imports.ps1`.

---

## Config Changes

| File                 | Change                                                                     |
| -------------------- | -------------------------------------------------------------------------- |
| `tsconfig.json`      | `@/*` → `./src/*`; include `src/**`, `tests/**`, `prisma/**`, `workers/**` |
| `next.config.ts`     | CSP import → `./src/lib/ops/security`                                      |
| `vitest.config.ts`   | Alias `@` → `src/`                                                         |
| `src/app/layout.jsx` | CSS import → `../styles/globals.css`                                       |

---

## Routing

**No route changes.** URLs remain identical (`/`, `/admin/*`, `/api/v1/*`, `/m/*`, etc.). Next.js automatically uses `src/app/` when present.

---

## Verification

```bash
npm run typecheck   # pass
npm run test        # 115 tests pass
```

Clear stale `.next/` after migration if type errors reference old `app/` paths.

---

## Scripts Added

| Script                       | Purpose                    |
| ---------------------------- | -------------------------- |
| `scripts/migrate-to-src.ps1` | Initial folder moves       |
| `scripts/update-imports.ps1` | Bulk `@/` path replacement |

---

## Notes & Deviations

1. **`middleware/` folder** — Next.js requires `middleware.ts` at project root or `src/middleware.ts`, not `src/middleware/index.ts`. Placed at `src/middleware.ts`.
2. **`public/`** — Stays at repo root (Next.js static file serving).
3. **`prisma/`, `docs/`, `scripts/`** — Stay at repo root per enterprise convention.
4. **Nested move artifacts** — Initial script created `src/app/app`, `src/lib/lib`, etc.; flattened post-migration.
5. **UI unchanged** — No component markup or styling modified; only paths and imports.

---

## Follow-up (optional, not done)

- Add `src/middleware/` wrapper only if adopting a custom server; not needed for Next.js.
- Migrate `crop-logo.js` from repo root into `scripts/`.
- Add path aliases in `tsconfig` for `@/services/*`, `@/modules/*` documentation.
- Run `npm run build` in CI to validate standalone output paths.

---

_End of migration summary._
