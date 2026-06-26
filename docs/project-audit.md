# Shree Shyam Dairy Farm — Project Audit Report

**Date:** June 25, 2026  
**Auditor role:** Principal Software Architect / Senior Full Stack Engineer  
**Scope:** Full codebase review — no application code was modified during this audit  
**Stack:** Next.js 16.2.9 · React 19 · Prisma 6 · PostgreSQL · Tailwind CSS v4 · Vitest

---

## Executive Summary

Shree Shyam Dairy Farm is a **large, production-oriented Next.js monolith** that has evolved from an e-commerce marketing site into a **multi-tenant dairy ERP** spanning farm IoT, CRM, fleet, processing, retail POS, AI, SaaS marketplace, workflows, documents, notifications, and a mobile PWA.

**Overall maturity:** High for an SMB/agri-tech product. The project demonstrates strong domain modularization in newer TypeScript modules, extensive API surface (~175 route handlers), RBAC/ABAC security, multi-tenant isolation, Docker/K8s/CI infrastructure, and unusually thorough documentation (~65 doc files).

**Primary risks:** (1) **dual-stack legacy JS + modern TS** creating maintenance drag, (2) **monolithic Prisma schema** (~100 models, ~3,200 lines) with migration drift, (3) **global `force-dynamic`** hurting performance/SEO, (4) **thin automated test coverage** relative to API breadth, (5) **unused dependencies** and **brand naming drift** (Anmasa vs Shree Shyam), (6) **no shared admin shell** and duplicated layout patterns.

**Recommendation:** Treat this as a mature platform requiring **incremental consolidation**, not a rewrite. Prioritize legacy API migration, schema migration hygiene, performance tuning on public routes, and test expansion for critical payment/auth paths.

---

## 1. Folder Structure

### Current layout

| Area           | Path                                                            | Assessment                                                                           |
| -------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| App Router     | `app/` (~239 files)                                             | Marketing, account, 14+ admin modules, mobile PWA, developers portal, 175 API routes |
| Business logic | `lib/` (~170 files)                                             | Domain folders (`crm/`, `fleet/`, `saas/`, etc.) + legacy flat `.js`                 |
| UI             | `components/` (~61 files)                                       | Flat marketing components + `ui/`, `subscription/`, `mobile/`, `tenant/`             |
| Data layer     | `prisma/`                                                       | Single large schema, 1 migration, 14 seed scripts                                    |
| Tests          | `tests/`                                                        | 15 Vitest files, 115 tests — all top-level, none colocated                           |
| Docs           | `docs/`                                                         | Architecture, API, admin/user/farm guides, ADRs, ER diagrams                         |
| Infra          | `k8s/`, `nginx/`, `monitoring/`, `workers/`, `scripts/`, `sdk/` | Production-ready ops footprint                                                       |

### Good practices

- Clear **domain-driven** folders for enterprise modules (`lib/crm/`, `lib/retail/`, `lib/saas/`).
- Consistent **API versioning** under `/api/v1/` with public API at `/api/public/v1/`.
- **Workers** separated from web process (MQTT, BullMQ queue, webhook retry).
- **SDK** published for external integrators (`sdk/typescript/`).

### Problems

- **No `src/` directory** — valid for Next.js but mixes concerns at repo root (`crop-logo.js`, `middleware.ts`, `instrumentation.ts`).
- **Singular `context/`** instead of conventional `contexts/` — minor inconsistency.
- **`hooks/`** contains only `useCartSync.js` — hooks are scattered (inline in pages, contexts, Zustand).
- **No root `types/`** — types colocated per domain (acceptable but inconsistent with large cross-cutting enums).
- **Marketing components** mostly flat at `components/` root; only `sections/AboutSection.jsx` is namespaced.
- **`edge/gateway/`** exists outside main app — unclear deployment relationship to Next.js middleware.

### Missing conventional folders

| Expected                                        | Status                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `app/error.jsx`, `loading.jsx`, `not-found.jsx` | **Missing** — no route-level error/loading boundaries              |
| `app/admin/layout.jsx`                          | **Missing** — each admin submodule duplicates its own shell        |
| `e2e/` or `playwright/`                         | **Missing**                                                        |
| `types/` (shared)                               | **Missing**                                                        |
| `config/` (centralized)                         | **Missing** — config spread across root files and `lib/ops/env.ts` |

---

## 2. package.json

### Scripts (well-organized)

