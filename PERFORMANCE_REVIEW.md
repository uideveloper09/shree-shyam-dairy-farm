# Performance Review — `force-dynamic` on Pages

**Date:** 2025-06-25  
**Scope:** UI routes only (`page.jsx` / `layout.jsx` under `src/app/`)  
**API routes:** Reviewed for context; **not modified** per instruction

---

## Executive summary

| Metric                                      | Count   |
| ------------------------------------------- | ------- |
| Page files in app                           | 46      |
| Layout files in app                         | 17      |
| UI files with `force-dynamic` (before)      | **3**   |
| UI files with `force-dynamic` (after)       | **0**   |
| Removed (safe)                              | **3**   |
| Kept on pages                               | **0**   |
| API routes with `force-dynamic` (unchanged) | **173** |

All three UI `force-dynamic` exports were **redundant**. They were removed without changing rendering behavior or business logic. Production build verified (`npm run build` exit 0).

---

## What `force-dynamic` does

`export const dynamic = "force-dynamic"` opts a route segment out of static generation and forces per-request rendering (no static cache at build time).

Next.js also auto-opts into dynamic rendering when a segment uses:

- `headers()`, `cookies()`, `searchParams` (unstable)
- `fetch(..., { cache: 'no-store' })`
- Other explicit dynamic config

Explicit `force-dynamic` is only needed when you want to **guarantee** dynamic behavior beyond what the framework infers, or when static optimization might otherwise apply incorrectly.

---

## UI routes reviewed

### Files that had `force-dynamic` — **removed**

#### 1. `src/app/layout.jsx` — **REMOVED**

|                     |                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Data sources**    | `getContent()` (JSON on disk), `getServerTenantConfig()`                                                                 |
| **Dynamic trigger** | `getServerTenantConfig()` → `headers()` → host / `x-tenant-slug` → tenant theme & locale                                 |
| **Verdict**         | `force-dynamic` was **redundant**. `headers()` already forces dynamic rendering for the root layout and all descendants. |
| **After removal**   | Still **dynamic (ƒ)** at runtime. Tenant-specific branding per request unchanged.                                        |

#### 2. `src/app/page.jsx` — **REMOVED**

|                   |                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Server work**   | None — delegates to client `HomePage`                                                                            |
| **Data**          | `SiteDataProvider` in root layout                                                                                |
| **Verdict**       | **Fully redundant**. No server fetch, no dynamic APIs in this file. Inherited dynamic behavior from root layout. |
| **After removal** | No behavior change.                                                                                              |

#### 3. `src/app/category/[slug]/page.jsx` — **REMOVED**

|                   |                                                                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server work**   | `getCategoryBySlug()`, `getContent()` — reads `data/content.json` via `fs`                                                                                                                                  |
| **Static hints**  | `generateStaticParams()` + `generateMetadata()` already present                                                                                                                                             |
| **Verdict**       | `force-dynamic` **contradicted** `generateStaticParams` and added no value while root layout is dynamic via `headers()`. Safe to remove; does not change current runtime (still dynamic under root layout). |
| **After removal** | Aligns page config with static-generation intent. Enables future static/ISR for category routes if tenant resolution is moved out of the root layout.                                                       |

---

### Other pages (43) — **no `force-dynamic` present**

Representative patterns:

| Pattern           | Examples                                                  | Dynamic without `force-dynamic`?         |
| ----------------- | --------------------------------------------------------- | ---------------------------------------- |
| Client-only UI    | `admin/farm/page.jsx`, `m/customer/page.jsx`              | Inherited from root layout (`headers()`) |
| Auth / session    | `account/page.jsx` (`getCurrentUser()`), `login/page.jsx` | Yes — cookies/session APIs               |
| Redirect only     | `admin/page.jsx`                                          | Inherited from root layout               |
| Client dashboards | Most `/admin/*`, `/m/*`, `/developers/*`                  | Inherited from root layout               |

**Conclusion:** No additional page-level `force-dynamic` exports were found. Nothing else required removal.

---

### Layouts (16 nested + root) — **none had `force-dynamic` except root**

Nested layouts (`account/layout.jsx`, `admin/farm/layout.jsx`, etc.) rely on root layout dynamic behavior or client wrappers. No changes made.

---

## API routes — reviewed, not changed

**173** route handlers under `src/app/api/` export `force-dynamic`.

These were **not modified** (per “Do not change APIs”). Summary by category:

| Category                               | Why `force-dynamic` is appropriate                        |
| -------------------------------------- | --------------------------------------------------------- |
| Auth (`/api/v1/auth/*`)                | Sessions, cookies, tokens — must not be statically cached |
| Payments (`/api/payment/*`)            | Live Razorpay orders, QR status, verification             |
| Webhooks & cron                        | External payloads, idempotency, no cache                  |
| Health / metrics                       | Real-time dependency checks                               |
| ERP modules (CRM, fleet, retail, etc.) | Authenticated, DB-backed, user-specific                   |
| Public API (`/api/public/v1/*`)        | API-key auth, live product/order data                     |
| Mobile / IoT / voice                   | Device state, streaming, real-time                        |

Removing `force-dynamic` from API routes would require per-route analysis of `fetch` cache, `revalidate`, and auth boundaries. That is a separate API performance pass.

---

## Changes made

```diff
- export const dynamic = "force-dynamic";
```

Removed from:

1. `src/app/layout.jsx`
2. `src/app/page.jsx`
3. `src/app/category/[slug]/page.jsx`

---

## Verification

| Check                        | Result           |
| ---------------------------- | ---------------- |
| `npm run build`              | ✅ Pass (exit 0) |
| UI `force-dynamic` remaining | 0 files          |
| API `force-dynamic` touched  | 0 files          |

---

## Current rendering model (UI)

```
Root layout
  └─ headers() via getServerTenantConfig()
       └─ Dynamic (ƒ) for entire app tree
            ├─ / (HomePage client component)
            ├─ /category/[slug] (JSON data, but parent dynamic)
            ├─ /account/* (cookies via getCurrentUser where used)
            └─ /admin/*, /m/* (client dashboards)
```

All public and authenticated pages remain **request-time rendered** because tenant resolution uses `headers()` in the root layout.

---

## Future optimization opportunities (not in scope)

1. **Split root layout** — Move tenant theme injection to a client boundary or middleware header pass so marketing pages (`/`, `/category/*`) can use static generation from `data/content.json`.
2. **Category ISR** — After (1), add `export const revalidate = 3600` on category pages for hourly product cache.
3. **API audit** — Review whether any read-only public endpoints (e.g. `GET /api/products` with stable JSON) can drop `force-dynamic` in favor of `revalidate` or edge caching. Requires API change process.

---

## References

- Root tenant resolution: `src/lib/tenant/server.ts` (`headers()`)
- Content loading: `src/utils/data.js` (`getContent`, `getCategoryBySlug`)
- Build validation: `BUILD_VALIDATION.md`
