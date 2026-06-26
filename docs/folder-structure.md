# Folder Structure

Enterprise `src/` layout for the Shree Shyam Dairy Farm monorepo. Paths use the `@/*` alias → `./src/*` (see `tsconfig.json`).

---

## Repository root

```
shree-shyam-dairy-farm/
├── src/                    # Application source (see below)
├── prisma/                 # Schema, migrations, seeds
├── public/                 # Static assets (Next.js requirement)
├── tests/                  # Vitest unit/integration tests
├── workers/                # Background worker entry points
├── scripts/                # Tooling, backups, migration scripts
├── docs/                   # Documentation
├── k8s/                    # Kubernetes manifests
├── nginx/                  # Reverse proxy config
├── monitoring/             # Prometheus / Grafana configs
├── sdk/                    # Client SDK (if published)
├── data/                   # Static JSON content (marketing copy)
├── .husky/                 # Git hooks (pre-commit, commit-msg)
├── docker-compose*.yml     # Docker stacks
├── Dockerfile              # Multi-stage production image
├── next.config.ts          # Next.js config (standalone output)
├── tsconfig.json           # TypeScript paths and includes
├── vitest.config.ts        # Test runner config
├── eslint.config.mjs       # ESLint flat config
├── commitlint.config.mjs   # Conventional commits
├── lint-staged.config.mjs  # Pre-commit staged checks
├── .prettierrc             # Formatter rules
└── .editorconfig           # Editor defaults
```

---

## `src/` application layout

```
src/
├── app/                    # Next.js App Router (routes only)
│   ├── api/                # API route handlers
│   │   ├── v1/             # Internal authenticated REST API
│   │   ├── public/         # Developer public API
│   │   ├── payment/        # Razorpay storefront endpoints
│   │   └── health/         # Health check
│   ├── admin/              # Admin dashboards (per module)
│   ├── account/            # Customer account portal
│   ├── m/                  # Mobile PWA routes
│   ├── developers/         # API developer portal
│   ├── login/ signup/      # Auth pages
│   ├── layout.jsx          # Root layout
│   ├── error.tsx           # Route error boundary
│   ├── global-error.tsx    # Root error boundary
│   └── not-found.tsx       # 404 page
│
├── components/             # Shared UI (marketing, layout, ui/)
│   └── errors/             # ErrorBoundary, ErrorFallback
│
├── features/               # Domain-specific UI + client state
│   ├── cart/               # CartContext, Zustand store
│   ├── subscription/       # Subscription UI
│   ├── tenant/             # TenantProvider, theme injector
│   ├── mobile/             # PWA components
│   ├── account/            # Account UI
│   └── providers/          # QueryProvider, etc.
│
├── services/               # Application / domain services
│   ├── crm/service.ts
│   ├── fleet/service.ts
│   ├── farm/
│   ├── mobile/
│   ├── saas/service.ts
│   ├── tenant/
│   ├── cart.ts
│   └── subscription.ts
│
├── modules/                # Domain logic (non-service)
│   ├── notifications/      # Dispatcher, channels, queue
│   ├── integrations/       # Provider adapters
│   ├── workflows/
│   ├── documents/
│   ├── crm/
│   ├── fleet/
│   ├── retail/
│   ├── processing/
│   ├── saas/
│   └── ai-platform/
│
├── repositories/           # Data access layer
│   └── prisma.ts           # Prisma singleton
│
├── lib/                    # Infrastructure & cross-cutting
│   ├── api/                # Public API auth, scopes, handlers
│   ├── security/           # Auth, permissions, audit, encryption
│   ├── ops/                # Metrics, rate limit, storage, queue
│   ├── logging/            # Pino enterprise loggers
│   ├── errors/             # AppError, API error handler
│   ├── tenant/             # Tenant resolution, i18n
│   ├── billing/
│   ├── farm/
│   ├── mobile/
│   └── validators/         # Zod schemas
│
├── config/                 # Validated environment config
│   ├── index.ts            # getConfig(), validateEnv()
│   ├── app.ts auth.ts database.ts payment.ts
│   ├── ai.ts email.ts storage.ts logging.ts
│   └── constants.ts
│
├── constants/              # Static runtime constants
│   ├── tenant.ts
│   ├── auth.ts
│   ├── tokens.js
│   └── layout.js
│
├── utils/                  # Legacy JS helpers (data, razorpay, routes)
├── hooks/                  # Shared React hooks
├── styles/                 # globals.css
├── types/                  # Shared TypeScript types
├── middleware.ts           # Edge middleware (framework file)
└── instrumentation.ts      # Node.js startup hooks
```