| Category  | Scripts                                                                      |
| --------- | ---------------------------------------------------------------------------- |
| Dev/build | `dev`, `build`, `start`, `lint`, `typecheck`, `test`                         |
| Database  | `db:generate`, `db:migrate`, `db:push`, `db:studio`, 14 `db:seed-*` commands |
| Workers   | `worker:mqtt`, `worker:queue`, `worker:webhooks`                             |
| Docker    | `docker:dev`, `docker:prod`, `docker:monitoring`                             |
| Backup    | `backup:db`, `backup:files` (bash — Windows devs need WSL/Git Bash)          |

### Good practices

- Modular seed scripts per domain align with modular admin UIs.
- CI runs lint → typecheck → test → build.
- `typecheck` separate from build — catches TS errors early.

### Problems

- **`db:push` vs `db:migrate` ambiguity** — team may use push in dev and drift from the single migration file.
- **No `test:coverage`** script — coverage invisible in CI.
- **No `format` / Prettier** script — formatting not enforced.
- **`prisma.seed` in package.json** is deprecated (Prisma 7 warning observed).

---

## 3. Dependencies

### Production (`package.json`)

| Package               | Version     | Notes                                                       |
| --------------------- | ----------- | ----------------------------------------------------------- |
| next                  | 16.2.9      | Bleeding edge — verify against `AGENTS.md` breaking changes |
| react / react-dom     | 19.2.4      | Latest                                                      |
| @prisma/client        | 6.19.3      |                                                             |
| @tanstack/react-query | 5.x         | Used in admin dashboards                                    |
| zustand               | 5.x         | Cart state                                                  |
| jose                  | 6.x         | JWT (modern choice)                                         |
| bcrypt + bcryptjs     | both listed | **Only `bcryptjs` is used** — `bcrypt` is dead weight       |
| next-auth             | 4.24.14     | **Not imported anywhere** — unused dependency               |
| bullmq + ioredis      |             | Queue infrastructure                                        |
| stripe + razorpay     |             | Dual payment providers                                      |
| mqtt                  |             | Farm IoT bridge                                             |
| framer-motion         | 12.x        | Animations                                                  |
| zod                   | 4.x         | Validation                                                  |

### Dev dependencies

- Tailwind v4 + `@tailwindcss/postcss` — modern setup.
- Vitest 3.x — unit tests only.
- ESLint 9 + `eslint-config-next` — aligned with Next 16.

### Problems

| Issue                                           | Severity                                               |
| ----------------------------------------------- | ------------------------------------------------------ |
| Unused `next-auth`                              | Medium — remove or implement                           |
| Duplicate `bcrypt` + `bcryptjs`                 | Low — remove `bcrypt`                                  |
| No `@sentry/nextjs` despite `SENTRY_DSN` in env | Medium — instrumentation logs only, no real Sentry SDK |
| No Playwright/Cypress                           | Medium — no E2E framework                              |
| No Prettier                                     | Low                                                    |

---

## 4. TypeScript Configuration

**File:** `tsconfig.json`

### Good practices

- `"strict": true` — strong type safety enabled.
- `"allowJs": true` — supports incremental JS → TS migration.
- Path alias `@/*` → repo root — consistent imports.

### Problems

| Issue                                   | Detail                                                          |
| --------------------------------------- | --------------------------------------------------------------- |
| **Stale include**                       | References `app/layout.tsx` but actual file is `app/layout.jsx` |
| **Malformed include array**             | Line break inside `include` array — works but sloppy            |
| **No `jsx` strict checking for `.jsx`** | Most UI is untyped JSX                                          |
| **Target ES2017**                       | Could bump to ES2020+ for modern runtimes                       |
| **~17 legacy `.js` files in `lib/`**    | Untyped business logic for cart, payments, content              |

**Estimated fix:** 1–2 hours (tsconfig cleanup + gradual JSX → TSX for critical paths).

---

## 5. Next.js Configuration

**File:** `next.config.ts`

### Good practices

- `output: "standalone"` — Docker/K8s friendly.
- **Security headers** via `getCspHeader()` — CSP, HSTS (prod), X-Frame-Options, etc.
- `images.remotePatterns` for Razorpay QR and external QR API.
- Turbopack root explicitly set.

### Problems

| Issue                                                           | Impact                                         |
| --------------------------------------------------------------- | ---------------------------------------------- |
| `allowedDevOrigins: ["192.168.29.173"]`                         | Hardcoded LAN IP — should be env-driven        |
| CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts    | Weakens XSS protection (Razorpay constraint)   |
| No `experimental` bundle analyzer or ISR config documented      | Performance tuning manual                      |
| Root `layout.jsx` sets `export const dynamic = "force-dynamic"` | **Entire app opts out of static optimization** |

---

## 6. Tailwind Configuration

