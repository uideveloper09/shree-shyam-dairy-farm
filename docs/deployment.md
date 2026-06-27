# Deployment

Deployment runbooks for Shree Shyam Dairy Farm — Vercel (current production), Docker Compose, and optional Kubernetes.

---

## Environments

| Environment | `APP_ENV`     | `NODE_ENV`    | Purpose                   |
| ----------- | ------------- | ------------- | ------------------------- |
| Development | `development` | `development` | Local machine             |
| Testing     | `testing`     | `test`        | CI pipeline               |
| Staging     | `staging`     | `production`  | Pre-production validation |
| Production  | `production`  | `production`  | Live traffic              |

Validate configuration before deploy:

```bash
npm run env:validate
```

---

## Production checklist

### Required environment variables

| Variable                 | Purpose                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection                                                                         |
| `JWT_ACCESS_SECRET`      | JWT signing (≥ 32 chars)                                                                      |
| `JWT_REFRESH_SECRET`     | Refresh token signing (≥ 32 chars)                                                            |
| `ADMIN_SECRET`           | Admin API protection (≥ 16 chars)                                                             |
| `NEXT_PUBLIC_APP_URL`    | Canonical **website** HTTPS URL (emails, OAuth, Stripe). API is same-origin: `{url}/api/v1/*` |
| `NEXT_PUBLIC_APP_DOMAIN` | Hostname for tenant subdomains (e.g. `farm1.kunwardairy.com`)                                 |
| `ENCRYPTION_KEY`         | Credential encryption (32 chars)                                                              |

### Recommended

| Variable                                              | Purpose                     |
| ----------------------------------------------------- | --------------------------- |
| `REDIS_URL`                                           | Cache, rate limits, BullMQ  |
| `RAZORPAY_KEY_SECRET` + `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Payments                    |
| `RESEND_API_KEY` + `EMAIL_FROM`                       | Transactional email         |
| `CRON_SECRET`                                         | Scheduled job auth          |
| `METRICS_TOKEN`                                       | Metrics endpoint protection |
| `LOG_LEVEL`                                           | `info` in production        |

Full list: `.env.example`

---

## Vercel (current production)

**URL:** [kunwardairy.com](https://kunwardairy.com)

### Setup

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard (all production-required vars)
3. Build command: `npm run build` (runs `prisma generate` + Next.js build)
4. Output: Next.js default (not standalone on Vercel)

### Notes

- Use Neon **pooled** connection string for `DATABASE_URL`
- `REDIS_URL` — use Upstash Redis or similar for serverless-compatible Redis
- Workers (`queue`, `mqtt`, `webhooks`) run as **separate processes** — deploy to Railway, Fly.io, or a VPS; they do not run on Vercel serverless
- `instrumentation.ts` validates config on cold start

### Deploy

```bash
git push origin main   # Auto-deploy if CI connected
# or
vercel --prod
```

---

## Docker

### Development stack

```bash
npm run docker:dev
# App:     http://localhost:3000
# Postgres: localhost:5432
# Redis:    localhost:6379
```

Uses `docker-compose.yml`.

### Production stack

```bash
# Create production env file
cp .env.example .env.production
# Edit .env.production with production values

npm run docker:prod
```

`docker-compose.prod.yml` includes:

| Service        | Role                                   |
| -------------- | -------------------------------------- |
| `app`          | Next.js (2 replicas, standalone image) |
| `nginx`        | TLS termination, reverse proxy         |
| `redis`        | Cache + queue backend                  |
| `worker-queue` | BullMQ consumer                        |
| `worker-mqtt`  | MQTT bridge (if enabled)               |

### Build image manually

```bash
docker build -t shree-shyam-dairy-farm:latest .
docker run -p 3000:3000 --env-file .env.production shree-shyam-dairy-farm:latest
```

The `Dockerfile` uses multi-stage build:

1. **deps** — `npm ci`
2. **builder** — `prisma generate` + `npm run build`
3. **runner** — standalone Next.js output, non-root user, health check on `/api/health`

---

## Kubernetes (optional)

Manifests in `k8s/`:

```bash
kubectl apply -f k8s/
```

Enable in CI with `ENABLE_K8S_DEPLOY=true` and `KUBE_CONFIG_*` secrets (see `.github/workflows/deploy.yml`).

Scaling: [architecture/scaling.md](./architecture/scaling.md)

---

## CI/CD

GitHub Actions workflows:

| Workflow | File                            | Trigger               |
| -------- | ------------------------------- | --------------------- |
| CI       | `.github/workflows/ci.yml`      | PR + push             |
| Deploy   | `.github/workflows/deploy.yml`  | `main` + version tags |
| Release  | `.github/workflows/release.yml` | Manual                |

### CI pipeline

```
npm ci → prisma generate → lint → typecheck → test → build
```

### Image tags

- `main` push → `staging-<sha>`
- Tag `v1.2.3` → `1.2.3` + `latest`

---

## Database migrations (production)

```bash
# On deploy host or CI migration step
npx prisma migrate deploy
```

Never use `db:push` in production. Always use versioned migrations.

### Rollback

1. Redeploy previous application image
2. Restore DB from backup if migration was destructive:
   ```bash
   ./scripts/restore-db.sh backups/db/ssd_db_YYYYMMDD.sql.gz
   ```

---

## Workers

Run as separate containers/processes in production:

```bash
npm run worker:queue
npm run worker:mqtt      # if MQTT_BRIDGE_ENABLED=true
npm run worker:webhooks
```

Each worker needs the same `DATABASE_URL`, `REDIS_URL`, and relevant secrets as the web app.

---

## Monitoring

### Health check

```bash
curl https://your-domain/api/health
```

Docker `HEALTHCHECK` polls this endpoint every 30s.

### Metrics

Prometheus-format metrics (token-protected):

```bash
curl -H "Authorization: Bearer $METRICS_TOKEN" https://your-domain/api/metrics
```

### Monitoring stack

```bash
npm run docker:monitoring
```

Uses `docker-compose.monitoring.yml` (Prometheus + Grafana configs in `monitoring/`).

### Logging

Production: JSON logs to stdout (Pino). Optional file logging:

```env
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/var/log/ssd/app.log
```

Pair with logrotate — see `src/lib/logging/rotation.ts`.

---

## Backups

```bash
# Database
npm run backup:db

# Uploaded files
npm run backup:files
```

Schedule via cron on the host or a CI scheduled workflow. Retention: 30 days (configurable in backup scripts).

---

## SSL / CDN

- **Vercel** — automatic TLS
- **Self-hosted** — terminate TLS at Nginx (`nginx/ssl/`) or Cloudflare
- Set `NEXT_PUBLIC_APP_URL=https://kunwardairy.com` and `NEXT_PUBLIC_APP_DOMAIN=kunwardairy.com`
- API routes remain same-origin: `https://kunwardairy.com/api/v1/*` (no `api.kunwardairy.com`)

---

## Rollout strategy

1. Deploy to staging; run smoke tests
2. Run `prisma migrate deploy` on staging DB
3. Verify `/api/health`, login, checkout, admin dashboard
4. Deploy to production (blue/green via K8s or rolling Docker update)
5. Monitor error logs and metrics for 15 minutes

---

## Related

- [setup.md](./setup.md) — local development
- [architecture/deployment.md](./architecture/deployment.md) — extended deployment architecture
- [architecture/scaling.md](./architecture/scaling.md) — horizontal scaling
- [devops.md](./devops.md) → redirects here
