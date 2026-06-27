# Razorpay Integration — Current Project Audit

**Project:** Shree Shyam Dairy Farm  
**Stack:** Next.js 16.2.9 · App Router · TypeScript · Tailwind · Vercel  
**Branch deployed:** `main` (commit `c3543ea`)  
**Live URL:** https://shree-shyam-dairy-farm.vercel.app  
**Audit date:** June 27, 2026  
**Scope:** Read-only inspection — no code modified

---

## Executive Summary

Razorpay integration Steps 1–6 are **implemented and deployed** on production. Create-order, verify, checkout UI, payment persistence, inventory, notifications, and webhook routes all exist. The main gaps are operational: no confirmed live payment in the database yet, webhook registration in Razorpay Dashboard unverified, and the public `/test-payment` page should be removed after testing.

**Overall completion: ~82%**

---

## 1. Environment Variables

| Variable                      | Status               | Usage                                                 |
| ----------------------------- | -------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Configured           | Public key via `/api/payment/config`; Razorpay popup  |
| `RAZORPAY_KEY_SECRET`         | Configured           | Server-only in `@/lib/razorpay`, verify, create-order |
| `RAZORPAY_WEBHOOK_SECRET`     | Configured on Vercel | Webhook signature verification                        |

- Correct naming across codebase
- Zod validation in `src/config/payment.ts`
- Documented in `.env.example`
- Production: `/api/payment/config` returns `configured: true`, live key `rzp_live_...`
- Secret is **not** exposed in any API response

---

## 2. Razorpay SDK

- Package: `razorpay@^2.9.6` in `package.json`
- Reusable client: `src/lib/razorpay.ts`
  - `import "server-only"` guard
  - Singleton with HMR-safe caching
  - Validates both env vars on init

---

## 3. Create Order API

**Path:** `src/app/api/payment/create-order/route.ts`

| Check                                  | Status                 |
| -------------------------------------- | ---------------------- |
| Validation (amount, currency, receipt) | Yes                    |
| INR → paise conversion                 | Yes                    |
| Razorpay order creation                | Yes                    |
| Error handling                         | Yes                    |
| Links DB order to Razorpay order ID    | Yes                    |
| Production tested                      | Yes — returns order ID |

---

## 4. Frontend Checkout

| Component           | Path                       | Status   |
| ------------------- | -------------------------- | -------- |
| Cart checkout modal | `PaymentCheckoutModal.jsx` | Active   |
| Reusable component  | `RazorpayCheckout.tsx`     | Active   |
| Checkout utility    | `razorpayCheckout.js`      | Active   |
| ₹1 test page        | `/test-payment`            | Deployed |

**Flow:** Prepare order → config → create-order → load checkout.js → Razorpay popup → verify → success/failure handlers

---

## 5. Payment Verification API

**Path:** `src/app/api/payment/verify/route.ts`

- HMAC SHA-256 signature verification with `timingSafeEqual`
- Persists payment, marks order PAID
- Inventory decrement, invoice, notifications
- Idempotent duplicate payment handling
- HTTP codes: 400, 401, 404, 409, 500

---

## 6. Webhook

**Path:** `src/app/api/payment/webhook/route.ts`

- Raw body + `x-razorpay-signature` verification
- Events: payment.authorized, payment.captured, payment.failed, order.paid, refund.created, refund.processed
- Idempotency via `RazorpayWebhookEvent` model
- `runtime = "nodejs"`

**Production status (verified):**

- `GET /api/payment/webhook` → 405 (route exists)
- `POST /api/payment/webhook` → 401 without signature (security working)

**Why 404 was reported earlier:** Webhook was added in recent deploy; old production build did not include it. Browser GET tests may also have hit pre-deploy URL.

**Register in Razorpay Dashboard:**

```
https://shree-shyam-dairy-farm.vercel.app/api/payment/webhook
```

---

## 7. Deployment

| Endpoint                         | Live | Verified                 |
| -------------------------------- | ---- | ------------------------ |
| `GET /api/payment/config`        | Yes  | configured: true         |
| `POST /api/payment/create-order` | Yes  | Returns order ID         |
| `POST /api/payment/verify`       | Yes  | Requires valid signature |
| `POST /api/payment/webhook`      | Yes  | 401 without signature    |

Branch: `main` · Database: Neon PostgreSQL connected

---

## 8. Security

**Implemented:**

- CSP allows Razorpay domains
- Secret never in client bundle
- Config exposes only public keyId
- Webhook rejects unsigned requests

**Concerns:**