**Setup:** Tailwind CSS v4 via `postcss.config.mjs` + `@import "tailwindcss"` in `app/globals.css`

### Good practices

- Design tokens in `:root` CSS variables (`--navy`, `--gold`, etc.).
- `@theme inline` maps tokens to Tailwind utilities.
- Tenant theming via `TenantThemeInjector` overrides CSS variables.
- Responsive utilities used throughout marketing and admin UIs.
- `min-h-dvh`, `touch-action`, safe-area considerations in globals.

### Problems

- **No `tailwind.config.js`** — v4 CSS-first is fine but team must know token changes live in `globals.css` + `lib/tokens.js` (duplicate token sources).
- **Admin UIs** use hardcoded hex (`#0f172a`, `#082F63`, `#C89B3C`) instead of shared Tailwind theme tokens — drift risk.
- **`lib/tokens.js` and `lib/layout.js`** parallel CSS variables — two sources of truth.

---

## 7. Prisma Configuration

**File:** `prisma/schema.prisma` (~3,200 lines, **~100 models**)

### Good practices

- PostgreSQL with comprehensive enums for domain states.
- Multi-tenant models (`Tenant`, `TenantBranding`, `TenantDomain`, etc.).
- Modular seed scripts per business domain.
- Soft-delete pattern on `User` (`deletedAt`).
- Indexes on common query paths (tenantId, status, etc.).

### Problems

| Issue                               | Severity | Detail                                                                                 |
| ----------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| **Monolithic schema**               | High     | 100 models in one file — slow to navigate, high merge conflict risk                    |
| **Single migration**                | High     | Only `20260626102505_initial_schema` — subsequent changes likely applied via `db push` |
| **Schema/migration drift**          | High     | Production may not match migration history                                             |
| **No Prisma middleware**            | Medium   | Tenant scoping enforced in app code, not DB layer                                      |
| **Windows `prisma generate` EPERM** | Medium   | DLL lock on `query_engine-windows.dll.node` — dev friction                             |

### Missing

- `prisma.config.ts` (Prisma 7 migration path).
- Schema splitting or multi-file schema (Prisma 6.7+ `prismaSchemaFolder` optional).
- Database integration tests with test DB.

**Estimated fix:** 2–3 days (migration baseline + schema modularization plan).

---

## 8. Environment Variables

**File:** `.env.example` (comprehensive, ~140 lines)

### Good practices

- Grouped by domain (DB, JWT, Razorpay, OpenAI, IoT, storage, security, tenant, integrations).
- Comments with provider URLs and generation hints (VAPID, etc.).
- `requireEnv()` helper in `lib/ops/env.ts` for critical vars.
- `isDatabaseConfigured()` graceful degradation when `DATABASE_URL` missing.

### Problems

| Issue                                                                    | Detail                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| **Stripe keys commented** but Stripe code exists                         | Easy to miss in deployment                        |
| **Sentry DSN** documented but no Sentry SDK wired                        | False sense of observability                      |
| **Many integration keys** optional with no runtime validation summary    | Failures at call-time, not startup                |
| **No `.env.test`** for CI test DB                                        | CI uses placeholder `DATABASE_URL` only for build |
| **Secrets in example** use placeholders — good, but no validation script |

### Missing env documentation

- No automated `scripts/check-env.ts` that validates required vars per `APP_ENV`.

---

## 9. Authentication Structure

### Architecture

| Layer         | Implementation                                                       |
| ------------- | -------------------------------------------------------------------- |
| Tokens        | Custom JWT via `jose` (`lib/auth/jwt.ts`)                            |
| Cookies       | `ssd_access` / refresh cookies (`lib/auth/cookies.ts`)               |
| Session       | DB-backed refresh sessions (`lib/security/session-manager.ts`)       |
| Middleware    | Cookie presence check for `/account`, `/admin`, `/m`                 |
| API auth      | `requireUser()`, `requirePermission()`, `requireAnyPermission()`     |
| Authorization | RBAC (`lib/security/permissions.ts`) + ABAC (`lib/security/abac.ts`) |
| 2FA           | TOTP setup/disable routes                                            |
| OAuth         | Google route (Phase 2 — env commented)                               |
| OTP           | Phone/email OTP request/verify                                       |
| Farm API      | Separate `farm-session.ts` + API keys                                |

### Good practices

- **Permission-granular** RBAC with 8 roles and 60+ permissions.
- **ABAC** layer for resource-owner checks.
- Brute-force protection, account lockout, bot detection, geo/IP filtering modules exist.
- Separate public API key auth (`lib/api/auth.ts`, scopes).

### Problems

