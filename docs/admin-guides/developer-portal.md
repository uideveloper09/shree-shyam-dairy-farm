# Developer Portal

Admin and developer guide for the public REST API and webhook platform.

## Access

- **Portal:** [/developers](https://shree-shyam-dairy-farm.vercel.app/developers)
- **Swagger UI:** [/developers/docs](https://shree-shyam-dairy-farm.vercel.app/developers/docs)
- **OpenAPI:** `/api/public/openapi.json`

Requires login to manage keys and webhooks.

## Getting started

1. Log in with your account
2. Register a developer account at `/developers`
3. Create an API key at `/developers/keys`
4. Copy key (shown once) — prefix `ssd_live_`

## API keys

| Tier       | Rate limit   |
| ---------- | ------------ |
| free       | 60 req/min   |
| pro        | 300 req/min  |
| enterprise | 1000 req/min |

Keys are hashed at rest (`API_KEY_SALT`). Scopes control access (products, orders, webhooks).

## Webhooks

1. Add endpoint URL at `/developers/webhooks`
2. Select events (`order.created`, `payment.*`, etc.)
3. Verify signatures using HMAC-SHA256 (see [Public API](../api/public-api.md))
4. Test with `POST /api/v1/developers/webhooks/test`

Retry worker: `npm run worker:webhooks`

## TypeScript SDK

```
sdk/typescript/
```

```typescript
const client = new ShreeShyamClient({ apiKey: "ssd_live_..." });
await client.products.list();
```

## Related

- [Public API](../api/public-api.md)
- [API Index](../api/README.md)