- `/test-payment` is public (anyone can trigger ₹1 live charge)
- No rate limiting on payment APIs
- Client-supplied `amount` in verify (should use DB total)
- Legacy `razorpayServer.js` lacks `server-only` import

---

## ✅ Completed

1. Environment variables (all 3) configured on Vercel
2. Razorpay SDK singleton (`src/lib/razorpay.ts`)
3. Create Order API (TypeScript, validated, production-tested)
4. Frontend checkout (modal, component, utilities, test page)
5. Payment verification (HMAC + persistence + inventory + invoice + notifications)
6. Webhook route (signature verify, event handling, idempotency)
7. Database integration (Neon, 5 migrations, orders creating)
8. Production deployment on `main`
9. CSP and security headers for Razorpay

---

## 🟡 Partially Completed

1. Legacy JS routes (`config`, `upi-qr`, `qr-status`) not migrated to TS
2. Duplicate SDK client (`razorpayServer.js` vs `lib/razorpay.ts`)
3. Dual checkout paths (`RazorpayCheckout.tsx` vs `razorpayCheckout.js`)
4. Webhook code deployed but Dashboard registration unconfirmed
5. 0 rows in `Payment` table — no confirmed live payment yet
6. Notifications may skip if email/WhatsApp env missing
7. No payment route integration tests
8. Payment APIs don't use `withApi` shim
9. No rate limiting on payment endpoints

---

## ❌ Missing

1. Payment route integration / E2E tests
2. Razorpay Dashboard webhook registration confirmation
3. Customer order history UI after payment
4. Refund customer UI
5. Payment retry flow
6. Rate limiting on `/api/payment/*`
7. CI gate on deploy
8. Post-test removal of `/test-payment`
9. Consolidation of duplicate Razorpay clients

---

## 🐞 Bugs

| Severity | Issue                                                 |
| -------- | ----------------------------------------------------- |
| Medium   | No completed payments in DB despite 4+ pending orders |
| Low      | Dual checkout implementations (drift risk)            |
| Low      | Client bill `estimatedTotal` trusted for order total  |
| Info     | `qr_payment: true` verify path skips signature        |

---

## 🔒 Security Issues

| Severity | Issue                                                   |
| -------- | ------------------------------------------------------- |
| High     | Public `/test-payment` allows live ₹1 charges by anyone |
| Medium   | No auth/rate limit on create-order                      |
| Medium   | Client-supplied amount in verify                        |
| Low      | Legacy `razorpayServer.js` without server-only guard    |

---

## 🚀 Deployment Issues

- Webhook 404 was from **old deployment** before route existed; **now live** (401/405)
- Razorpay Dashboard must register webhook URL + matching secret
- CI tests red; deploy not gated
- No automated post-deploy smoke test

---

## 📁 Recommended Folder Structure

```
src/app/api/payment/
  config/route.ts          (migrate from .js)
  create-order/route.ts    ✅
  verify/route.ts          ✅
  webhook/route.ts         ✅
src/lib/razorpay.ts        ✅ single SDK client
src/services/payment/      ✅ business logic
src/components/payment/    ✅ UI components

Remove: razorpayServer.js, upi-qr, qr-status, test-payment (after test)
```

---

## 📋 Next Implementation Plan

### P0 — Critical

1. Complete ₹1 live payment test via `/test-payment`
2. Register webhook in Razorpay Dashboard
3. Verify webhook delivery (200 response)
4. Remove or protect `/test-payment`

### P1 — High

5. Server-side order total validation in verify
6. Migrate remaining payment `.js` routes to TS
7. Consolidate SDK clients
8. Rate limiting on payment APIs
9. Debug payment completion if test fails
10. Gate deploy on CI

### P2 — Medium

11. Payment integration tests
12. Account order history UI
13. Migrate checkout modal to TS
14. Adopt `withApi` on payment routes

### P3 — Future

15. Payment retry, refund UI, Playwright E2E, remove unused UPI QR routes

---

## 🎯 Production Readiness Score

| Dimension        | Score /10 |
| ---------------- | --------- |
| Environment      | 8.5       |
| SDK              | 8.5       |
| Create Order API | 9.0       |
| Checkout         | 8.5       |
| Verification     | 9.0       |
| Webhook          | 7.5       |
| Deployment       | 8.0       |
| Security         | 7.0       |
| Code Quality     | 7.5       |

**Overall: ~82%**

---

_Generated June 27, 2026 — Shree Shyam Dairy Farm Razorpay Integration Audit_