| Issue                                        | Severity                                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **`next-auth` installed but unused**         | Medium — confusion for new devs                                                                           |
| **Middleware only checks cookie existence**  | High — no JWT validation at edge; expired token still passes middleware until API call                    |
| **API routes not middleware-protected**      | By design, but `/api/v1/*` relies entirely on per-route `requirePermission` — any missed route is exposed |
| **No CSRF token** for cookie-based mutations | Medium — mitigated partially by SameSite cookies                                                          |
| **Dual auth patterns**                       | Farm JWT vs user JWT vs API keys — documented but complex                                                 |

---

## 10. API Routes

**Count:** ~175 route handlers (`app/api/**/route.{ts,js}`)

### Structure

| Prefix                                                 | Purpose                                    |
| ------------------------------------------------------ | ------------------------------------------ |
| `/api/v1/auth/*`                                       | Login, register, OTP, 2FA, sessions, OAuth |
| `/api/v1/account/*`, `/cart/*`, `/subscriptions/*`     | E-commerce                                 |
| `/api/v1/tenant/*`                                     | Multi-tenant config, billing               |
| `/api/v1/{crm,fleet,processing,retail,ai,saas,...}/*`  | ERP modules                                |
| `/api/v1/{iot,mqtt,gateway,weather,cctv,vision,...}/*` | Farm platform                              |
| `/api/v1/mobile/*`                                     | PWA mobile                                 |
| `/api/public/v1/*`                                     | Developer public API                       |
| `/api/graphql`                                         | GraphQL endpoint                           |
| `/api/payment/*`, `/api/products`, etc.                | **Legacy JS routes (10 files)**            |

### Good practices

- Versioned `/api/v1/` namespace.
- `export const dynamic = "force-dynamic"` on API routes — appropriate for authenticated APIs.
- OpenAPI spec at `/api/public/openapi.json`.
- Rate limiting infrastructure (`lib/ops/rate-limit.ts`, `lib/security/gate.ts`).
- Webhook retry worker for integrations.

### Problems

| Issue                                     | Detail                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **10 legacy `.js` API routes**            | `payment/*`, `products`, `content`, `chat`, `contact`, `newsletter` — no Zod validation, inconsistent error shapes |
| **Duplicate health endpoints**            | `app/api/health/route.ts` appears in multiple path forms                                                           |
| **GraphQL without visible test coverage** | Risk surface                                                                                                       |
| **~165 API routes vs 115 unit tests**     | Most routes untested                                                                                               |
| **Inconsistent handler wrapper**          | Some use `lib/ops/api-handler.ts`, others inline                                                                   |

---

## 11. Database

### Provider

PostgreSQL (Neon in production per deployment docs).

### Data sources (dual)

| Source              | Used for                                                           |
| ------------------- | ------------------------------------------------------------------ |
| `data/content.json` | Marketing site products, categories, testimonials (file-based CMS) |
| PostgreSQL + Prisma | Users, orders, subscriptions, all ERP modules                      |

### Good practices

- Prisma singleton with dev hot-reload guard.
- Tenant isolation via `tenantFarmId()` and `resolveTenantFromRequest()`.
- Usage metering (`UsageRecord`, `TenantDailyAnalytics`).
- GDPR retention config (`GDPR_RETENTION_DAYS`).

### Problems

| Issue                                                    | Detail                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Products in JSON + orders in DB**                      | Product IDs must stay in sync manually                                               |
| **`getContent()` reads filesystem**                      | Not compatible with serverless multi-instance content updates without shared storage |
| **100 models, 1 migration**                              | Operational risk on fresh deploys                                                    |
| **No read replicas / connection pooling config** in code | Neon pooler URL used but not documented in audit scope                               |

---

## 12. React Components

**~61 component files** — predominantly `.jsx` (untyped).

### Organization

- **Marketing:** `Hero`, `Navbar`, `Footer`, `Products`, `Testimonials`, etc. (flat root).
- **UI primitives:** `components/ui/` — `CartDrawer`, `ProductCard`, `LazyImage`, `PaymentCheckoutModal`, etc.
- **Domain:** `subscription/`, `mobile/`, `tenant/`, `account/`.
- **Providers:** `QueryProvider`, `TenantProvider`, `CartProvider` (via context).

### Good practices

- `LazyImage` wrapper around `next/image` with shimmer placeholder.
- `LazySection` for below-fold performance.
- Framer Motion animations isolated in `MotionReveal`.
- PWA components (`ServiceWorkerRegister`, `OfflineBanner`).

### Problems

