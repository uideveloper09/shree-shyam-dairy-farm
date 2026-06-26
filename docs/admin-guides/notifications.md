# Notification Platform

Enterprise notification system: multi-channel delivery, templates, rules engine, scheduling, queue, retry, priority, analytics, and broadcasts.

## Modules

| Module           | Implementation                                                     |
| ---------------- | ------------------------------------------------------------------ |
| Email            | `lib/notifications/channels/email.ts` — Resend API                 |
| SMS              | `lib/notifications/channels/sms.ts` — MSG91                        |
| WhatsApp         | `lib/notifications/channels/whatsapp.ts` — Meta Cloud API          |
| Push             | `lib/notifications/channels/push.ts` — Web Push (VAPID)            |
| In-App           | `lib/notifications/channels/in-app.ts` — `Notification` model      |
| Announcement     | `NotificationType.ANNOUNCEMENT` + broadcast                        |
| Broadcast        | `NotificationBroadcast` + audience filter                          |
| Templates        | `NotificationTemplate` — `{{variable}}` syntax                     |
| Scheduling       | `scheduledAt` on jobs/broadcasts; cron `/api/cron/notifications`   |
| History          | `NotificationDelivery` + user `/api/v1/notifications/history`      |
| Analytics        | `NotificationDailyAnalytics` per channel/day                       |
| Delivery Reports | `GET /api/v1/notifications/admin/deliveries`                       |
| Retry Logic      | Exponential backoff, max 5 attempts (`lib/notifications/retry.ts`) |
| Queue            | BullMQ `notification` jobs (`lib/notifications/queue.ts`)          |
| Priority         | `LOW` → `URGENT` queue weights                                     |
| Rules Engine     | `NotificationRule` — event → template → channels                   |

## Architecture

```
Event / Admin Send / Broadcast
        │
        ▼
  Rules Engine (optional)
        │
        ▼
  Template render ({{vars}})
        │
        ▼
  NotificationDelivery (per channel)
        │
        ▼
  BullMQ Queue (priority-weighted)
        │
        ▼
  Channel adapters (Email/SMS/WA/Push/In-App)
        │
        ▼
  Retry on failure · Analytics rollup
```

## Admin

`/admin/notifications` — analytics, delivery reports, templates, rules, broadcasts.

## User

`/account/notifications` — in-app inbox with unread count.

## API

| Endpoint                                          | Description                   |
| ------------------------------------------------- | ----------------------------- |
| `GET /api/v1/notifications`                       | User in-app notifications     |
| `PATCH /api/v1/notifications/[id]/read`           | Mark read                     |
| `GET /api/v1/notifications/history`               | User delivery history         |
| `GET/POST /api/v1/notifications/admin/templates`  | Templates                     |
| `GET/POST /api/v1/notifications/admin/rules`      | Rules                         |
| `GET/POST /api/v1/notifications/admin/broadcasts` | Broadcasts                    |
| `GET /api/v1/notifications/admin/analytics`       | Analytics                     |
| `GET /api/v1/notifications/admin/deliveries`      | Delivery reports              |
| `POST /api/v1/notifications/admin/send`           | Manual send or dispatch event |
| `POST /api/cron/notifications`                    | Process scheduled + retries   |

## Rules Engine Usage

```typescript
import { dispatchEvent } from "@/lib/notifications/rules";

await dispatchEvent({
  event: "order.created",
  userId: order.userId,
  payload: { name: "Ravi", orderNumber: "SSD-001", total: "299" },
});
```

## Environment

```env
RESEND_API_KEY=
EMAIL_FROM=
MSG91_AUTH_KEY=
MSG91_TEMPLATE_ID=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CRON_SECRET=
```

## Seed

```bash
npm run db:seed-notifications
```

## Related

- [Backend architecture](../architecture/backend.md)
- [Mobile PWA](../user-guides/mobile-app.md)
