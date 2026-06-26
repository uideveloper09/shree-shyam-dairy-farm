# Frontend Architecture

Next.js 16 App Router with React 19, Tailwind CSS v4, and role-based surfaces for storefront, admin, mobile PWA, and developer portal.

## Stack

| Technology            | Version | Purpose                           |
| --------------------- | ------- | --------------------------------- |
| Next.js               | 16.2    | App Router, SSR, API routes       |
| React                 | 19      | UI components                     |
| Tailwind CSS          | v4      | Styling, design tokens            |
| TanStack Query        | —       | Server state, caching             |
| Framer Motion         | —       | Page transitions (`MotionReveal`) |
| React Hook Form + Zod | —       | Form validation                   |

## Directory Layout

```
app/
├── page.jsx              # Storefront home
├── account/              # Customer account
├── admin/
│   ├── farm/             # Farm ERP dashboard
│   ├── security/         # Security dashboard
│   └── tenant/           # Tenant admin
├── m/                    # Mobile PWA (role apps)
├── developers/           # Developer portal
└── api/                  # API routes (see backend.md)

components/
├── ui/                   # Shared UI primitives
├── tenant/               # TenantProvider, theme injection
└── ...                   # Feature components

lib/
├── tokens.js             # Design tokens
├── layout.js             # Layout helpers
└── site.js               # Site metadata
```

## Surfaces

| Surface        | Route prefix      | Auth                |
| -------------- | ----------------- | ------------------- |
| Storefront     | `/`               | Optional            |
| Account        | `/account/*`      | Customer JWT        |
| Farm admin     | `/admin/farm/*`   | FARM_MANAGER+       |
| Security admin | `/admin/security` | ADMIN, OWNER        |
| Tenant admin   | `/admin/tenant`   | ADMIN, OWNER        |
| Mobile PWA     | `/m/*`            | Role-based redirect |
| Developers     | `/developers/*`   | Session + API keys  |

## Multi-Tenant Theming

1. `middleware.ts` resolves tenant from subdomain, custom domain, or `X-Tenant-Slug`
2. `TenantProvider` loads config from `/api/v1/tenant/config`
3. `TenantThemeInjector` injects CSS variables (colors, fonts, radius)
4. Branding: logo, favicon, company name from `TenantBranding`

See [admin-guides/tenant-management.md](../admin-guides/tenant-management.md).

## Mobile PWA

| Asset          | Path                                                 |
| -------------- | ---------------------------------------------------- |
| Manifest       | `public/manifest.json`                               |
| Service worker | `public/sw.js`                                       |
| Role apps      | `app/m/customer`, `delivery`, `farm`, `vet`, `owner` |

Features: offline sync, push notifications, GPS, camera, barcode scan, WebAuthn biometric login.

See [user-guides/mobile-app.md](../user-guides/mobile-app.md).

## Middleware

`middleware.ts` handles:

- Protected route gating (`/account`, `/admin`, `/m`, `/developers`)
- Tenant slug cookie + `x-tenant-slug` header
- Custom domain → tenant resolution

## Rendering Strategy

| Pattern                     | Usage                                |
| --------------------------- | ------------------------------------ |
| Server Components           | Default for pages, data fetching     |
| Client Components           | Interactivity, forms, motion         |
| `dynamic = "force-dynamic"` | Health, metrics, auth-sensitive APIs |

## Related

- [Backend](./backend.md) — API consumed by frontend
- [Security](./security.md) — Auth cookies and RBAC
- [Deployment](./deployment.md) — Vercel / Docker builds