| Issue                                        | Detail                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| **Brand drift: "Anmasa"**                    | `AnmasaHero`, `WhyAnmasa`, references in `HomePage.jsx` — legacy brand name |
| **Untyped JSX**                              | No prop validation on most marketing components                             |
| **Root layout loads all providers globally** | Chat, cart, page loader on every route including admin                      |
| **No component library / Storybook**         | Hard to document reusable UI                                                |

---

## 13. Reusable Components

### Strong reusables (`components/ui/`)

- `LazyImage`, `LazySection`, `ProductCard`, `CartDrawer`, `PaymentCheckoutModal`
- `SectionHeading`, `MotionReveal`, `BrandLogo`, `OrderButton`
- `SectionSkeletons` for loading states

### Gaps

- No shared `Button`, `Input`, `Modal`, `Table`, `Badge` primitives — admin pages inline Tailwind.
- Admin stat cards duplicated across `/admin/ai`, `/admin/saas`, etc.
- No shared `AdminShell` layout component — 12 near-identical admin layouts.

---

## 14. Services

### Two organizational patterns (inconsistency)

| Pattern             | Location                                                 | Examples              |
| ------------------- | -------------------------------------------------------- | --------------------- |
| **Legacy services** | `lib/services/farm/*.service.ts`, `lib/services/mobile/` | IoT, AI, voice, agent |
| **Domain modules**  | `lib/{crm,fleet,retail,saas,...}/service.ts`             | Newer ERP modules     |

### Good practices

- Service layer separates Prisma from API routes.
- Integration providers pluggable (`lib/integrations/providers/*`).
- Notification engine with channels, rules, scheduler, dispatcher.
- Workflow engine with triggers, conditions, audit trail.

### Problems

- **AI exists in two places:** `lib/services/farm/ai.service.ts` AND `lib/ai-platform/service.ts`.
- **Farm routes at `/api/v1/ai` AND `/admin/farm/ai`** — naming collision for developers.
- Some services exceed 500 lines — candidate for splitting.

---

## 15. Hooks

| Hook          | Location               | Purpose             |
| ------------- | ---------------------- | ------------------- |
| `useCartSync` | `hooks/useCartSync.js` | Sync cart to server |

### Assessment

**Severely underdeveloped hooks layer.** Most stateful logic lives in:

- React Context (`context/CartContext`, `SiteDataContext`, `SectionScrollContext`)
- Zustand (`store/useCartStore.js`)
- TanStack Query inline in admin pages

### Missing

- `useAuth`, `useTenant`, `usePermission`, `useMediaQuery`, `useDebounce` as shared hooks.
- No `hooks/` index or conventions doc.

---

## 16. Utilities

### TypeScript utilities (scattered)

- `lib/ops/*` — logger, redis, queue, rate-limit, storage, metrics
- `lib/security/*` — encryption, audit, GDPR, geo, IP filter
- `lib/validators/*` — Zod schemas
- `lib/api/*` — versioning, scopes, openapi

### Legacy JavaScript utilities

- `lib/utils.js`, `lib/routes.js`, `lib/data.js`, `lib/cart.js`
- `lib/razorpay*.js`, `lib/paymentMethods.js`, `lib/chatAssistant.js`
- `lib/tokens.js`, `lib/layout.js`, `lib/site.js`

### Problems

- **Duplicate route helpers:** `lib/routes.js` vs patterns in `lib/tenant/`.
- **`sanitizeSearchInput` in security** — regex blacklist approach; Prisma parameterized queries are the real defense (document as defense-in-depth only).

---

## 17. Middleware

**File:** `middleware.ts` (root)

### Responsibilities

1. Tenant subdomain detection → `x-tenant-slug` header + cookie
2. Auth redirect for `/account`, `/admin`, `/m` without `ssd_access` cookie
3. Redirect authenticated users away from `/login`, `/signup`

### Good practices

- Tenant resolution at edge without DB call (`resolveTenantFromHost` is sync).
- Matcher excludes static assets.

### Problems

| Issue                                 | Severity                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| **No JWT validation at middleware**   | Medium — stale/expired cookies still access protected pages    |
| **No role-based route guards**        | `/admin/*` only checks login, not `admin:*` permissions        |
| **API routes pass through**           | Correct for webhooks, but increases reliance on per-route auth |
| **No rate limiting at edge**          | Rate limit only in select API handlers                         |
| **Matcher runs on almost all routes** | Including public marketing — minor overhead                    |

---

## 18. Images

### Assets (`public/`)

- `public/images/` — hero, banners, product photos, farm imagery
- `public/icons/` — feature and payment method icons
- `public/logos/` — header/footer logos

### Good practices

- `next/image` via `LazyImage` component with lazy loading and shimmer.
- `sharp` dependency for image optimization.
- Remote patterns configured for payment QR images.

