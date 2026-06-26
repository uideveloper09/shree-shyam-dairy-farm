# Security Architecture

Enterprise security: JWT authentication, RBAC/ABAC authorization, audit logging, GDPR compliance, and defense-in-depth at the edge and application layers.

## Architecture

```
Client → Security Gate → Auth (JWT + Sessions) → RBAC/ABAC → API
                │                    │
         Rate Limit / Bot      Audit Log (DB)
         Geo / IP Filter       GDPR Export/Delete
```

## Authentication

| Feature         | Implementation                          |
| --------------- | --------------------------------------- |
| Email/password  | `POST /api/v1/auth/login`, `register`   |
| JWT access      | 15m TTL in `ssd_access` cookie (`jose`) |
| Refresh token   | Opaque DB token in `ssd_refresh` cookie |
| OTP phone login | `POST /api/v1/auth/otp/*`               |
| Google OAuth    | `lib/security/oauth.ts`                 |
| 2FA / TOTP      | `POST /api/v1/auth/2fa/*`               |
| WebAuthn        | `lib/mobile/biometric.ts` (mobile PWA)  |
| API keys        | `lib/api/auth.ts` (public REST API)     |
| Device keys     | `lib/farm/api-keys.ts` (IoT ingest)     |

> **Note:** `next-auth` is installed for future Auth.js migration. Production uses custom JWT. See [ADR-001](../adr/001-jwt-auth-over-authjs.md).

## Authorization

| Layer      | Module                                                   |
| ---------- | -------------------------------------------------------- |
| RBAC       | `lib/security/permissions.ts` — role → permission matrix |
| ABAC       | `lib/security/abac.ts` — ownership + attribute policies  |
| Middleware | `middleware.ts` — route protection                       |
| API gate   | `lib/security/gate.ts` — rate limit, bot, geo, IP        |

### Roles

| Role                      | Access                             |
| ------------------------- | ---------------------------------- |
| CUSTOMER                  | Own account, orders, subscriptions |
| DELIVERY                  | Delivery assignments               |
| VETERINARIAN / ACCOUNTANT | Farm read                          |
| IOT_OPERATOR              | Farm read/write                    |
| FARM_MANAGER              | Farm + security dashboard read     |
| ADMIN / OWNER             | Full permissions                   |

## Threat Controls

| Threat          | Control                                                         |
| --------------- | --------------------------------------------------------------- |
| Brute force     | 5 failed attempts → 30 min lock (`lib/security/brute-force.ts`) |
| Rate limiting   | Redis/memory per IP and per API key                             |
| Bot traffic     | User-agent heuristics + honeypot `_hp` field                    |
| XSS             | CSP (`next.config.ts`), React escaping                          |
| SQL injection   | Prisma ORM + `sanitizeSearchInput()`                            |
| Secrets at rest | AES-256-GCM for TOTP secrets (`lib/security/encryption.ts`)     |

## Audit & Compliance

| Feature            | Endpoint / UI                                  |
| ------------------ | ---------------------------------------------- |
| Audit logs         | `AuditLog` model, `GET /api/v1/security/audit` |
| GDPR export        | `GET /api/v1/account/export`                   |
| Account deletion   | `DELETE /api/v1/account`                       |
| Data retention     | `GDPR_RETENTION_DAYS` (default 365)            |
| Security dashboard | `/admin/security`                              |

## Environment Variables

```env
ENCRYPTION_KEY=32_byte_random_secret
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
API_KEY_SALT=
ACCOUNT_LOCK_ATTEMPTS=5
ACCOUNT_LOCK_MINUTES=30
BOT_DETECTION_ENABLED=true
GEO_BLOCKING_ENABLED=false
GEO_ALLOW_COUNTRIES=IN
IP_WHITELIST=
ADMIN_IP_WHITELIST=
GDPR_RETENTION_DAYS=365
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Related

- [Admin: Security Dashboard](../admin-guides/security-dashboard.md)
- [User: Account & Privacy](../user-guides/account.md)
- [Deployment](./deployment.md) — HTTPS, CSP, Nginx rate limits
