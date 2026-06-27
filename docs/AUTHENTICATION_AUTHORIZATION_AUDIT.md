# Authentication & Authorization Audit Report

**Project:** Shree Shyam Dairy Farm  
**Stack:** Next.js 16 App Router · Prisma · PostgreSQL · Custom JWT (`jose`)  
**Audit type:** Read-only — no code modified  
**Date:** June 27, 2026  
**Live URL:** https://shree-shyam-dairy-farm.vercel.app

---

## Executive Summary

Production authentication uses **custom JWT** (not NextAuth/Auth.js). Access tokens are signed JWTs in HttpOnly cookies; refresh tokens are **opaque database tokens** (not JWT). RBAC is mature with 68 permissions across 8 roles; ABAC is partially wired. Forgot/reset password is implemented with SHA-256 hashed tokens and Resend. Email verification and Google OAuth UI are incomplete. Multi-tenant isolation is partial.

**Final score: 6.5 / 10** — solid foundation, not yet enterprise-ready.

---

## 1. Authentication

| Check                | Status     | Details                                                                                      |
| -------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| Auth library         | Custom JWT | `jose` (SignJWT, jwtVerify) — **not** NextAuth/Auth.js                                       |
| Session strategy     | Hybrid     | Access = stateless JWT; refresh = DB opaque token; metadata in Session + RefreshToken tables |
| Credentials provider | Yes        | POST /api/v1/auth/login — email/password + optional TOTP                                     |
| Google OAuth         | Partial    | Backend: oauth/google route + oauth.ts — **no login UI button**                              |
| Email verification   | No flow    | User.emailVerified exists; Google sets it; no send/verify API or enforcement                 |
| Forgot password      | Yes        | POST /api/v1/auth/forgot-password + UI /forgot-password                                      |
| Password reset       | Yes        | GET/POST /api/v1/auth/reset-password + UI /reset-password                                    |
| bcrypt               | Yes        | bcryptjs, 12 rounds — src/lib/auth/password.ts                                               |

### Key files

- `src/lib/auth/jwt.ts` — access JWT sign/verify
- `src/lib/security/session-manager.ts` — session + opaque refresh tokens
- `src/config/auth.ts` — env validation
- `src/app/api/v1/auth/*` — all auth API routes
- `docs/adr/001-jwt-auth-over-authjs.md` — ADR: custom JWT over Auth.js

### Note

`next-auth` is **not** in package.json. `NEXTAUTH_SECRET` is a legacy alias for `JWT_ACCESS_SECRET`.

### Additional auth methods

| Method          | Status      | Files                                          |
| --------------- | ----------- | ---------------------------------------------- |
| Phone OTP login | Yes         | otp/request, otp/verify, otp.service.ts        |
| 2FA TOTP        | Yes (API)   | 2fa/setup, 2fa/disable, login accepts totpCode |
| Apple OAuth     | Schema only | AuthProvider.APPLE enum — no implementation    |

---

## 2. JWT

| Check                | Status                      | Details                              |
| -------------------- | --------------------------- | ------------------------------------ |
| JWT used?            | Yes (access only)           | Refresh uses opaque nanoid(48) in DB |
| Where generated?     | signAccessToken() in jwt.ts | Called from createAuthSession()      |
| Secret used          | JWT_ACCESS_SECRET           | Fallback: NEXTAUTH_SECRET            |
| HttpOnly cookies?    | Yes                         | ssd_access, ssd_refresh — cookies.ts |
| Encrypted or signed? | Signed only                 | HS256 via jose; not encrypted (JWE)  |

**Access JWT payload:** `{ sub, email, role, type: "access" }`  
**Expiry:** env JWT_ACCESS_EXPIRES (default 15m)

**Dead code:** signRefreshToken() / verifyRefreshToken() in jwt.ts are never used — refresh is DB-only.

### Environment variables (auth)

| Variable                                | Purpose                                    |
| --------------------------------------- | ------------------------------------------ |
| JWT_ACCESS_SECRET                       | Sign/verify access JWT (min 32 chars prod) |
| JWT_REFRESH_SECRET                      | Defined but unused in refresh flow         |
| NEXTAUTH_SECRET                         | Legacy alias → JWT_ACCESS_SECRET           |
| JWT_ACCESS_EXPIRES                      | Access TTL (default 15m)                   |
| JWT_REFRESH_EXPIRES                     | JWT refresh TTL (unused)                   |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google OAuth backend                       |
| RESEND_API_KEY / EMAIL_FROM             | Password reset emails                      |

