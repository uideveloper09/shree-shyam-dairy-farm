# API Documentation

All HTTP API surfaces for the Shree Shyam Dairy Farm ERP.

## Surfaces

| Surface             | Base path                  | Auth         | Doc                                  |
| ------------------- | -------------------------- | ------------ | ------------------------------------ |
| Public REST API     | `/api/public/v1`           | API key      | [public-api.md](./public-api.md)     |
| Internal REST API   | `/api/v1`                  | JWT cookie   | [internal-api.md](./internal-api.md) |
| Storefront payments | `/api/payment`             | Session      | Razorpay integration                 |
| Storefront chat     | `/api/chat`                | Optional     | OpenAI assistant                     |
| Health              | `/api/health`              | None         | Ops probe                            |
| Metrics             | `/api/metrics`             | Bearer token | Prometheus                           |
| OpenAPI             | `/api/public/openapi.json` | None         | Machine-readable spec                |

## Interactive Docs

- **Swagger UI:** [/developers/docs](https://shree-shyam-dairy-farm.vercel.app/developers/docs)
- **Developer portal:** [/developers](https://shree-shyam-dairy-farm.vercel.app/developers)

## SDK

TypeScript SDK: `sdk/typescript/`

```typescript
import { ShreeShyamClient } from "./sdk/typescript/src";

const client = new ShreeShyamClient({
  apiKey: process.env.SSD_API_KEY!,
  baseUrl: "https://shree-shyam-dairy-farm.vercel.app",
});
```

## Versioning

- Current public version: **v1**
- Response header: `X-API-Version: v1`
- Future: `/api/public/v2` with deprecation headers

## Related

- [Backend architecture](../architecture/backend.md)
- [Security](../architecture/security.md)
