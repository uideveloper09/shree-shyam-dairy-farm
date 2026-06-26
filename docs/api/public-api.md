# Public REST API & Developer Platform

## Overview

| Component        | Path                       |
| ---------------- | -------------------------- |
| Public API v1    | `/api/public/v1/*`         |
| OpenAPI Spec     | `/api/public/openapi.json` |
| Swagger UI       | `/developers/docs`         |
| Developer Portal | `/developers`              |
| TypeScript SDK   | `sdk/typescript/`          |

## Authentication

```http
Authorization: Bearer ssd_live_xxxxxxxx
# or
X-API-Key: ssd_live_xxxxxxxx
```

Create keys at [/developers/keys](https://shree-shyam-dairy-farm.vercel.app/developers/keys) (requires login).

## API Versioning

- Current version: **v1**
- Base path: `/api/public/v1`
- Response header: `X-API-Version: v1`
- Future versions will use `/api/public/v2` with deprecation headers

## Rate Limits

| Tier       | Limit        |
| ---------- | ------------ |
| free       | 60 req/min   |
| pro        | 300 req/min  |
| enterprise | 1000 req/min |

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Endpoints

| Method | Path                    | Scope         |
| ------ | ----------------------- | ------------- |
| GET    | `/products`             | read:products |
| GET    | `/products/{id}`        | read:products |
| GET    | `/orders/{orderNumber}` | read:orders   |
| GET    | `/me`                   | read:account  |
| GET    | `/webhooks/deliveries`  | read:webhooks |

## Webhooks

### Events

`order.created`, `order.updated`, `order.delivered`, `order.cancelled`, `subscription.*`, `product.updated`, `payment.*`

### Signature verification

```
X-SSD-Event: order.created
X-SSD-Timestamp: 1710000000
X-SSD-Signature: v1={hmac_sha256(secret, timestamp + "." + raw_body)}
```

Retries: 5 attempts with exponential backoff. Worker: `npm run worker:webhooks`

## SDK

```typescript
import { ShreeShyamClient } from "./sdk/typescript/src";

const client = new ShreeShyamClient({
  apiKey: process.env.SSD_API_KEY!,
  baseUrl: "https://shree-shyam-dairy-farm.vercel.app",
});

const { data: products } = await client.products.list({ category: "milk" });
```

## Developer APIs (session auth)

| Method          | Path                               | Description                |
| --------------- | ---------------------------------- | -------------------------- |
| GET/POST        | `/api/v1/developers/account`       | Register developer account |
| GET/POST/DELETE | `/api/v1/developers/keys`          | Manage API keys            |
| GET/POST/DELETE | `/api/v1/developers/webhooks`      | Manage webhooks            |
| POST            | `/api/v1/developers/webhooks/test` | Send test event            |

## Environment

```env
API_KEY_SALT=your_random_salt_for_api_key_hashing
```

## Related

- [API Index](./README.md)
- [Security](../architecture/security.md)
- [Deployment](../architecture/deployment.md)
- [Developer Portal guide](../admin-guides/developer-portal.md)