---

## Import conventions

| Import                  | Resolves to              | Use for                          |
| ----------------------- | ------------------------ | -------------------------------- |
| `@/app/*`               | `src/app/*`              | Rare — prefer relative in routes |
| `@/components/*`        | Shared UI                | Buttons, sections, layout        |
| `@/features/*`          | Domain UI + client state | Cart, tenant, subscription       |
| `@/services/*`          | Business orchestration   | Route → service → repository     |
| `@/modules/*`           | Domain modules           | Notifications, integrations      |
| `@/repositories/prisma` | DB client                | All Prisma access                |
| `@/lib/*`               | Infrastructure           | Security, ops, logging, errors   |
| `@/config`              | Environment config       | `getConfig()` at runtime         |
| `@/constants/*`         | Static IDs, tokens       | Cookie names, layout tokens      |
| `@/utils/*`             | Legacy helpers           | Gradual migration to TS          |

### Layering rules

```
app/api/route.ts  →  services  →  repositories  →  Prisma
                   ↘  modules (helpers)
                   ↘  lib (infra only)
```

- **Do not** import `components/` or `features/` from `services/` or `lib/`
- **Do not** access `process.env` directly in business logic — use `@/config`
- **Prefer** throwing `AppError` subclasses over ad-hoc `NextResponse.json({ error })`

---

## API route organization

```
src/app/api/v1/
├── auth/           # Login, register, OTP, 2FA, OAuth
├── account/        # Profile, GDPR
├── cart/           # E-commerce cart
├── subscriptions/  # Milk subscriptions
├── mobile/         # PWA endpoints
├── farm/           # Farm management
├── iot/            # Device data ingest
├── tenant/         # Multi-tenant admin
├── crm/            # CRM module
├── fleet/          # Fleet management
├── retail/         # POS / retail
├── processing/     # Dairy processing
├── workflows/      # Approval workflows
├── documents/      # Document management
├── notifications/  # Notification admin
├── integrations/   # Integration hub
├── ai/             # AI platform
├── saas/           # SaaS marketplace
└── developers/     # API key management
```

Each `route.ts` exports HTTP method handlers (`GET`, `POST`, etc.).

---

## Tests

```
tests/
├── env.test.ts
├── logging.test.ts
├── errors.test.ts
├── security.test.ts
├── tenant.test.ts
├── api.test.ts
└── {domain}.test.ts    # Per-module suites
```

Run: `npm run test` · Watch: `npm run test:watch`

---

## Workers

```
workers/
├── queue.worker.ts         # BullMQ consumer
├── mqtt-bridge.worker.ts # IoT MQTT bridge
└── webhook-retry.worker.ts
```

Workers import from `@/` like the main app. Run separately from the Next.js process.

---

## What stays at repo root

| Path       | Reason                      |
| ---------- | --------------------------- |
| `prisma/`  | Prisma CLI convention       |
| `public/`  | Next.js static file serving |
| `tests/`   | Vitest includes from root   |
| `workers/` | Separate Node processes     |
| `docs/`    | Documentation               |

---

## Migration notes

The project migrated from a flat Next.js root to `src/` in June 2026. See [folder-migration-summary.md](./folder-migration-summary.md) for the full path mapping.

**Known legacy:** Some duplicate nested paths (e.g. `src/app/app/`) may exist from migration — prefer the canonical paths above when adding new code.

---

## Related

- [architecture.md](./architecture.md) — layer responsibilities
- [coding-guidelines.md](./coding-guidelines.md) — naming and patterns
- [setup.md](./setup.md) — getting started
