# Shree Shyam Dairy Farm — E-Commerce Platform Roadmap

Production-ready dairy e-commerce (Amazon/Flipkart-level) while preserving current navy/gold branding.

## Current State (Baseline)

| Area | Status |
|------|--------|
| Marketing homepage + category pages | ✅ Live |
| In-memory cart | ⚠️ Lost on refresh |
| Razorpay (UPI, Card, QR) | ✅ Partial |
| JSON file storage | ⚠️ Not production-safe on Vercel |
| User auth / accounts | ❌ |
| Admin UI | ❌ |
| Subscriptions | ❌ |
| Product detail pages | ❌ |

## Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router (Storefront + Account + Admin)       │
├─────────────────────────────────────────────────────────────┤
│  Zustand (cart, UI)  │  TanStack Query (server state)       │
├─────────────────────────────────────────────────────────────┤
│  API Routes (/api/v1/*)  │  Middleware (auth, RBAC)         │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM  →  PostgreSQL (Neon / Supabase / Railway)      │
├─────────────────────────────────────────────────────────────┤
│  Razorpay  │  Email (Resend)  │  SMS/WhatsApp (future)      │
└─────────────────────────────────────────────────────────────┘
```

## Folder Structure (Feature-Based)

```
app/
  (auth)/login, signup, forgot-password, verify-email, reset-password
  account/                    # My Account (protected)
    layout.jsx
    page.jsx                  # Dashboard
    orders/, wishlist/, addresses/, subscriptions/, ...
  admin/                      # Admin panel (role: ADMIN)
  product/[slug]/             # Product detail page
  checkout/                   # Full checkout flow
  api/v1/
    auth/                     # register, login, otp, refresh, logout
    cart/                     # sync, merge guest cart
    orders/
    wishlist/
    subscriptions/
    addresses/
    admin/

features/
  auth/components/
  cart/
  checkout/
  orders/
  subscriptions/
  admin/

lib/
  db/prisma.ts
  auth/                       # JWT, sessions, cookies
  validators/                 # Zod schemas
  services/                   # Business logic

store/                        # Zustand stores
hooks/                        # useAuth, useCartSync, ...
types/                        # TypeScript interfaces
prisma/schema.prisma
```

## Database Schema (Prisma)

See `prisma/schema.prisma` — covers Users, Sessions, Addresses, Products, Categories, Orders, Cart, Wishlist, Payments, Subscriptions, Coupons, Reviews, Notifications, Wallet.

## Implementation Phases

### Phase 1 — Foundation (Week 1–2) ← **STARTED**
- [x] Roadmap + schema design
- [ ] PostgreSQL + Prisma setup
- [ ] JWT auth (access + refresh tokens)
- [ ] Register / Login / Logout / Refresh
- [ ] Persistent cart (localStorage + DB sync)
- [ ] Guest cart merge on login
- [ ] Account layout shell + protected routes
- [ ] Providers (TanStack Query)

### Phase 2 — Auth Complete (Week 2–3)
- [ ] Email verification (token + Resend)
- [ ] Forgot / Reset password
- [ ] Mobile OTP login (MSG91 / Twilio)
- [ ] Google OAuth
- [ ] Remember Me (long-lived refresh)
- [ ] Apple OAuth stub (future-ready)

### Phase 3 — Checkout & Orders (Week 3–4)
- [ ] Product detail pages (`/product/[slug]`)
- [ ] Shipping + billing addresses
- [ ] Delivery slot selection
- [ ] Full checkout flow
- [ ] COD option
- [ ] GST invoice generation
- [ ] Order status workflow
- [ ] Order tracking page
- [ ] Download invoice (PDF)

### Phase 4 — Milk Subscription (Week 4–5) ⭐ Priority
- [ ] Daily / alternate / weekly / monthly / custom
- [ ] Pause / resume / skip tomorrow
- [ ] Vacation mode
- [ ] Delivery calendar
- [ ] Morning / evening slot
- [ ] Subscription billing (Razorpay subscriptions)

### Phase 5 — Discovery & Engagement (Week 5–6)
- [ ] Live search + suggestions
- [ ] Wishlist
- [ ] Reviews & ratings (user-submitted)
- [ ] Related products + frequently bought together
- [ ] Coupons & wallet
- [ ] Refer & earn

### Phase 6 — Admin Panel (Week 6–8)
- [ ] Dashboard analytics
- [ ] Orders management
- [ ] Products & categories CRUD
- [ ] Users & subscriptions
- [ ] Inventory & delivery
- [ ] Coupons & reports
- [ ] Settings

### Phase 7 — Notifications & Polish (Week 8–9)
- [ ] Email (order confirm, OTP, subscription)
- [ ] SMS / WhatsApp hooks
- [ ] Push notifications (web push)
- [ ] Skeleton loaders, toasts
- [ ] Dark mode tokens
- [ ] SEO (schema.org, sitemap, robots)

### Phase 8 — Security & Performance (Ongoing)
- [ ] Rate limiting (Upstash Redis)
- [ ] CSRF / XSS hardening
- [ ] Input sanitization
- [ ] Image optimization, lazy routes
- [ ] Caching strategy

## Tech Decisions

| Choice | Reason |
|--------|--------|
| **PostgreSQL** | Relational data, ACID orders, subscriptions |
| **Prisma** | Type-safe ORM, migrations, Next.js fit |
| **JWT + httpOnly cookies** | Stateless API + secure refresh |
| **Zustand** | Lightweight cart/UI state + persist |
| **TanStack Query** | Server cache, mutations, optimistic updates |
| **Zod + RHF** | Form validation |
| **Incremental TS** | New features in TS; existing JSX untouched |

## Migration Strategy

1. **Keep** `data/content.json` for CMS copy until admin CMS ships.
2. **Seed** products/categories from JSON → PostgreSQL.
3. **Dual-write** orders to DB + JSON during transition.
4. **No UI breaks** — new routes alongside existing homepage.

## Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=...
MSG91_AUTH_KEY=...          # OTP SMS
```

## Next Steps After Phase 1

Run migrations, seed DB, connect Vercel Postgres/Neon, test auth + cart merge E2E, then Phase 2 email OTP.
