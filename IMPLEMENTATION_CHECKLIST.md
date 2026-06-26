# IMPLEMENTATION_CHECKLIST.md

**Project:** Shree Shyam Dairy Farm  
**Date:** June 25, 2026 · **Sprint 0 updated:** June 26, 2026  
**Source:** `MASTER_PROJECT_AUDIT.md` Phases 2–9 · Sprint 0 per `SPRINT0_SUMMARY.md`  
**Legend:** ✅ Done · 🟡 Partial · ⬜ Missing · 🔴 Incorrect/Blocked · ➖ N/A

Use this as the master feature tracker. Do not overwrite completed work — extend and wire existing APIs/UI.

---

## Foundation

| Item                             | Status | Evidence / Notes                                                               |
| -------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Folder structure (`src/`)        | ✅     | `docs/folder-structure.md`                                                     |
| Environment templates            | ✅     | `.env.example`                                                                 |
| Centralized config               | ✅     | `src/config/`, `getConfig()`                                                   |
| Config adoption in app code      | 🟡     | ~60 files still use `process.env`                                              |
| Logging (Pino)                   | ✅     | `src/lib/logging/` — client/server split + domain layers (`LOGGING_REVIEW.md`) |
| Error handling                   | ✅     | `src/lib/errors/`, error pages                                                 |
| Error handler adoption in routes | 🟡     | `withApi` rarely used                                                          |
| Documentation                    | ✅     | `docs/` enterprise guides + Sprint 0 reports                                   |
| CI/CD                            | 🟡     | Workflows exist; **test step fails** (`server-only` / Vitest)                  |
| ESLint                           | ✅     | 0 errors (Sprint 0); 53 warnings remain                                        |
| TypeScript strict                | ✅     | `npm run typecheck` passes                                                     |
| Unit tests                       | 🟡     | 124 pass; 3 suites fail to load (Vitest `server-only`)                         |
| Production build                 | ✅     | `npm run build` passes (Sprint 0)                                              |
| Prettier                         | 🟡     | Configured; 581 files unformatted                                              |
| Husky + lint-staged              | ✅     | `.husky/pre-commit`                                                            |
| Commitlint                       | ✅     | `commitlint.config.mjs`                                                        |
| EditorConfig                     | ✅     | `.editorconfig`                                                                |
| E2E tests                        | ⬜     | No Playwright/Cypress                                                          |
| Docker / K8s                     | ✅     | `Dockerfile`, `docker-compose*.yml`, `k8s/`                                    |

---

## Authentication

| Item                | Status | Evidence / Notes                              |
| ------------------- | ------ | --------------------------------------------- |
| Login               | ✅     | `LoginForm.jsx`, `/api/v1/auth/login`         |
| Signup              | ✅     | `signup/page.jsx`, `/api/v1/auth/register`    |
| Forgot password     | 🟡     | API only — no `/forgot-password` page         |
| Reset password      | 🟡     | API only — no `/reset-password` page          |
| OTP request/verify  | 🟡     | APIs exist — no login UI                      |
| Google login        | 🟡     | `/api/v1/auth/oauth/google` — no button in UI |
| Apple login         | ⬜     | No route or provider                          |
| JWT access/refresh  | ✅     | `src/lib/auth/jwt.ts`, cookies                |
| Sessions (DB)       | 🟡     | APIs `/api/v1/auth/sessions` — no account UI  |
| Session revoke      | 🟡     | API exists                                    |
| RBAC                | ✅     | `permissions.ts`, admin layouts               |
| ABAC                | ✅     | `abac.ts`                                     |
| 2FA TOTP            | 🟡     | Setup/disable APIs — limited UI               |
| WebAuthn / passkeys | 🟡     | Mobile biometric routes                       |
| Brute-force lockout | ✅     | `brute-force.ts`                              |
| Password policy     | ✅     | `password-policy.ts`                          |
| Audit log on auth   | ✅     | `writeAudit()`, `AUDIT_ACTIONS`               |
| OAuth state/PKCE    | 🟡     | Google flow in `oauth.ts`                     |

---

## Customer (Storefront)

