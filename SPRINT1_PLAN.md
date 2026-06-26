# Sprint 1 Plan — Authentication & Customer Account

**Project:** Shree Shyam Dairy Farm  
**Sprint:** Sprint 1  
**Date:** June 26, 2026  
**Duration:** 2 weeks (10 working days)  
**Prerequisite:** Sprint 0 complete (build ✅, lint ✅) — **Sprint 0.1 recommended** (Vitest `server-only` mock, CI green)  
**Scope:** Authentication flows + customer account shell — **no implementation in this document**

---

## Sprint goal

Deliver a **complete customer identity experience**: users can recover passwords, sign in with Google or OTP, manage their profile, and maintain a delivery address book — wired to **existing backend APIs and Prisma models** without rewriting auth architecture.

---

## Project status snapshot (post Sprint 0)

| Area                | Status                                  |
| ------------------- | --------------------------------------- |
| Production build    | ✅ Pass                                 |
| Lint                | ✅ 0 errors                             |
| Typecheck           | ✅ Pass                                 |
| Tests / CI          | ❌ Vitest `server-only` (Sprint 0.1)    |
| Platform completion | ~60%                                    |
| Auth APIs (backend) | ~75% built                              |
| Auth UI             | ~40% built                              |
| Account UI          | ~35% built (shell + subscriptions work) |
| Address book        | ~10% (model only)                       |
| Profile API         | ⬜ Missing                              |

**Strategic fit:** Sprint 1 closes the highest-trust gap between “can log in with email” and “can manage my account” — prerequisite for checkout address (Sprint 2) and order history.

---

## Current state analysis

### Legend

| Symbol | Meaning                     |
| ------ | --------------------------- |
| ✅     | Done — usable end-to-end    |
| 🟡     | Partial — API or UI only    |
| ⬜     | Missing                     |
| 🔴     | Broken or incomplete wiring |

---

### 1. Authentication (email/password)

| Layer         | Status | Evidence                                                     |
| ------------- | ------ | ------------------------------------------------------------ |
| Login API     | ✅     | `POST /api/v1/auth/login` — JWT cookies, brute-force lockout |
| Login UI      | ✅     | `LoginForm.jsx` — email/password, remember me, redirect      |
| Signup API    | ✅     | `POST /api/v1/auth/register`                                 |
| Signup UI     | ✅     | `signup/page.jsx`                                            |
| Session / me  | ✅     | `GET /api/v1/auth/me`, `getCurrentUser()`                    |
| Logout        | ✅     | `LogoutButton`, `/api/v1/auth/logout`                        |
| Account guard | ✅     | `account/layout.jsx` redirects to `/login?redirect=/account` |

**Gap:** Login form links to `/forgot-password` but **page does not exist** (404).

---

### 2. Forgot password

| Layer      | Status | Evidence                                   |
| ---------- | ------ | ------------------------------------------ |
| API        | ✅     | `POST /api/v1/auth/forgot-password`        |
| Validation | ✅     | `forgotPasswordSchema` (Zod)               |
| Rate limit | ✅     | 3 req / 5 min via `securityGate`           |
| Email send | 🟡     | Resend when `RESEND_API_KEY`; else dev log |
| Audit      | ✅     | `PASSWORD_RESET_REQUEST`                   |
| UI         | ⬜     | No `src/app/(auth)/forgot-password/page`   |

**API contract:**

```json
POST { "email": "user@example.com" }
→ { "success": true, "message": "If an account exists, a reset link has been sent." }
```

Email link format: `{APP_URL}/reset-password?token={token}`

---

### 3. Reset password

| Layer          | Status | Evidence                                         |
| -------------- | ------ | ------------------------------------------------ |
| API            | ✅     | `POST /api/v1/auth/reset-password`               |
| Validation     | ✅     | `resetPasswordSchema` + `validatePasswordPolicy` |
| Token consume  | ✅     | `consumeEmailToken(token, "reset_password")`     |
| Session revoke | ✅     | `revokeAllUserSessions` on success               |
| UI             | ⬜     | No `src/app/(auth)/reset-password/page`          |

**API contract:**

```json
POST { "token": "...", "password": "NewPass1!" }
→ { "success": true, "message": "Password updated. Please sign in again." }
```

---

### 4. Google login

