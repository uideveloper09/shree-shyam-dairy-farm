# Internal REST API (`/api/v1`)

Authenticated REST API for the web app, mobile PWA, farm platform, and admin dashboards. Auth via `ssd_access` JWT cookie or `Authorization: Bearer` header.

## Auth

| Method   | Path                           | Description                      |
| -------- | ------------------------------ | -------------------------------- |
| POST     | `/api/v1/auth/login`           | Email/password (+ 2FA challenge) |
| POST     | `/api/v1/auth/register`        | New account                      |
| POST     | `/api/v1/auth/refresh`         | Refresh access token             |
| POST     | `/api/v1/auth/logout`          | Revoke session                   |
| POST     | `/api/v1/auth/forgot-password` | Password reset email             |
| POST     | `/api/v1/auth/reset-password`  | Set new password                 |
| POST     | `/api/v1/auth/otp/request`     | Phone OTP                        |
| POST     | `/api/v1/auth/otp/verify`      | Verify OTP login                 |
| GET/PUT  | `/api/v1/auth/2fa/setup`       | TOTP setup                       |
| POST     | `/api/v1/auth/2fa/disable`     | Disable 2FA                      |
| GET      | `/api/v1/auth/sessions`        | List sessions                    |
| DELETE   | `/api/v1/auth/sessions/[id]`   | Revoke session                   |
| GET/POST | `/api/v1/auth/oauth/google`    | Google OAuth                     |
| GET      | `/api/v1/auth/me`              | Current user                     |

## Account & GDPR

| Method | Path                      | Description      |
| ------ | ------------------------- | ---------------- |
| GET    | `/api/v1/account/export`  | GDPR data export |
| DELETE | `/api/v1/account`         | Delete account   |
| POST   | `/api/v1/account/consent` | Update consent   |

## E-commerce

| Method                | Path                           | Description                     |
| --------------------- | ------------------------------ | ------------------------------- |
| GET/POST/PATCH/DELETE | `/api/v1/cart`                 | Cart CRUD                       |
| POST                  | `/api/v1/cart/sync`            | Merge guest cart                |
| GET/POST              | `/api/v1/subscriptions`        | Milk subscriptions              |
| PATCH                 | `/api/v1/subscriptions/[id]/*` | Pause, resume, vacation, cancel |

Storefront payments: `/api/payment/*` (Razorpay — not under v1).

## Mobile PWA

| Method    | Path                            | Description          |
| --------- | ------------------------------- | -------------------- |
| GET       | `/api/v1/mobile/config`         | PWA config           |
| GET       | `/api/v1/mobile/dashboard`      | Role dashboard data  |
| GET/PATCH | `/api/v1/mobile/delivery`       | Delivery assignments |
| POST      | `/api/v1/mobile/sync`           | Offline sync queue   |
| POST      | `/api/v1/mobile/push/subscribe` | Web Push             |
| POST      | `/api/v1/mobile/gps`            | GPS ping             |
| POST      | `/api/v1/mobile/scan`           | Barcode scan         |
| POST      | `/api/v1/mobile/camera`         | Proof photo upload   |
| GET       | `/api/v1/mobile/qr`             | QR code generation   |
| POST      | `/api/v1/mobile/biometric/*`    | WebAuthn passkeys    |

## Farm & IoT

| Method   | Path                    | Auth           | Description      |
| -------- | ----------------------- | -------------- | ---------------- |
| POST     | `/api/v1/iot/data`      | Device API key | Sensor ingest    |
| GET      | `/api/v1/mqtt/health`   | Farm role      | MQTT status      |
| GET/POST | `/api/v1/gateway`       | Gateway key    | Edge gateway     |
| GET/POST | `/api/v1/autonomy`      | Farm role      | Automation rules |
| GET/POST | `/api/v1/weather`       | Farm role      | Weather data     |
| POST     | `/api/v1/cctv/events`   | Webhook key    | CCTV events      |
| POST     | `/api/v1/vision/ingest` | Vision key     | AI vision        |
| POST     | `/api/v1/ai/chat`       | Farm role      | Farm AI chat     |
| POST     | `/api/v1/voice`         | Farm role      | Voice AI         |
| POST     | `/api/v1/agent`         | Farm role      | Farm agent       |
| POST     | `/api/v1/predictions`   | Farm role      | Predictions      |

## Security (admin)

| Method | Path                         | Description      |
| ------ | ---------------------------- | ---------------- |
| GET    | `/api/v1/security/dashboard` | Security metrics |
| GET    | `/api/v1/security/audit`     | Audit log        |

## Tenant

| Method   | Path                                        | Description                  |
| -------- | ------------------------------------------- | ---------------------------- |
| GET      | `/api/v1/tenant/config`                     | Public tenant branding/theme |
| GET/PUT  | `/api/v1/tenant/admin/branding`             | Admin branding               |
| GET/PUT  | `/api/v1/tenant/admin/theme`                | Admin theme                  |
| GET/POST | `/api/v1/tenant/admin/domains`              | Custom domains               |
| GET      | `/api/v1/tenant/admin/usage`                | Usage metering               |
| GET      | `/api/v1/tenant/admin/analytics`            | Tenant analytics             |
| POST     | `/api/v1/tenant/billing/stripe/checkout`    | Stripe checkout              |
| POST     | `/api/v1/tenant/billing/razorpay/subscribe` | Razorpay subscribe           |

## Ops

| Method | Path           | Auth            |
| ------ | -------------- | --------------- |
| GET    | `/api/health`  | Public          |
| GET    | `/api/metrics` | `METRICS_TOKEN` |

## Related

- [Public API](./public-api.md)
- [Security architecture](../architecture/security.md)
- [Farm guides](../farm-guides/setup.md)