| Item                       | Status | Evidence / Notes                                                     |
| -------------------------- | ------ | -------------------------------------------------------------------- |
| Home                       | ✅     | `page.jsx`, `HomePage.jsx`                                           |
| Products listing           | ✅     | Carousels, `ProductCard`, `/api/products`                            |
| Categories                 | ✅     | `CategoryGrid`, `/category/[slug]`                                   |
| Search                     | ⬜     | No search UI or API query                                            |
| Filters (price/sort/stock) | 🟡     | Category filter in public API only                                   |
| Wishlist                   | ⬜     | Model exists; account placeholder                                    |
| Cart                       | ✅     | `CartContext`, `CartDrawer`, `/api/v1/cart`                          |
| Cart sync (guest→user)     | ✅     | `/api/v1/cart/sync`                                                  |
| Buy again                  | ⬜     | Account orders placeholder Phase 3                                   |
| Recently viewed            | ⬜     | No schema or UI                                                      |
| Save for later             | ⬜     | Not implemented                                                      |
| Product compare            | ⬜     | `compareAtPrice` is MRP only                                         |
| Product detail page        | 🟡     | Modal/card driven; limited PDP routes                                |
| Reviews                    | 🟡     | `Review` model — limited UI                                          |
| Newsletter                 | ✅     | `/api/newsletter`                                                    |
| Contact form               | ✅     | `ContactForm.jsx`, `/api/contact`                                    |
| Chat assistant             | ✅     | `ChatAssistant.jsx`, `/api/chat`                                     |
| PWA manifest               | 🟡     | `manifest.json`; SW unclear                                          |
| SEO metadata               | 🟡     | `generateMetadata` in layout — tenant `headers()` keeps site dynamic |
| `robots.ts` / `sitemap.ts` | ⬜     | Not found                                                            |

---

## Checkout

| Item                           | Status | Evidence / Notes                            |
| ------------------------------ | ------ | ------------------------------------------- |
| Address selection              | ⬜     | `Address` model; no checkout step           |
| Coupons                        | ✅     | `CartContext`, `findCoupon()`, UI in drawer |
| GST on cart bill               | ⬜     | GST in retail module only                   |
| Delivery slot (one-time order) | ⬜     | Slots for subscriptions only                |
| Delivery slot (subscription)   | ✅     | `SubscribeMilkForm.jsx`                     |
| Order summary                  | ✅     | `CartDrawer`, `PaymentCheckoutModal`        |
| Shipping calculation           | 🟡     | Rules in `cart.js`                          |
| Guest checkout                 | 🟡     | Cart works; account prompts                 |
| WhatsApp order CTA             | ✅     | Cart drawer link                            |

---

## Payments

| Item                        | Status | Evidence / Notes                                          |
| --------------------------- | ------ | --------------------------------------------------------- |
| Razorpay order create       | ✅     | `/api/payment/create-order`                               |
| Razorpay verify             | ✅     | `/api/payment/verify`                                     |
| UPI QR flow                 | ✅     | `/api/payment/upi-qr`, qr-status                          |
| Payment config endpoint     | ✅     | `/api/payment/config`                                     |
| Stripe (tenant billing)     | 🟡     | Checkout + webhooks under `/api/v1/tenant/billing/stripe` |
| Razorpay tenant webhooks    | 🟡     | `/api/v1/tenant/billing/razorpay/webhook`                 |
| Storefront Razorpay webhook | ⬜     | Not dedicated                                             |
| Payment retry               | ⬜     | No retry flow                                             |
| Invoice / receipt PDF       | ⬜     | Not implemented                                           |
| Saved payment methods       | 🟡     | `SavedPaymentMethod` model                                |
| COD support                 | 🟡     | Enum exists; checkout flow unclear                        |
| Refund via Razorpay API     | 🟡     | Workflow + retail returns                                 |
| Webhook signature verify    | 🟡     | Tenant webhooks; verify legacy routes                     |

---

## Orders

| Item                        | Status | Evidence / Notes                           |
| --------------------------- | ------ | ------------------------------------------ |
| Order creation (DB)         | 🟡     | Payment verify persists; flow in JS routes |
| Order tracking (customer)   | ⬜     | Account placeholder                        |
| Order timeline              | ⬜     | No UI                                      |
| Public order lookup         | ✅     | `/api/public/v1/orders/[orderNumber]`      |
| Cancel order                | ⬜     | No customer API/UI                         |
| Refund request              | 🟡     | Workflow `submitRefundRequest`             |
| Return request              | 🟡     | Retail returns service                     |
| Order status enum lifecycle | ✅     | `OrderStatus` in Prisma                    |
| Delivery assignment link    | ✅     | `DeliveryAssignment` model                 |
| Email on order              | 🟡     | Depends on Resend config                   |

---

## Subscription (Milk)