| Layer         | Status | Evidence                                                          |
| ------------- | ------ | ----------------------------------------------------------------- |
| OAuth lib     | ✅     | `src/lib/security/oauth.ts` — exchange, find/create user          |
| POST API      | ✅     | `POST /api/v1/auth/oauth/google` with `{ code, remember }`        |
| GET API       | 🟡     | Redirects **to** Google only — **does not handle callback**       |
| Env           | 🟡     | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| UI button     | ⬜     | Not on `LoginForm.jsx` or signup                                  |
| Callback page | ⬜     | No route to receive `?code=` and complete login                   |

**Critical gap:** Google redirects to `GOOGLE_REDIRECT_URI` (default: `/api/v1/auth/oauth/google`). Current `GET` handler always starts a **new** OAuth flow instead of processing `code` + `state` from the callback. Sprint 1 must add **callback handling** (extend GET or add dedicated callback route/page).

---

### 5. OTP login (phone)

| Layer       | Status | Evidence                                                              |
| ----------- | ------ | --------------------------------------------------------------------- |
| Request API | ✅     | `POST /api/v1/auth/otp/request` — `{ phone }`                         |
| Verify API  | ✅     | `POST /api/v1/auth/otp/verify` — creates user if new (PHONE provider) |
| SMS         | 🟡     | MSG91 when configured; `devCode` in dev response                      |
| Validation  | ✅     | Indian 10-digit regex `^[6-9]\d{9}$`                                  |
| Rate limit  | ✅     | 3 request / 5 min per phone                                           |
| UI          | ⬜     | No OTP tab/flow on login or signup                                    |

**Note:** OTP verify sets session cookies via `createAuthSession` — same as password login. UI needs two-step phone → code flow with resend timer.

---

### 6. Customer account shell

| Layer             | Status | Evidence                                                |
| ----------------- | ------ | ------------------------------------------------------- |
| Layout + nav      | ✅     | `account/layout.jsx` — sidebar, user header, auth guard |
| Dashboard         | ✅     | `account/page.jsx` — quick links                        |
| Subscriptions     | ✅     | `account/subscriptions/page.jsx` — real UI              |
| Notifications     | ✅     | `account/notifications/page.jsx`                        |
| Approvals         | ✅     | `account/approvals/page.jsx`                            |
| Placeholder pages | 🟡     | `account/[slug]/page.jsx` — addresses, wishlist, etc.   |
| Orders            | 🟡     | Placeholder only — **out of Sprint 1 scope**            |
| Profile page      | ⬜     | No `/account/profile` route                             |
| GDPR delete       | ✅     | `DELETE /api/v1/account` (not exposed in UI)            |

---

### 7. Address book

| Layer         | Status | Evidence                                                                              |
| ------------- | ------ | ------------------------------------------------------------------------------------- |
| Prisma model  | ✅     | `Address` — name, phone, line1/2, city, state, pincode, landmark, `isDefault`, `type` |
| User relation | ✅     | `User.addresses`                                                                      |
| CRUD API      | ⬜     | No `/api/v1/account/addresses` routes                                                 |
| UI            | ⬜     | Placeholder at `/account/addresses` via `[slug]`                                      |
| Inline create | 🟡     | Subscription POST creates address ad hoc                                              |

**Fields (from schema):** `SHIPPING` | `BILLING` type, Indian pincode, default flag.

---

### 8. Profile

| Layer        | Status | Evidence                                                             |
| ------------ | ------ | -------------------------------------------------------------------- |
| User fields  | ✅     | `name`, `email`, `phone`, `avatar`, `emailVerified`, `phoneVerified` |
| Permissions  | ✅     | `account:read`, `account:write` on CUSTOMER role                     |
| Read API     | 🟡     | `GET /api/v1/auth/me` only — no extended profile                     |
| Update API   | ⬜     | No `PATCH` profile endpoint                                          |
| UI           | ⬜     | No profile settings page                                             |
| Sessions API | ✅     | `GET /api/v1/auth/sessions` — not in account UI (optional stretch)   |

---

## Gap summary

| Feature         | API | UI  | Blocker                     |
| --------------- | --- | --- | --------------------------- |
| Forgot password | ✅  | ⬜  | Missing page                |
| Reset password  | ✅  | ⬜  | Missing page                |
| Google login    | 🟡  | ⬜  | Callback not handled on GET |
| OTP login       | ✅  | ⬜  | Missing login flow          |
| Profile         | ⬜  | ⬜  | No PATCH API or page        |
| Address book    | ⬜  | ⬜  | No CRUD API or real page    |

---

## Sprint 1 backlog

### Phase 0 — Prerequisite (0.5–1 day, can overlap Day 1)

