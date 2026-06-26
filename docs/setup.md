# Setup

Local development setup for Shree Shyam Dairy Farm.

---

## Prerequisites

| Tool           | Version | Notes                                 |
| -------------- | ------- | ------------------------------------- |
| **Node.js**    | ≥ 20    | `engines.node` in `package.json`      |
| **npm**        | ≥ 10    | Comes with Node 20+                   |
| **Git**        | Latest  | With Husky hooks                      |
| **PostgreSQL** | 15+     | Local, Docker, or Neon free tier      |
| **Redis**      | 7+      | Optional locally; required for queues |

Optional: Docker Desktop (runs Postgres + Redis + app together).

---

## Quick start

```bash
# 1. Clone
git clone <repository-url>
cd shree-shyam-dairy-farm

# 2. Install dependencies (runs husky prepare)
npm install

# 3. Environment
cp .env.example .env.local
# Edit .env.local — see "Environment" section below

# 4. Database
npm run db:generate
npm run db:push          # or: npm run db:migrate
npm run db:seed
npm run db:seed-tenant

# 5. Validate config
npm run env:validate

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

### Minimum for local development

```env
APP_ENV=development
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shree_shyam

JWT_ACCESS_SECRET=dev_access_secret_min_32_characters_long
JWT_REFRESH_SECRET=dev_refresh_secret_min_32_characters_long

ADMIN_SECRET=dev_admin_secret_16c

NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_TENANT_SLUG=default

ENCRYPTION_KEY=dev_encryption_key_32_chars_00
OTP_SALT=dev_otp_salt

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_test_secret
```

### Optional (enable features)

| Variable                   | Enables                                     |
| -------------------------- | ------------------------------------------- |
| `REDIS_URL`                | Rate limiting, BullMQ queues, session cache |
| `OPENAI_API_KEY`           | AI chat, predictions, voice                 |
| `RESEND_API_KEY`           | Transactional email                         |
| `MSG91_AUTH_KEY`           | SMS OTP                                     |
| `STRIPE_SECRET_KEY`        | Tenant billing                              |
| `MQTT_BRIDGE_ENABLED=true` | Farm MQTT bridge worker                     |

Validate at any time:

```bash
npm run env:validate
```

Configuration is loaded from `src/config/` with Zod validation at startup.

---

## Database setup

### Option A — Docker Compose (recommended)

```bash
npm run docker:dev
```

Provides Postgres, Redis, and the app. Update `DATABASE_URL` in `.env.local` to match compose credentials.

### Option B — Local PostgreSQL

```bash
createdb shree_shyam
npm run db:push
npm run db:seed
npm run db:seed-tenant
```

### Option C — Neon (cloud)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the pooled connection string to `DATABASE_URL`
3. Run migrations: `npm run db:migrate`

### Prisma commands

| Command               | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate`  | Create + apply migration (dev)                |
| `npm run db:push`     | Push schema without migration file            |
| `npm run db:studio`   | Open Prisma Studio GUI                        |
| `npm run db:seed`     | Seed storefront data                          |

Module-specific seeds: see [database.md](./database.md#seeding).

---

## Redis (optional)

```bash
# Docker
docker run -d -p 6379:6379 redis:7-alpine

# .env.local
REDIS_URL=redis://localhost:6379
```

Without Redis: rate limiting falls back to in-memory; queue jobs run inline with warnings in logs.

---

## Background workers

Run in separate terminals during development:

```bash
npm run worker:queue
npm run worker:mqtt       # requires MQTT_BROKER_URL
npm run worker:webhooks
```

---

## Development scripts

| Script                 | Purpose                        |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Next.js dev server (Turbopack) |
| `npm run build`        | Production build               |
| `npm run start`        | Start production build locally |
| `npm run lint`         | ESLint                         |
| `npm run lint:fix`     | ESLint auto-fix                |
| `npm run format`       | Prettier write                 |
| `npm run format:check` | Prettier check                 |
| `npm run typecheck`    | TypeScript (`tsc --noEmit`)    |
| `npm run test`         | Vitest (all suites)            |
| `npm run test:watch`   | Vitest watch mode              |

---

## Editor setup

### VS Code / Cursor (recommended extensions)

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- EditorConfig

Settings are guided by `.editorconfig`, `.prettierrc`, and `eslint.config.mjs`. Format on save with Prettier as the default formatter.

### Git hooks

Husky runs automatically after `npm install`:

- **pre-commit** — `lint-staged` (Prettier + ESLint on staged files)
- **commit-msg** — Conventional commit validation

---

## Verify installation

```bash
npm run env:validate    # Config OK
npm run typecheck       # Types OK
npm run test            # Tests pass (148+)
npm run lint            # Lint (may warn on legacy code)
curl http://localhost:3000/api/health
```

---

## Common issues

### `prisma generate` EPERM on Windows

Close dev server and IDE Prisma extension; retry `npm run db:generate`. Non-blocking if client already exists.

### Database not configured / 503 on API routes

Set `DATABASE_URL` in `.env.local` and run `npm run db:push`.

### Redis connection refused

Set `REDIS_URL` or ignore — app degrades without Redis in development.

### Port 3000 in use

```bash
npx next dev -p 3001
```

Update `NEXT_PUBLIC_APP_URL` accordingly.

### Husky hooks not running

```bash
npm run prepare
chmod +x .husky/pre-commit .husky/commit-msg   # macOS/Linux
```

---

## Next steps

| Task                    | Document                                           |
| ----------------------- | -------------------------------------------------- |
| Understand architecture | [architecture.md](./architecture.md)               |
| Navigate the codebase   | [folder-structure.md](./folder-structure.md)       |
| Write API routes        | [api-guidelines.md](./api-guidelines.md)           |
| Coding standards        | [coding-guidelines.md](./coding-guidelines.md)     |
| Deploy to production    | [deployment.md](./deployment.md)                   |
| Farm IoT setup          | [farm-guides/setup.md](./farm-guides/setup.md)     |
| Admin features          | [admin-guides/README.md](./admin-guides/README.md) |

---

## Related

- [.env.example](../.env.example) — full environment variable reference
- [docs/README.md](./README.md) — documentation index