---

## 3. Access Token & Refresh Token

| Feature               | Status  | Implementation                                               |
| --------------------- | ------- | ------------------------------------------------------------ |
| Access token          | Yes     | JWT in cookie ssd_access                                     |
| Refresh token         | Yes     | Opaque token in cookie ssd_refresh + RefreshToken row        |
| Refresh in DB         | Yes     | prisma.refreshToken — token, expiresAt, revokedAt, sessionId |
| Refresh API           | Yes     | POST /api/v1/auth/refresh                                    |
| Auto refresh (client) | Partial | fetchWithSession() — retries on 401; only subscription UI    |
| Refresh rotation      | No      | Same refresh token reused after refresh                      |
| Session list/revoke   | Yes     | GET /api/v1/auth/sessions, DELETE /api/v1/auth/sessions/[id] |

### Token flow

```
Login/Register/OAuth/OTP
  → createAuthSession()
    → prisma.session.create
    → prisma.refreshToken.create (opaque nanoid)
    → signAccessToken() (JWT)
    → setAuthCookies(access JWT, opaque refresh)

API auth
  → getCurrentUser() → cookie JWT → verifyAccessToken() → DB user lookup

Refresh (POST /api/v1/auth/refresh)
  → validateRefreshToken() (DB)
  → signAccessToken() (new JWT)
  → setAuthCookies(new access, same refresh — no rotation)

Logout
  → revokeRefreshToken() → clearAuthCookies()
```

**Gap:** Access cookie maxAge hardcoded 900s in cookies.ts while JWT expiry is env-configurable.

---

## 4. Authorization

### requireUser() — src/lib/auth/session.ts

1. Read ssd_access cookie
2. verifyAccessToken() (JWT)
3. DB lookup: user.isActive && deletedAt == null
4. Returns { user } or { error: 401 }

### requirePermission(permission, resourceOwnerId?)

1. Calls requireUser()
2. Calls authorize() from abac.ts
3. Checks RBAC via permissions.ts
4. Optional ABAC rules (ownership, sensitive, production delete)
5. Returns { error: 403 } on deny

### Other helpers

| Function               | Behavior                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| requireAdmin()         | requirePermission("admin:farm:read") — NOT platform admin; unused in APIs |
| requireSecurityAdmin() | requirePermission("admin:security:read")                                  |
| requireAnyPermission() | RBAC-only, no ABAC                                                        |
| requireFarmOperator()  | farm-session.ts — FARM_OPERATOR_ROLES                                     |

### RBAC

- **68 permissions** (admin:farm:read, crm:write, mobile:customer, etc.)
- **ROLE_PERMISSIONS** maps each UserRole to granted permissions
- ADMIN / OWNER → all permissions
- Unknown role string → falls back to CUSTOMER permissions

### All roles (prisma/schema.prisma)

```
CUSTOMER
ADMIN
DELIVERY
FARM_MANAGER
VETERINARIAN
ACCOUNTANT
IOT_OPERATOR
OWNER
```

### Protected routes

**Middleware (src/middleware.ts)** — cookie presence only, no JWT verify:

- /account/\*
- /admin/\*
- /m, /m/\* (not /manifest.json)

**Auth routes** (redirect if cookie present): /login, /signup

**Layout guards (server):**

| Layout                    | Guard                           |
| ------------------------- | ------------------------------- |
| account/layout.jsx        | Auth only                       |
| admin/\*/layout.jsx       | Auth + hasPermission per module |
| m/layout.jsx              | Auth + getAppsForRole()         |
| admin/farm/layout.jsx     | Auth + isFarmOperator()         |
| admin/security/layout.jsx | Auth + admin:security:read      |

**API routes:** ~150+ /api/v1/\* routes use requireUser() or requirePermission() per handler.

**Public APIs (no auth):** /api/products, /api/content, /api/payment/create-order, auth endpoints, webhooks.

---

## 5. Session