| ID    | Task                        | Acceptance criteria                              |
| ----- | --------------------------- | ------------------------------------------------ |
| S1-00 | Vitest `server-only` mock   | `npm run test` exit 0; CI validate green         |
| S1-01 | Add auth/account test stubs | Tests for forgot, reset, addresses, profile APIs |

---

### Phase 1 — Password recovery (Days 1–2)

| ID    | Task                                        | Files / notes                                   |
| ----- | ------------------------------------------- | ----------------------------------------------- |
| S1-10 | Forgot password page                        | `src/app/(auth)/forgot-password/page.jsx`       |
| S1-11 | Wire to `POST /api/v1/auth/forgot-password` | Match login form styling (`LoginForm` patterns) |
| S1-12 | Success state (generic message)             | No email enumeration in UI copy                 |
| S1-13 | Reset password page                         | `src/app/(auth)/reset-password/page.jsx`        |
| S1-14 | Read `token` from `searchParams`            | Validate presence; show error if missing        |
| S1-15 | Wire to `POST /api/v1/auth/reset-password`  | Password strength hints match signup            |
| S1-16 | Post-reset redirect                         | → `/login` with success toast/banner            |

**Reuse:** `BrandLogo`, auth layout gradient, `btn-premium-gold`, Zod rules from `validators/auth.ts`.

**Do not change:** Forgot/reset API behavior or token TTL.

---

### Phase 2 — Google login (Days 2–4)

| ID    | Task                    | Files / notes                                                                                                                                                                                                                              |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1-20 | Fix OAuth callback flow | **Option A (preferred):** Extend `GET /api/v1/auth/oauth/google` — if `code` query present, call `loginWithGoogle`, set cookies, redirect to `/account`. **Option B:** New `src/app/(auth)/oauth/google/callback/page.jsx` client handler. |
| S1-21 | Persist OAuth `state`   | CSRF: cookie or encrypted state param (currently `nanoid` generated but not validated on return)                                                                                                                                           |
| S1-22 | Google button on login  | `LoginForm.jsx` — link to `GET /api/v1/auth/oauth/google` or client redirect                                                                                                                                                               |
| S1-23 | Google button on signup | Optional same button with “Continue with Google”                                                                                                                                                                                           |
| S1-24 | Error handling          | Redirect to `/login?error=oauth_failed` with message                                                                                                                                                                                       |
| S1-25 | Cart merge after OAuth  | Call `mergeCartAfterLogin()` post redirect (may need callback page client script)                                                                                                                                                          |
| S1-26 | Env documentation       | Confirm `GOOGLE_REDIRECT_URI` matches Google Console                                                                                                                                                                                       |

**Security:** Validate `state` param; use existing `securityGate` on POST path; audit `OAUTH_LOGIN` already wired.

---

### Phase 3 — OTP login (Days 4–6)

| ID    | Task              | Files / notes                                                 |
| ----- | ----------------- | ------------------------------------------------------------- |
| S1-30 | Login mode toggle | Email/password vs Phone OTP tabs on `LoginForm.jsx`           |
| S1-31 | OTP request step  | Phone input → `POST /api/v1/auth/otp/request`                 |
| S1-32 | OTP verify step   | 6-digit input → `POST /api/v1/auth/otp/verify`                |
| S1-33 | Dev mode UX       | Show `devCode` when returned (non-production only)            |
| S1-34 | Resend cooldown   | 60s timer; disable resend until elapsed                       |
| S1-35 | Cart merge        | `mergeCartAfterLogin()` after OTP success                     |
| S1-36 | New user path     | OTP verify auto-creates user — show welcome state if no email |

**Do not change:** OTP hashing, rate limits, or `createOtp`/`verifyOtp` logic.

---

### Phase 4 — Profile (Days 6–8)

| ID    | Task              | Files / notes                                                                                      |
| ----- | ----------------- | -------------------------------------------------------------------------------------------------- |
| S1-40 | Profile GET API   | `GET /api/v1/account/profile` — extend `publicUser` + `phoneVerified`, `authProvider`, `createdAt` |
| S1-41 | Profile PATCH API | `PATCH /api/v1/account/profile` — `name`, `phone` (optional `avatar` URL)                          |
| S1-42 | Validation        | Zod schema; phone regex; unique phone check                                                        |
| S1-43 | Permission        | `requirePermission("account:write")`                                                               |
| S1-44 | Profile page UI   | `src/app/account/profile/page.jsx` — replace or add to nav                                         |
| S1-45 | Nav update        | Add “Profile” to `NAV_ITEMS` in `account/layout.jsx`                                               |
| S1-46 | Read-only fields  | Email shown; change-email out of scope                                                             |
| S1-47 | Audit             | `writeAudit` on profile update                                                                     |