### Problems

| Issue                                                                        | Detail                                              |
| ---------------------------------------------------------------------------- | --------------------------------------------------- |
| **Many components use raw `<img>`**                                          | `Hero`, `CTA`, `About`, etc. — bypass optimization  |
| **PWA manifest icon** uses `/images/our-farm-banner.png` (likely not square) | Maskable icon guidelines violated                   |
| **No `sizes` prop audit**                                                    | Possible over-fetching on responsive images         |
| **No CDN config** for static assets in `next.config`                         | R2/S3 env vars exist but marketing images are local |

---

## 19. Assets

- PWA: `manifest.json`, `sw.js` in `public/`
- Default Next/Vercel SVGs still present (`vercel.svg`, `window.svg`, `file.svg`) — may be unused
- `data/*.json` — runtime content assets (orders, subscribers, inquiries) alongside `content.json`

### Problems

- **Service worker strategy** not audited for cache invalidation on deploy.
- **No asset pipeline** (no `assets/` build step for sprites/icons).

---

## 20. Performance

### Good practices

- Font `display: "swap"` on all Google fonts.
- `LazySection` + intersection-based mounting for homepage sections.
- Redis caching infrastructure available.
- Standalone Docker output for lean containers.
- BullMQ for async notification/integration work.

### Problems

| Issue                                   | Impact                                                            |
| --------------------------------------- | ----------------------------------------------------------------- |
| **`force-dynamic` on root layout**      | **Critical** — homepage cannot be statically generated or ISR'd   |
| **`force-dynamic` on `app/page.jsx`**   | Marketing page always server-rendered                             |
| **Five Google font families loaded**    | ~heavy LCP — Playfair, Poppins, Marcellus, Cormorant, Great Vibes |
| **Global providers on all routes**      | Cart, chat, page loader, scroll unlock on admin/API pages         |
| **No `loading.jsx` boundaries**         | Full page wait on slow server components                          |
| **Prisma on every tenant config fetch** | `getServerTenantConfig()` on each request                         |
| **No bundle analysis in CI**            | Regressions undetected                                            |

### Viewport concern

`maximumScale: 1, userScalable: false` in root viewport — **hurts accessibility** (pinch-zoom disabled).

---

## 21. Security

### Strengths

- CSP, HSTS, X-Frame-Options, nosniff headers.
- bcryptjs password hashing.
- JWT access + refresh rotation.
- 2FA (TOTP), OTP, session revocation.
- RBAC + ABAC permission system.
- Audit logging module.
- Encryption service for sensitive fields.
- Bot detection, brute-force, account lockout.
- GDPR export/consent routes.
- `METRICS_TOKEN` for metrics endpoint.
- `CRON_SECRET` for cron routes.

### Weaknesses

| Issue                                          | Severity                                           |
| ---------------------------------------------- | -------------------------------------------------- |
| Middleware auth is cookie-presence only        | Medium                                             |
| CSP `unsafe-inline` / `unsafe-eval`            | Medium                                             |
| `next-auth` unused — potential confusion       | Low                                                |
| Sentry not actually integrated                 | Medium                                             |
| `npm audit` in CI is `continue-on-error: true` | Medium                                             |
| No security.txt or disclosed bug bounty        | Low                                                |
| GraphQL endpoint attack surface                | Medium — needs query depth/complexity limits audit |
| **Admin routes lack middleware role check**    | Medium                                             |

---

## 22. SEO

### Implemented

- `generateMetadata()` in root layout — title, description, keywords, OpenGraph basics.
- `lang` attribute from tenant locale.
- Semantic HTML in marketing components.
- `generateStaticParams` on `category/[slug]` and account slug pages.

### Missing / weak

| Gap                                | Impact                                                   |
| ---------------------------------- | -------------------------------------------------------- |
| **No `robots.ts` or `sitemap.ts`** | Search engines lack guided crawling                      |
| **No Open Graph images**           | Poor social sharing previews                             |
| **No Twitter card metadata**       |                                                          |
| **No JSON-LD structured data**     | Missing Product/Organization schema for dairy e-commerce |
| **`force-dynamic` homepage**       | Slower TTFB vs static                                    |
| **No canonical URLs**              | Duplicate content risk with tenant subdomains            |
| **Category pages force-dynamic**   | Undermines `generateStaticParams` benefit                |

---

## 23. Accessibility

### Positive signals

- ~70+ `aria-*` / `role=` usages across components (Navbar, ChatAssistant, CartDrawer, Testimonials, etc.).
- `alt` attributes on many images.
- `LazyImage` uses `aria-hidden` on shimmer.
- Form components in subscription flow.