| Item                           | Status | Evidence / Notes                           |
| ------------------------------ | ------ | ------------------------------------------ |
| Create subscription            | ✅     | `/api/v1/subscriptions` POST               |
| List subscriptions             | ✅     | `SubscriptionManager.jsx`                  |
| Pause                          | ✅     | `/api/v1/subscriptions/[id]/pause`         |
| Resume                         | ✅     | `/api/v1/subscriptions/[id]/resume`        |
| Vacation mode                  | ✅     | `/api/v1/subscriptions/[id]/vacation`      |
| Cancel                         | ✅     | `/api/v1/subscriptions/[id]/cancel`        |
| Skip tomorrow                  | ✅     | `/api/v1/subscriptions/[id]/skip-tomorrow` |
| Billing history                | ✅     | `/api/v1/subscriptions/[id]/billing`       |
| Delivery calendar UI           | 🟡     | `DeliveryCalendar.jsx` — verify wiring     |
| Subscription approval workflow | 🟡     | `SubscriptionApprovalRequest` model        |

---

## Admin

| Item                | Status | Evidence / Notes                         |
| ------------------- | ------ | ---------------------------------------- |
| Unified dashboard   | ⬜     | `/admin` redirects to farm               |
| Products admin      | ⬜     | Seed + JSON only                         |
| Orders admin        | ⬜     | No UI                                    |
| Customers admin     | 🟡     | CRM customers tab (not ecommerce `User`) |
| Coupons admin       | ⬜     | Model only                               |
| CMS admin           | ⬜     | PUT API + JSON file                      |
| Reports hub         | ⬜     | Scattered per-module analytics           |
| Farm admin          | ✅     | `/admin/farm/*`                          |
| CRM admin           | ✅     | `/admin/crm`                             |
| Fleet admin         | ✅     | `/admin/fleet`                           |
| Processing admin    | ✅     | `/admin/processing`                      |
| Retail admin        | ✅     | `/admin/retail`                          |
| Tenant admin        | ✅     | `/admin/tenant`                          |
| Security dashboard  | ✅     | `/admin/security`                        |
| AI platform admin   | ✅     | `/admin/ai`                              |
| SaaS admin          | ✅     | `/admin/saas`                            |
| Documents admin     | ✅     | `/admin/documents`                       |
| Workflows admin     | ✅     | `/admin/workflows`                       |
| Integrations admin  | ✅     | `/admin/integrations`                    |
| Notifications admin | ✅     | `/admin/notifications`                   |
| Shared admin shell  | ⬜     | 13 separate layouts                      |
| Role-gated layouts  | ✅     | Per-module `layout.jsx`                  |

---

## Inventory

| Item                  | Status | Evidence / Notes              |
| --------------------- | ------ | ----------------------------- |
| Warehouse             | ⬜     | No model                      |
| Batch (processing)    | 🟡     | `ProcBatch`, processing admin |
| Stock (product level) | 🟡     | `Product.stockQty`, `inStock` |
| Stock movements       | ⬜     | No ledger                     |
| Purchase orders       | 🟡     | `PurchaseRequest` + workflow  |
| Supplier              | ⬜     | No model                      |
| AI inventory forecast | 🟡     | `runInventoryForecast`        |
| Barcode scan (retail) | 🟡     | `/api/v1/retail/scan`         |

---

## Delivery

| Item                       | Status | Evidence / Notes                   |
| -------------------------- | ------ | ---------------------------------- |
| Delivery boy app           | ✅     | `/m/delivery`                      |
| Delivery assignments API   | ✅     | `/api/v1/mobile/delivery`          |
| Route optimization (fleet) | 🟡     | `FleetRoute` — fleet not last-mile |
| Delivery OTP (doorstep)    | ⬜     | Auth OTP only                      |
| GPS tracking               | ✅     | `GpsPing`, `/api/v1/mobile/gps`    |
| Proof of delivery photo    | 🟡     | `/api/v1/mobile/camera`            |
| Offline delivery sync      | 🟡     | `OfflineSyncRecord`                |

---

## Dairy ERP