**Stretch (if time):** Sessions list UI using existing `GET /api/v1/auth/sessions`.

---

### Phase 5 — Address book (Days 8–10)

| ID    | Task                   | Files / notes                                                                                             |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| S1-50 | Addresses list API     | `GET /api/v1/account/addresses`                                                                           |
| S1-51 | Create API             | `POST /api/v1/account/addresses`                                                                          |
| S1-52 | Update API             | `PATCH /api/v1/account/addresses/[id]`                                                                    |
| S1-53 | Delete API             | `DELETE /api/v1/account/addresses/[id]`                                                                   |
| S1-54 | Set default            | `POST .../addresses/[id]/default` or PATCH `isDefault` with txn                                           |
| S1-55 | Ownership check        | Address `userId` must match session user                                                                  |
| S1-56 | Address book page      | Replace placeholder — dedicated `account/addresses/page.jsx` (remove from `[slug]` catch-all or override) |
| S1-57 | Address form component | Indian states dropdown; pincode 6-digit validation                                                        |
| S1-58 | Empty state            | CTA to add first address                                                                                  |
| S1-59 | Default badge          | Visual indicator on default shipping address                                                              |

**Reuse:** Address field shape from subscription flow (`subscriptions/route.ts` create block).

**Consider:** `withApi` + `AppError` for new routes (incremental adoption per `ERROR_REPORT.md`).

---

## Proposed file map (new/changed)

```
src/app/(auth)/
  forgot-password/page.jsx          NEW
  reset-password/page.jsx           NEW
  oauth/google/callback/page.jsx    NEW (if Option B for Google)

src/app/(auth)/login/
  LoginForm.jsx                     MODIFY — Google, OTP tabs

src/app/account/
  profile/page.jsx                  NEW
  addresses/page.jsx                NEW (replace placeholder)
  layout.jsx                        MODIFY — nav items

src/app/api/v1/account/
  profile/route.ts                  NEW — GET, PATCH
  addresses/route.ts                NEW — GET, POST
  addresses/[id]/route.ts           NEW — PATCH, DELETE
  addresses/[id]/default/route.ts   NEW (optional)

src/app/api/v1/auth/oauth/google/
  route.ts                          MODIFY — callback on GET (Option A)

src/lib/validators/
  account.ts                        NEW — profile + address schemas

tests/
  account-profile.test.ts           NEW
  account-addresses.test.ts         NEW
  auth-ui-flows.test.ts             NEW (API-level)
```

---

## Environment dependencies

| Variable                                    | Required for                   | Sprint 1 feature       |
| ------------------------------------------- | ------------------------------ | ---------------------- |
| `DATABASE_URL`                              | All auth/account               | All                    |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`  | Sessions                       | All                    |
| `RESEND_API_KEY` + `EMAIL_FROM`             | Password reset email           | Forgot password (prod) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google OAuth                   | Google login           |
| `GOOGLE_REDIRECT_URI`                       | OAuth callback                 | Google login           |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`              | Client-side button (if needed) | Google login           |
| `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID`      | SMS OTP                        | OTP login (prod)       |
| `OTP_SALT`                                  | OTP hashing                    | OTP login              |

Dev fallbacks already exist: reset link logged, `devCode` in OTP response.

---

## Out of scope (Sprint 1)

| Item                                  | Sprint      |
| ------------------------------------- | ----------- |
| Order history UI                      | Sprint 2    |
| Checkout address step                 | Sprint 2    |
| Wishlist, wallet, coupons pages       | Later       |
| Apple Sign-In                         | Backlog     |
| Email change / verify email flow      | Later       |
| 2FA setup UI                          | Later       |
| WebAuthn / passkeys UI                | Later       |
| `withApi` migration of all 173 routes | Ongoing     |
| Prettier mass-format                  | Separate PR |
| Admin customer management             | Later       |

---

## Definition of done

### Feature acceptance