### Issues

| Issue                                                                | WCAG impact                  |
| -------------------------------------------------------------------- | ---------------------------- |
| `userScalable: false`                                                | Fails 1.4.4 Resize Text      |
| Chat widget, cart drawer focus trap                                  | Unknown — needs manual audit |
| Admin dashboards are button-tab navigation without ARIA tabs pattern | 4.1.2                        |
| Color contrast on `text-white/50` admin UI                           | Possible 1.4.3 failures      |
| No skip-to-content link                                              | 2.4.1                        |
| No documented a11y testing                                           |                              |

---

## 24. Responsive Design

### Good practices

- Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`) used throughout.
- Mobile PWA at `/m/*` with dedicated layout.
- `min-h-dvh`, `viewportFit: cover` for notched devices.
- `overflow-x: clip` prevents horizontal scroll.
- Separate mobile nav (`MobileNav`).

### Issues

- Admin tables/lists may overflow on small screens — not uniformly tested.
- Hardcoded `max-w-6xl` admin containers — acceptable but no mobile-specific admin UX.
- Pinch-zoom disabled hurts mobile accessibility.

---

## 25. Code Duplication

### High duplication areas

| Area                             | Instances                                                                                | Recommendation                           |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Admin layout shells**          | 12 layouts with identical `min-h-screen bg-[#0f172a]` header pattern                     | Extract `AdminShell` component           |
| **Admin stat cards**             | Duplicated in AI, SaaS, CRM, etc.                                                        | Shared `StatCard` in `components/admin/` |
| **Farm services vs ai-platform** | Overlapping AI/voice/agent logic                                                         | Consolidate behind `ai-platform` facade  |
| **Payment logic**                | `lib/razorpay*.js` + `lib/billing/` + `app/api/payment/*.js`                             | Single payment module                    |
| **Design tokens**                | `globals.css`, `lib/tokens.js`, `lib/layout.js`                                          | Single token source                      |
| **Health check routes**          | Multiple paths                                                                           | One canonical endpoint                   |
| **Footer/Navbar duplicates**     | `components/Footer.jsx` and `components\Footer.jsx` (same file, path separator artifact) | Verify no actual duplicate files         |

### Legacy / modern overlap

- **10 JS API routes** duplicate patterns now in `/api/v1/`.
- **153 TS + 17 JS files in `lib/`** — parallel implementations.

---

## Missing Files (Recommended)

| File                              | Purpose                                |
| --------------------------------- | -------------------------------------- |
| `app/not-found.jsx`               | Global 404 page                        |
| `app/error.jsx`                   | Global error boundary                  |
| `app/loading.jsx`                 | Root loading state                     |
| `app/robots.ts`                   | SEO crawling rules                     |
| `app/sitemap.ts`                  | Dynamic sitemap                        |
| `app/admin/layout.jsx`            | Shared admin chrome                    |
| `components/admin/AdminShell.jsx` | DRY admin layouts                      |
| `scripts/check-env.ts`            | Startup env validation                 |
| `.prettierrc`                     | Formatting consistency                 |
| `playwright.config.ts`            | E2E tests                              |
| `prisma/migrations/*`             | Incremental migrations matching schema |

---

## Wrong Structure (Architectural Smells)

1. **Monolith schema** should be split by bounded context (ecommerce, farm, tenant, platform).
2. **File-based CMS (`data/content.json`)** inside a DB-backed ERP — should migrate to DB or headless CMS.
3. **Unused `next-auth`** implies abandoned auth approach — remove or document decision.
4. **Sentry env without SDK** — misleading ops setup.
5. **CI npm audit non-blocking** — security regressions ship silently.
6. **Brand components named Anmasa** in Shree Shyam project — technical debt from template fork.

---

## Improvement Suggestions

### Quick wins (1–2 days)

1. Remove unused `next-auth` and `bcrypt` packages.
2. Fix `tsconfig.json` include paths.
3. Add `app/not-found.jsx` and `app/error.jsx`.
4. Add `robots.ts` and `sitemap.ts`.
5. Rename `AnmasaHero` → `BrandHero`, `WhyAnmasa` → `WhyUs` (internal only — no UI change if copy stays).
6. Make `allowedDevOrigins` env-driven.
7. Add `test:coverage` script.

### Medium term (1–2 weeks)

1. Migrate 10 legacy JS API routes to `/api/v1/` with Zod validation.
2. Create shared `AdminShell` — refactor 12 admin layouts.
3. Remove `force-dynamic` from marketing layout/page; use static/ISR where possible.
4. Baseline Prisma migrations from current schema; ban `db push` in production.
5. Wire `@sentry/nextjs` or remove Sentry env vars.
6. Add Playwright smoke tests for login, checkout, admin access.
7. Consolidate design tokens into `lib/tokens.ts` + CSS import.

### Long term (1–2 months)

1. Split Prisma schema by domain with shared `User`/`Tenant` core.
2. Migrate `content.json` products to database.
3. TypeScript migration for `components/` and legacy `lib/*.js`.
4. GraphQL security audit + complexity limits.
5. Expand unit tests to cover all payment and auth API routes.
6. Implement edge JWT verification in middleware for protected routes.
7. Add Storybook for `components/ui/`.

---

## Priority List

| Priority | Item                                                      | Effort    | Impact                     |
| -------- | --------------------------------------------------------- | --------- | -------------------------- |
| **P0**   | Prisma migration baseline — schema matches deploy history | 2–3 days  | Prevents prod DB incidents |
| **P0**   | Audit all API routes for missing `requirePermission`      | 1–2 days  | Security                   |
| **P1**   | Remove `force-dynamic` from public marketing routes       | 0.5 day   | Performance + SEO          |
| **P1**   | Migrate legacy `/api/payment/*` + `/api/products` to v1   | 3–5 days  | Security + maintainability |
| **P1**   | Shared `AdminShell` component                             | 1 day     | DRY, faster feature work   |
| **P1**   | Add `robots.ts`, `sitemap.ts`, OG images                  | 1 day     | SEO                        |
| **P1**   | Enable `userScalable` / remove zoom block                 | 0.5 hour  | Accessibility              |
| **P2**   | Remove unused deps (`next-auth`, `bcrypt`)                | 1 hour    | Bundle + clarity           |
| **P2**   | Integrate Sentry SDK or remove env vars                   | 0.5 day   | Observability              |
| **P2**   | Consolidate AI services (farm vs ai-platform)             | 2–3 days  | Maintainability            |
| **P2**   | Playwright E2E for checkout + auth                        | 3–5 days  | Regression safety          |
| **P2**   | Middleware JWT validation + admin role check              | 2 days    | Security                   |
| **P3**   | Prisma schema split                                       | 1–2 weeks | Dev velocity               |
| **P3**   | Components JSX → TSX migration                            | 2–3 weeks | Type safety                |
| **P3**   | content.json → DB migration                               | 1 week    | Single source of truth     |
| **P3**   | Storybook + shared admin UI kit                           | 1–2 weeks | UX consistency             |

---

## Estimated Fix Time Summary

| Scope                      | Duration   | Team                                       |
| -------------------------- | ---------- | ------------------------------------------ |
| P0 items                   | 3–5 days   | 1 senior engineer                          |
| P0 + P1 items              | 2–3 weeks  | 1 senior engineer                          |
| Full consolidation (P0–P3) | 2–3 months | 1–2 engineers part-time alongside features |

---

## Test Coverage Snapshot

| Metric             | Value          |
| ------------------ | -------------- |
| Test files         | 15             |
| Test cases         | 115            |
| API route handlers | ~175           |
| Prisma models      | ~100           |
| E2E tests          | 0              |
| Coverage script    | Not configured |

Tests focus on **permissions, types, pure functions, and constants** — not HTTP integration or DB transactions. Adequate for CI smoke; **insufficient for ERP regression confidence**.

---

## CI/CD Snapshot

**`.github/workflows/ci.yml`**

- Lint → Prisma generate → Typecheck → Vitest → Build
- Docker build on push
- `npm audit --audit-level=high` with `continue-on-error: true`

**Good:** Concurrency groups, Node 20, build env placeholders for JWT/DB.  
**Gap:** No deploy workflow audit in this report; no E2E; audit non-blocking.

---

## Documentation Assessment

**Exceptionally strong** for a project this size:

- Architecture docs, ADRs, ER diagrams, per-module admin guides, API reference, farm guides, testing guide, release notes.

**Gap:** Docs reference some paths that duplicate (`docs/architecture.md` vs `docs/architecture/`). No single "onboarding for new developers" under 30 minutes.

---

## Conclusion

Shree Shyam Dairy Farm is a **feature-rich, well-documented production platform** with clear evidence of disciplined module-by-module expansion. The core architectural challenge is **consolidation**: merging legacy e-commerce JS with the modern TypeScript ERP stack, tightening migration discipline, and improving performance on public routes without rewriting the application.

The recommended path is **surgical improvement** aligned with the priority list above — not a greenfield rebuild.

---

_End of audit report. No application source files were modified. This document was generated as the sole deliverable._