| Item                   | Status | Evidence / Notes                      |
| ---------------------- | ------ | ------------------------------------- |
| Cow management         | 🟡     | `Cow` model, seed, vet mobile view    |
| Milk collection ledger | ⬜     | No farmer-level collection            |
| Feed management        | 🟡     | Autonomy `FEED_MACHINE` actuator only |
| Health records         | 🟡     | `EmergencyEvent`, vet alerts          |
| Breeding               | ⬜     | No model                              |
| Calf                   | ⬜     | No model                              |
| Finance / GL           | 🟡     | `WalletTransaction`, expense workflow |
| ERP reports            | 🟡     | Predictions dashboard; no ERP suite   |
| Production planning    | 🟡     | `ProductionPlan`, processing          |
| Cow / herd analytics   | 🟡     | AI domains                            |

---

## AI

| Item                        | Status | Evidence / Notes                               |
| --------------------------- | ------ | ---------------------------------------------- |
| Chat assistant (storefront) | ✅     | `ChatAssistant`, `/api/chat`                   |
| Chat (farm/admin)           | ✅     | `/api/v1/ai/chat`                              |
| Prediction engine           | ✅     | `prediction.service.ts`, `/api/v1/predictions` |
| Recommendations             | 🟡     | `AIRecommendation` generated; limited UI       |
| Voice                       | 🟡     | `/api/v1/ai/voice`                             |
| WhatsApp AI                 | 🟡     | `/api/v1/ai/whatsapp`                          |
| Agent runs                  | 🟡     | `/api/v1/ai/agents`, farm agent page           |
| Vision ingest               | 🟡     | `/api/v1/vision/ingest`                        |
| OpenAI integration          | 🟡     | Graceful degrade without key                   |
| Rules-based fallback        | ✅     | `chatAssistant.js`                             |

---

## IoT

| Item                   | Status | Evidence / Notes                   |
| ---------------------- | ------ | ---------------------------------- |
| Device registry        | ✅     | `IoTDevice`, IoT admin             |
| Device data ingest     | ✅     | POST `/api/v1/iot/data`            |
| MQTT bridge            | 🟡     | Worker optional; health API        |
| Sensor readings        | ✅     | `SensorReading`, idempotent ingest |
| Alerts / emergencies   | 🟡     | `EmergencyEvent`, autonomy API     |
| Edge gateway           | 🟡     | `EdgeGateway`, gateway admin       |
| Weather station        | 🟡     | Models + weather API               |
| CCTV / vision          | 🟡     | Models + vision page               |
| Actuators / automation | ✅     | `AutomationRule`, autonomy service |
| Milk tank monitor      | 🟡     | `MilkTankMonitor` model            |

---

## Platform Modules (Beyond Master Checklist)

| Module                 | Status | Notes                                   |
| ---------------------- | ------ | --------------------------------------- |
| Multi-tenant SaaS      | 🟡     | Tenants, billing, marketplace, partners |
| Workflows / approvals  | ✅     | Definitions, instances, admin UI        |
| Documents / DMS        | ✅     | Upload, OCR, signatures                 |
| CRM pipeline           | ✅     | Leads, opportunities, tickets           |
| Fleet management       | ✅     | Vehicles, trips, fuel, maintenance      |
| Retail POS             | ✅     | Bills, terminals, loyalty               |
| Processing plant       | ✅     | Batches, QC, recipes                    |
| Notifications platform | ✅     | Templates, broadcasts, channels         |
| Integrations hub       | ✅     | Plugins, connections, webhooks          |
| Developer API          | ✅     | Keys, webhooks, OpenAPI                 |
| Mobile PWA (roles)     | 🟡     | Customer, delivery, owner, vet          |
| GraphQL                | 🟡     | `/api/graphql` — audit needed           |
| GDPR                   | 🟡     | Export/delete/consent APIs              |

---

## Security Checklist

| Item                             | Status | Notes                                     |
| -------------------------------- | ------ | ----------------------------------------- |
| Env secrets not in repo          | ✅     | `.gitignore`                              |
| Env validation at startup        | ✅     | `instrumentation.ts`                      |
| JWT HTTP-only cookies            | ✅     | `ssd_access`, `ssd_refresh`               |
| Password hashing (bcrypt)        | ✅     | `bcryptjs`                                |
| Encryption at rest (credentials) | ✅     | `ENCRYPTION_KEY`                          |
| CSP headers                      | ✅     | `next.config.ts`                          |
| HSTS (production)                | ✅     | Security headers                          |
| Rate limiting                    | ✅     | `rate-limit.ts`                           |
| SQL injection mitigation         | ✅     | Prisma + `sanitizeSearchInput`            |
| XSS mitigation                   | 🟡     | CSP; postcss advisory transitive          |
| CSRF                             | 🟡     | SameSite cookies; no explicit CSRF tokens |
| Bot detection                    | 🟡     | Configurable                              |
| Geo blocking                     | 🟡     | Configurable                              |
| API key hashing                  | ✅     | `lib/api/auth.ts`                         |
| Audit logging                    | ✅     | DB + Pino audit logger                    |
| npm audit clean (high)           | ✅     | 0 high/critical                           |
| npm audit clean (moderate)       | 🟡     | 2 moderate (postcss)                      |

