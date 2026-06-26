# Integrations Platform

Unified hub for third-party services: payments, shipping, accounting, analytics, messaging — plus webhook engine, REST API, GraphQL, SDK, and plugin system.

## Provider Catalog

| Category   | Providers                         |
| ---------- | --------------------------------- |
| Payments   | Razorpay, PhonePe, Cashfree       |
| Tax        | GST APIs                          |
| Messaging  | WhatsApp Business                 |
| Maps       | Google Maps                       |
| Platform   | Firebase                          |
| Analytics  | Google Analytics, Meta Pixel      |
| Shipping   | Shiprocket, Delhivery, India Post |
| Accounting | SAP, Tally, QuickBooks            |

## Architecture

```
Provider Adapter (lib/integrations/providers/*)
        │
        ├── Inbound Webhook Engine → IntegrationEventLog → Platform webhooks
        ├── Outbound API calls (shipping, accounting, GST)
        └── Plugin hooks (order.paid, invoice.created)
```

## Admin

`/admin/integrations` — catalog, webhook logs, plugins, API docs.

## APIs

| Endpoint                                        | Description                |
| ----------------------------------------------- | -------------------------- |
| `GET /api/v1/integrations`                      | Dashboard + catalog        |
| `POST /api/v1/integrations/connections`         | Save encrypted credentials |
| `POST /api/v1/integrations/webhooks/{provider}` | Inbound webhook router     |
| `GET /api/v1/integrations/events`               | Webhook event logs         |
| `GET/POST /api/v1/integrations/plugins`         | Plugin system              |
| `GET/POST /api/graphql`                         | GraphQL API                |
| `GET /api/public/openapi.json`                  | REST OpenAPI spec          |

## Webhook Engine

Inbound webhooks verify provider signatures, log events, and fan-out to developer webhooks:

```
POST /api/v1/integrations/webhooks/razorpay
POST /api/v1/integrations/webhooks/phonepe
POST /api/v1/integrations/webhooks/shiprocket
```

## GraphQL

```graphql
POST /api/graphql
{ "query": "{ integrationCatalog { id name configured } products { id name price } }" }
```

## REST API & SDK

- **REST:** `/api/public/v1` — see [Developer Portal](/developers)
- **SDK:** `sdk/typescript/` — `ShreeShyamClient`
- **Outbound webhooks:** Developer portal with HMAC + retries

## Plugin System

Built-in plugins (hook-based):

| Plugin             | Hook              | Action                     |
| ------------------ | ----------------- | -------------------------- |
| `order-shiprocket` | `order.paid`      | Create Shiprocket shipment |
| `invoice-tally`    | `invoice.created` | Export to Tally            |
| `analytics-ga`     | `order.paid`      | GA4 purchase event         |

```json
POST /api/v1/integrations/plugins
{ "slug": "order-shiprocket", "hook": "order.paid", "payload": { "orderNumber": "SSD-1" } }
```

## Environment Variables

```env
# Payments
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
PHONEPE_MERCHANT_ID=
PHONEPE_SALT_KEY=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=

# GST
GST_API_KEY=
GST_GSTIN=

# WhatsApp
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=

# Maps & Analytics
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_META_PIXEL_ID=
FIREBASE_PROJECT_ID=
FIREBASE_SERVER_KEY=

# Shipping
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
DELHIVERY_API_TOKEN=
INDIA_POST_API_KEY=

# Accounting
SAP_API_URL=
TALLY_SERVER_URL=
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_REALM_ID=
```

## Seed

```bash
npm run db:seed-integrations
```

## Related

- [API docs](../api/public-api.md)
- [Notifications](./notifications.md) — WhatsApp messaging