| Layer    | Storage                                              |
| -------- | ---------------------------------------------------- |
| Access   | JWT in HttpOnly cookie                               |
| Refresh  | Opaque token in HttpOnly cookie + RefreshToken table |
| Metadata | Session table (UA, IP, device, expiry, revocation)   |

### Cookie configuration (src/lib/auth/cookies.ts)

| Cookie  | Name        | HttpOnly | Secure    | SameSite | Path | MaxAge               |
| ------- | ----------- | -------- | --------- | -------- | ---- | -------------------- |
| Access  | ssd_access  | true     | prod only | lax      | /    | 900s (15 min)        |
| Refresh | ssd_refresh | true     | prod only | lax      | /    | 7d or 30d (remember) |

**Not used:** NextAuth sessions, Redis session store, JWT refresh in cookies.

---

## 6. Security

| Control            | Status    | Details                                                                            |
| ------------------ | --------- | ---------------------------------------------------------------------------------- |
| CSRF               | Partial   | No CSRF tokens; SameSite=lax only. validateOrigin() exists but not wired           |
| XSS                | Partial   | CSP + headers; CSP allows unsafe-inline and unsafe-eval                            |
| Rate limiting      | Partial   | securityGate() on auth routes only; Redis/in-memory                                |
| Brute-force        | Yes       | Login lockout — brute-force.ts                                                     |
| Password reset     | Yes       | randomBytes(32) → SHA-256 on User.passwordResetTokenHash, 15 min, sessions revoked |
| Email verification | No        | Not enforced on login                                                              |
| Session expiration | Yes       | DB expiresAt + cookie maxAge                                                       |
| Token expiration   | Yes       | JWT exp + refresh DB expiry                                                        |
| 2FA TOTP           | Yes (API) | Setup/disable; login accepts totpCode                                              |
| Audit log          | Yes       | audit.ts                                                                           |
| Bot detection      | Yes       | UA/heuristics in securityGate                                                      |
| Security headers   | Yes       | X-Frame-Options DENY, HSTS prod, nosniff, CSP                                      |

### securityGate pipeline (gate.ts)

1. IP allow/deny (ip-filter.ts)
2. Geo block (geo.ts, env-gated)
3. Bot detection (bot-detection.ts)
4. Optional rate limit → 429

Used on: login, register, refresh, forgot-password, reset-password, otp, oauth/google.

---

## 7. Multi-tenant Security

| Check                   | Status  | Details                                                                        |
| ----------------------- | ------- | ------------------------------------------------------------------------------ |
| Tenant resolution       | Yes     | Host subdomain → x-tenant-slug header + ssd_tenant cookie                      |
| Isolation enforced      | Partial | assertTenantMember() on tenant admin APIs                                      |
| Cross-tenant protection | Weak    | x-tenant-slug header trusted first (spoofable); withTenantScope() never called |
| Farm data scoping       | Weak    | Many farm services use hardcoded farmId: "default"                             |

### Resolution priority (resolve.ts)

1. x-tenant-slug header (client-spoofable on direct API calls)
2. Subdomain via resolveTenantFromHost
3. Verified custom domain
4. Default tenant fallback

**Risk:** Forged x-tenant-slug could probe tenant config if membership checks missing.

---

## 8. Razorpay (auth-related payment security)

| Check                 | Status      | Details                                                                  |
| --------------------- | ----------- | ------------------------------------------------------------------------ |
| Payment authorization | Client-side | Razorpay Checkout modal; server create-order                             |
| Payment verify        | Yes         | POST /api/payment/verify — HMAC signature                                |
| Webhook verification  | Yes         | HMAC-SHA256 + timingSafeEqual                                            |
| Subscription auto-pay | Partial     | createRazorpayBillingPlan — needs Razorpay Subscriptions on live account |
| Webhook secret        | Env         | RAZORPAY_WEBHOOK_SECRET                                                  |

**Webhook route:** src/app/api/payment/webhook/route.ts  
**Signature:** src/lib/payment/razorpay-webhook-signature.ts

---

## 9. Overall Assessment Table