---

## Performance Checklist

| Item                         | Status | Notes                                           |
| ---------------------------- | ------ | ----------------------------------------------- |
| Production build             | ✅     | Sprint 0 — logging client/server split          |
| Bundle size measured         | 🟡     | Build passes; analyzer not in CI                |
| Image optimization           | 🟡     | `next/image` partial                            |
| Code splitting / lazy load   | 🟡     | Limited dynamic imports                         |
| Redundant UI `force-dynamic` | ✅     | Removed from layout, homepage, category page    |
| Static marketing pages       | 🟡     | Still dynamic via `headers()` tenant resolution |
| Redis caching                | 🟡     | Optional in dev                                 |
| DB indexes                   | 🟡     | ~100 `@@index` in schema                        |
| API response compression     | ➖     | Platform (Vercel/nginx)                         |
| Prisma query optimization    | 🟡     | Not profiled                                    |

---

## Documentation Checklist

| Document             | Status | Path                        |
| -------------------- | ------ | --------------------------- |
| Setup guide          | ✅     | `docs/setup.md`             |
| Architecture         | ✅     | `docs/architecture.md`      |
| Database             | ✅     | `docs/database.md`          |
| API guidelines       | ✅     | `docs/api-guidelines.md`    |
| Coding guidelines    | ✅     | `docs/coding-guidelines.md` |
| Deployment           | ✅     | `docs/deployment.md`        |
| Folder structure     | ✅     | `docs/folder-structure.md`  |
| Foundation report    | ✅     | `docs/foundation-report.md` |
| API route catalogs   | ✅     | `docs/api/`                 |
| Admin guides         | ✅     | `docs/admin-guides/`        |
| ADRs                 | ✅     | `docs/adr/`                 |
| ER diagrams          | ✅     | `docs/er-diagrams/`         |
| Developer onboarding | 🟡     | Scattered across docs       |
| CONTRIBUTING.md      | ⬜     | Not found                   |

---

## Release Gates (Copy Before Deploy)

```
[x] npm run typecheck       ✅ (Sprint 0)
[ ] npm run test            ❌ Vitest server-only (3 suites)
[x] npm run lint            ✅ 0 errors (Sprint 0)
[x] npm run build           ✅ (Sprint 0)
[ ] npm run env:validate    (production vars set)
[ ] prisma migrate deploy   (not db:push)
[ ] Workers running (queue, webhooks) if Redis enabled
[ ] Smoke: login, cart, checkout, /api/health
[ ] GitHub Actions validate — full green
```

---

## Suggested Implementation Phases

| Phase   | Focus                                | Status                                                     |
| ------- | ------------------------------------ | ---------------------------------------------------------- |
| **0**   | Production stabilization             | 🟡 **Mostly complete** — build + lint ✅; tests/CI partial |
| **0.1** | Vitest `server-only` mock + CI green | ⬜ Next                                                    |
| **1**   | Customer commerce MVP                | ⬜ Orders UI, auth pages, address checkout                 |
| **2**   | Admin ecommerce                      | ⬜ Products, orders, coupons admin                         |
| **3**   | Performance & SEO                    | 🟡 UI `force-dynamic` done; tenant ISR pending             |
| **4**   | Platform adoption                    | ⬜ withApi, getConfig, test coverage                       |
| **5**   | Dairy ERP core                       | ⬜ Milk collection, warehouse, breeding                    |
| **6**   | Scale & ops                          | ⬜ Sentry, E2E, read replicas, AdminShell                  |

---

## Related

- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Scores and executive summary
- [SPRINT0_SUMMARY.md](./SPRINT0_SUMMARY.md) — Sprint 0 completion
- [NEXT_SPRINT_PLAN.md](./NEXT_SPRINT_PLAN.md) — Original Sprint 0 plan
- [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) — Debt register with IDs
- [MASTER_PROJECT_AUDIT.md](./MASTER_PROJECT_AUDIT.md) — Source instructions

---

_Updated post Sprint 0 (June 26, 2026). No application code modified in this update._
