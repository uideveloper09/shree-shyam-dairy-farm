# SaaS Global Platform Admin Guide

Multi-tenant white-label platform with marketplace, billing, partner portals, and regional commerce settings.

## Modules

| Module              | Description                     | API                                          |
| ------------------- | ------------------------------- | -------------------------------------------- |
| **Multi Tenant**    | Active tenants, plans, members  | `GET /api/v1/saas/tenants`                   |
| **White Label**     | Branding, theme, custom domains | `GET /api/v1/saas/tenants?id={tenantId}`     |
| **Marketplace**     | Browse and install listings     | `GET /api/v1/saas/marketplace`               |
| **App Store**       | APP and PLUGIN listings         | `?type=APP` or `?type=PLUGIN`                |
| **API Marketplace** | Developer API products          | `?type=API`                                  |
| **Billing**         | Plan, subscription, usage       | `GET /api/v1/saas/billing`                   |
| **Subscriptions**   | Plan limits (via billing)       | Same as billing                              |
| **Partner Portal**  | Channel partners                | `GET /api/v1/saas/partners?type=PARTNER`     |
| **Reseller Portal** | Reseller network                | `?type=RESELLER`                             |
| **Multi Language**  | Locales per tenant              | `GET /api/v1/saas/regional`                  |
| **Multi Currency**  | Enabled currencies              | Regional settings                            |
| **Multi Country**   | Enabled countries               | Regional settings                            |
| **Global Tax**      | Country tax rules               | `GET /api/v1/saas/regional?section=tax`      |
| **Global Shipping** | Zone-based rates                | `GET /api/v1/saas/regional?section=shipping` |

## Install Marketplace App

```json
POST /api/v1/saas/marketplace
{ "listingId": "clx..." }
```

## Regional Settings

```json
POST /api/v1/saas/regional
{
  "section": "regional",
  "defaultCurrency": "INR",
  "enabledLocales": ["en", "hi", "ar"]
}
```

## Seed Tax Rules

```json
POST /api/v1/saas/regional
{ "action": "seed-tax" }
```

Populates GST, VAT, and sales tax templates from `GLOBAL_TAX_TEMPLATES`.

## Create Partner

```json
POST /api/v1/saas/partners
{
  "type": "PARTNER",
  "name": "DairyTech India",
  "slug": "dairy-tech-india",
  "commissionRate": 15
}
```

Link partner to tenant:

```json
POST /api/v1/saas/partners
{ "action": "link", "partnerId": "...", "tenantId": "...", "commissionRate": 15 }
```

## Permissions

| Permission         | Roles                                  |
| ------------------ | -------------------------------------- |
| `admin:saas:read`  | FARM_MANAGER, ADMIN, OWNER             |
| `admin:saas:write` | FARM_MANAGER, ADMIN, OWNER             |
| `saas:read`        | FARM_MANAGER, ACCOUNTANT, ADMIN, OWNER |
| `saas:write`       | FARM_MANAGER, ADMIN, OWNER             |

## Admin UI

`/admin/saas` — tabbed dashboard for all 14 modules.

Complements `/admin/tenant` for Razorpay/Stripe billing and domain verification.

## Seed Data

```bash
npm run db:seed-saas
```

Creates marketplace listings, sample partner/reseller, regional settings, tax rules, and shipping zones for the default tenant.

## Shipping Calculation

`calculateShipping(zones, countryCode, orderTotal, weightKg)` in `lib/saas/service.ts` returns base + per-kg rate, or `0` when order exceeds `freeAbove`, or `null` if no zone matches.
