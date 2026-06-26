# Deployment Architecture

CI/CD via GitHub Actions, containerized with Docker, optional Kubernetes, and Vercel for the current production deployment.

## CI/CD Pipeline

```
GitHub → Actions (ci.yml)
  → npm ci, prisma generate
  → lint, typecheck, test, build
  → Docker build (on push)
  → Deploy (deploy.yml on main / tags)
```

| Workflow | File                            | Trigger     |
| -------- | ------------------------------- | ----------- |
| CI       | `.github/workflows/ci.yml`      | PR + push   |
| Deploy   | `.github/workflows/deploy.yml`  | main + tags |
| Release  | `.github/workflows/release.yml` | Manual      |

### Deployment targets

- **Staging:** push to `main` → `ghcr.io/<org>/shree-shyam-dairy-farm:staging-<sha>`
- **Production:** tag `v1.2.3` → semver images + `latest`
- **Kubernetes:** `ENABLE_K8S_DEPLOY=true` + `KUBE_CONFIG_*` secrets
- **Vercel:** current live site (serverless)

## Environments

| Environment | `APP_ENV`     | Deploy trigger |
| ----------- | ------------- | -------------- |
| Development | `development` | Manual         |
| Testing     | `testing`     | CI pipeline    |
| Staging     | `staging`     | Push to `main` |
| Production  | `production`  | Tag `v*`       |

## Docker

### Development

```bash
docker compose up
# App: http://localhost:3000
# Postgres: localhost:5432
# Redis: localhost:6379
```

### Production

```bash
cp .env.example .env.production
docker compose -f docker-compose.prod.yml up -d --build
```

Stack: `app` (×2), `nginx`, `redis`, `worker-queue`, `worker-mqtt`

### Dockerfile

Multi-stage: `deps` → `builder` → `runner` with Next.js `standalone` output. Health check on `/api/health`.

## Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml   # never commit real secrets
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

| Resource   | Purpose                        |
| ---------- | ------------------------------ |
| Deployment | 2+ replicas, probes, resources |
| Service    | ClusterIP :80 → :3000          |
| Ingress    | TLS, rate limit                |
| HPA        | CPU 70% / Memory 80%, max 10   |

### Rollback

```bash
kubectl rollout undo deployment/ssd-app -n shree-shyam
```

## Nginx Load Balancer

`nginx/nginx.conf`:

- Upstream `nextjs` with `least_conn`
- Rate limiting: `30r/s` API, `100r/s` general
- WebSocket support for dev HMR / future realtime

## Monitoring

| Endpoint           | Purpose                             |
| ------------------ | ----------------------------------- |
| `GET /api/health`  | Liveness / readiness                |
| `GET /api/metrics` | Prometheus (Bearer `METRICS_TOKEN`) |

Local stack:

```bash
npm run docker:monitoring
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

## Logging & Errors

- Structured JSON: `lib/ops/logger.ts`
- `SENTRY_DSN` → structured error capture in `instrumentation.ts`
- `@sentry/nextjs` pending Next.js 16 peer support — use log aggregation meanwhile

## Backup & Recovery

```bash
npm run backup:db
npm run backup:files
./scripts/restore-db.sh backups/db/ssd_db_YYYYMMDD_HHMMSS.sql.gz
```

## Secrets Checklist

- [ ] `DATABASE_URL`
- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `REDIS_URL`
- [ ] `SENTRY_DSN`, `METRICS_TOKEN`, `CRON_SECRET`
- [ ] Storage credentials (S3/R2)

Never commit `.env.local` or `k8s/secrets.yaml` with real values.

## Related

- [System Overview](./system-overview.md)
- [Scaling](./scaling.md)