- [ ] User can request password reset from `/forgot-password` and set new password at `/reset-password?token=...`
- [ ] User can sign in with Google end-to-end (callback completes, lands on `/account`)
- [ ] User can sign in with phone OTP (request → verify → session)
- [ ] User can view and edit profile (name, phone) at `/account/profile`
- [ ] User can CRUD addresses at `/account/addresses` with one default shipping address
- [ ] All new API routes return consistent JSON errors where practical (`AppError` or existing patterns)
- [ ] Account layout nav reflects Profile + Addresses as real pages (not placeholders)

### Engineering acceptance

- [ ] `npm run typecheck` pass
- [ ] `npm run lint` — 0 errors
- [ ] `npm run test` pass (after Sprint 0.1)
- [ ] `npm run build` pass
- [ ] Manual smoke: forgot → reset → login; Google login; OTP login; profile save; address CRUD
- [ ] No regression on email login, signup, subscriptions

### Documentation

- [ ] Update `IMPLEMENTATION_CHECKLIST.md` auth + account sections
- [ ] Update `PROJECT_STATUS.md` customer/auth completion %
- [ ] Add auth flows to `docs/setup.md` env section if new vars documented

---

## Sprint 1 completion target

| Domain               | Pre-Sprint 1 | Post-Sprint 1 (target)     |
| -------------------- | ------------ | -------------------------- |
| Authentication       | 74%          | **88%**                    |
| Customer account     | 52%          | **70%**                    |
| Foundation (auth UI) | —            | Unblocks checkout Sprint 2 |

**Sprint 1 scope completion target: ~85%** of backlog items S1-10 through S1-59 (stretch items excluded).

---

## Risks and mitigations

| Risk                                 | Impact | Mitigation                                          |
| ------------------------------------ | ------ | --------------------------------------------------- |
| Google callback architecture unclear | High   | Decide Option A vs B in Day 2 spike; document in PR |
| OAuth `state` not validated          | Medium | Add cookie-based state before production            |
| OTP SMS not configured in prod       | Medium | Document MSG91 setup; dev mode for QA               |
| Resend not configured                | Medium | Dev log link for reset; document Resend             |
| Placeholder `[slug]` route conflict  | Low    | Dedicated `addresses/page.jsx` overrides catch-all  |
| Phone uniqueness on profile update   | Medium | Handle 409 conflict in PATCH API                    |
| Sprint 0.1 not done                  | Medium | Run 0.1 in parallel Day 1                           |

---

## Recommended schedule

| Day  | Focus                                         |
| ---- | --------------------------------------------- |
| 1    | Sprint 0.1 + forgot/reset password pages      |
| 2    | Reset password polish + Google callback spike |
| 3–4  | Google login button + callback + cart merge   |
| 4–5  | OTP login UI (tabs, request, verify)          |
| 6–7  | Profile API + profile page                    |
| 8–9  | Address CRUD API                              |
| 9–10 | Address book UI + testing + docs              |

---

## Architecture principles (do not rewrite)

1. **Keep existing auth stack** — JWT cookies, `securityGate`, `session-manager`, `otp.service`, `oauth.ts`
2. **Wire UI to APIs** — do not duplicate business logic in client components
3. **Match existing UI** — `LoginForm` / account layout patterns, brand tokens (`#082F63`, `#C89B3C`)
4. **Incremental error handling** — prefer `AppError` + `withApi` on **new** routes only
5. **Permissions** — use `requireUser` / `requirePermission("account:read|write")`
6. **Audit** — `writeAudit` on sensitive changes (profile, address delete)

---

## Success metrics

| Metric                               | Before           | Target                           |
| ------------------------------------ | ---------------- | -------------------------------- |
| Auth UI flows complete               | 1/5 (email only) | **5/5**                          |
| Account placeholder pages (in scope) | 2/2 placeholders | **0** (profile + addresses live) |
| Customer account completion          | 52%              | **70%**                          |
| Auth-related API routes without UI   | 4                | **0**                            |
| New API routes                       | 0                | **6–8**                          |
| New pages                            | 0                | **4–5**                          |

---

## Related documents

- [SPRINT0_REPORT.md](./SPRINT0_REPORT.md) — Prerequisite status
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Platform status
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) — Feature tracker
- [ERROR_REPORT.md](./ERROR_REPORT.md) — API error patterns for new routes
- [NEXT_SPRINT_PLAN.md](./NEXT_SPRINT_PLAN.md) — Original Sprint 0 plan

---

## Next sprint preview (Sprint 2 — not scheduled here)

After Sprint 1: **Order history UI**, **checkout address picker** (consume address book), **session management UI** — builds directly on address + profile work.

---

_Planning document only. No code changes included._