| Feature                 | Status  | Implemented File(s)           | Production Ready | Improvement Needed                  |
| ----------------------- | ------- | ----------------------------- | ---------------- | ----------------------------------- |
| Custom JWT auth         | Done    | jwt.ts, session.ts            | Yes              | Align cookie maxAge with JWT expiry |
| Credentials login       | Done    | login/route.ts, password.ts   | Yes              | —                                   |
| Registration            | Done    | register/route.ts             | Yes              | Require email verify                |
| Access token (JWT)      | Done    | jwt.ts, cookies.ts            | Yes              | —                                   |
| Refresh token (DB)      | Done    | session-manager.ts            | Yes              | Add rotation on refresh             |
| Auto token refresh      | Partial | client-fetch.ts               | No               | App-wide fetch wrapper              |
| Google OAuth            | Partial | oauth/google/route.ts         | No               | Add login UI                        |
| Email verification      | Missing | Schema only                   | No               | API + email + enforce               |
| Forgot password         | Done    | forgot-password/route.ts      | Yes\*            | \*RESEND_API_KEY on Vercel          |
| Password reset          | Done    | password-reset.service.ts     | Yes\*            | DB migration for User fields        |
| bcrypt hashing          | Done    | password.ts                   | Yes              | —                                   |
| 2FA TOTP                | Done    | 2fa/setup, login              | Yes              | UI on login page                    |
| Phone OTP               | Done    | otp/request, otp/verify       | Partial          | MSG91 for prod SMS                  |
| RBAC (8 roles)          | Done    | permissions.ts                | Yes              | Audit all routes                    |
| ABAC                    | Partial | abac.ts                       | No               | Pass resourceOwnerId                |
| Middleware guard        | Partial | middleware.ts                 | Partial          | JWT verify in middleware            |
| Session revoke          | Done    | sessions/route.ts             | Yes              | —                                   |
| CSRF protection         | Missing | —                             | No               | CSRF tokens or SameSite=strict      |
| Rate limiting           | Partial | gate.ts                       | Partial          | Extend to checkout/admin            |
| Security headers        | Done    | next.config.ts                | Partial          | Remove unsafe-inline CSP            |
| Multi-tenant isolation  | Partial | tenant/isolation.ts           | No               | Use withTenantScope()               |
| Razorpay webhook HMAC   | Done    | razorpay-webhook-signature.ts | Yes              | Register in Dashboard               |
| Audit logging           | Done    | audit.ts                      | Yes              | —                                   |
| Password reset security | Done    | password-reset.service.ts     | Yes              | —                                   |

---

## 10. Final Score: 6.5 / 10

### Strengths

- Custom JWT + opaque refresh (better than JWT-only refresh)
- HttpOnly cookies, bcrypt (12 rounds), brute-force lockout, TOTP 2FA
- Comprehensive RBAC — 68 permissions, 8 roles
- Secure password reset — hashed token, 15 min TTL, session revocation
- Razorpay webhook HMAC with timing-safe compare
- Auth endpoints protected by securityGate

### Missing for enterprise production

1. Email verification enforced before checkout/admin
2. Google OAuth wired in login UI
3. App-wide automatic token refresh (not just subscriptions)
4. Refresh token rotation + reuse detection
5. CSRF protection beyond SameSite=lax
6. Middleware JWT validation (cookie presence only today)
7. Global API rate limiting on checkout, admin, export
8. Multi-tenant row-level isolation (withTenantScope unused)
9. Resend configured on Vercel for password reset emails
10. CSP hardening — remove unsafe-inline / unsafe-eval
11. ABAC ownership checks on user-owned resources
12. Remove dead JWT refresh helpers in jwt.ts

---

## Auth Flow (reference)

```
Browser → POST /api/v1/auth/login
       → createAuthSession()
       → DB: Session + RefreshToken
       → Cookies: ssd_access (JWT) + ssd_refresh (opaque)

Browser → Protected API + cookies
       → verifyAccessToken + DB user lookup

If 401 → POST /api/v1/auth/refresh
       → validateRefreshToken (DB)
       → New ssd_access JWT
```

---

## Password Reset Flow (reference)

```
POST /forgot-password
  → crypto.randomBytes(32) → plain token (email only)
  → SHA-256 → User.passwordResetTokenHash
  → 15 min → User.passwordResetExpiresAt
  → Resend email with link

GET /reset-password?token= → verify hash + expiry
POST /reset-password → bcrypt new password → clear hash + expiry → revoke all sessions
```

---

_Generated June 27, 2026 — Shree Shyam Dairy Farm · Read-only audit, no code modified._
