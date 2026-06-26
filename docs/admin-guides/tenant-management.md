# Tenant Management

Admin guide for multi-tenant branding, domains, billing, and analytics.

**Access:** `/admin/tenant` — requires ADMIN or OWNER role.

## Overview

Each tenant is a white-label instance of the ERP with isolated farm data (`tenant.slug` → `farmId`).

Default tenant: `default` (`DEFAULT_TENANT_SLUG`)

## Branding

`/admin/tenant` → Branding tab

- Company name, tagline
- Logo and favicon URLs
- API: `PUT /api/v1/tenant/admin/branding`

## Theme

Customize CSS variables (primary color, font, border radius):

- API: `PUT /api/v1/tenant/admin/theme`
- Injected client-side via `TenantThemeInjector`

## Custom domains

1. Add domain in admin → Domains
2. Add DNS TXT record with verification token
3. Point domain CNAME to your app host
4. Cloudflare proxy recommended for SSL

API: `POST /api/v1/tenant/admin/domains`

## Billing plans

| Plan       | Price (INR/mo) | API Calls | Orders    |
| ---------- | -------------- | --------- | --------- |
| Starter    | Free           | 10,000    | 500       |
| Growth     | ₹4,999         | 100,000   | 5,000     |
| Enterprise | ₹19,999        | Unlimited | Unlimited |

- Stripe: `POST /api/v1/tenant/billing/stripe/checkout`
- Razorpay: `POST /api/v1/tenant/billing/razorpay/subscribe`

Configure `STRIPE_*` and Razorpay keys in environment.

## Usage & analytics

- **Usage:** `GET /api/v1/tenant/admin/usage` — API calls, orders per month
- **Analytics:** `GET /api/v1/tenant/admin/analytics` — daily aggregates

## Tenant resolution

1. `X-Tenant-Slug` header
2. Subdomain: `{slug}.yourdomain.com`
3. Verified custom domain
4. Fallback: `default`

## Seed default tenant

```bash
npm run db:seed-tenant
```

## Related

- [ER diagram: Tenant](../er-diagrams/tenant.md)
- [ADR-002](../adr/002-tenant-farmid-isolation.md)
