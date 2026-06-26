# CI/CD Report

**Date:** 2025-06-25  
**Scope:** GitHub Actions — CI (build + test), Deploy, Release  
**Files reviewed:** `.github/workflows/ci.yml`, `deploy.yml`, `release.yml`

---

## Executive summary

| Workflow    | File          | Trigger                       | Purpose                                                          |
| ----------- | ------------- | ----------------------------- | ---------------------------------------------------------------- |
| **CI**      | `ci.yml`      | PR + push → `main`, `develop` | Lint, typecheck, test, build, Docker smoke build, security audit |
| **Deploy**  | `deploy.yml`  | Push → `main`; tags `v*`      | Push image to GHCR; optional Kubernetes rollout                  |
| **Release** | `release.yml` | Manual (`workflow_dispatch`)  | Tag version, GitHub Release, optional K8s rollback               |

There is **no separate `test.yml`** — unit tests run inside the CI `validate` job.

**Predicted CI status (based on local `BUILD_VALIDATION.md`):** `validate` job would **fail** on `npm run test` due to `server-only` / Vitest. Lint, typecheck, and build would pass.

---

## Workflow inventory

```
.github/workflows/
├── ci.yml       ← Build + Test + Docker verify + Security
├── deploy.yml   ← Staging (main) + Production (v* tags)
└── release.yml  ← Manual release tagging + rollback helper
```

---

## 1. CI workflow (`ci.yml`)

### Triggers

| Event          | Branches          |
| -------------- | ----------------- |
| `pull_request` | `main`, `develop` |
| `push`         | `main`, `develop` |

### Concurrency

```yaml
group: ci-${{ github.ref }}
cancel-in-progress: true
```

In-flight runs on the same ref are cancelled when a new commit arrives — good for PR feedback speed.

### Environment

| Setting         | Value                   |
| --------------- | ----------------------- |
| Node.js         | 20                      |
| Runner          | `ubuntu-latest`         |
| Package install | `npm ci` with npm cache |

---

### Job: `validate` — Lint, Typecheck & Test

**This is the primary build + test pipeline.**

| Step       | Command                              | Blocking |
| ---------- | ------------------------------------ | -------- |
| Checkout   | `actions/checkout@v4`                | —        |
| Node setup | `actions/setup-node@v4` (cache: npm) | —        |
| Install    | `npm ci`                             | ✅       |
| Prisma     | `npx prisma generate`                | ✅       |
| Lint       | `npm run lint`                       | ✅       |
| Typecheck  | `npm run typecheck`                  | ✅       |
| Unit tests | `npm run test`                       | ✅       |
| Build      | `npm run build`                      | ✅       |

**Build step env (injected for Next.js compile):**

```yaml
DATABASE_URL: postgresql://ci:ci@localhost:5432/ci?schema=public
JWT_ACCESS_SECRET: ci_access_secret_min_32_characters_long
JWT_REFRESH_SECRET: ci_refresh_secret_min_32_characters_long
```

No Postgres service container is started — URL is a placeholder for build-time validation only (no live DB in CI).

#### Local parity

| Script              | In CI? | Local status (last validation)          |
| ------------------- | ------ | --------------------------------------- |
| `npm run lint`      | ✅     | Pass (0 errors, 53 warnings)            |
| `npm run typecheck` | ✅     | Pass                                    |
| `npm run test`      | ✅     | **Fail** — 3 test files (`server-only`) |
| `npm run build`     | ✅     | Pass                                    |

#### Not in CI (available locally)

| Script                 | Notes                                    |
| ---------------------- | ---------------------------------------- |
| `npm run format:check` | Prettier not enforced in Actions         |
| `npm run env:validate` | Zod env schema check not run             |
| `npm run commitlint`   | Only via Husky `commit-msg` hook locally |

---

### Job: `docker` — Docker Build

| Setting    | Value                                         |
| ---------- | --------------------------------------------- |
| Runs on    | `push` only (not PRs)                         |
| Depends on | `validate` must pass                          |
| Action     | `docker/build-push-action@v6`                 |
| Push       | `false` (build verification only)             |
| Tag        | `shree-shyam-dairy-farm:ci-${{ github.sha }}` |
| Cache      | GitHub Actions cache (`type=gha`)             |

Confirms `Dockerfile` multi-stage build after tests pass. Uses `node:20-alpine`, `prisma generate`, `npm run build`, `output: standalone` (see `next.config.ts`).

**Gap:** Dockerfile `builder` stage does not set `DATABASE_URL` / JWT secrets. If Next.js build ever requires them at compile time, Docker build may fail in CI while `validate` build passes (CI injects env; Dockerfile does not).

---

### Job: `security` — Security Audit

| Setting     | Value                                            |
| ----------- | ------------------------------------------------ |
| Parallel to | `validate` (no `needs:`)                         |
| Command     | `npm audit --audit-level=high`                   |
| On failure  | `continue-on-error: true` — **does not fail CI** |

Runs a redundant `npm ci` independently of `validate`.

---

## 2. Deploy workflow (`deploy.yml`)

### Triggers

| Event          | Target job          |
| -------------- | ------------------- |
| Push to `main` | `deploy-staging`    |
| Push tag `v*`  | `deploy-production` |

### Permissions

- `contents: read`
- `packages: write` (GHCR push)

### Registry

- `ghcr.io/${{ github.repository }}`
- Auth: `GITHUB_TOKEN` via `docker/login-action@v3`

---

### Job: `deploy-staging`

| Setting      | Value                                                 |
| ------------ | ----------------------------------------------------- |
| Condition    | `github.ref == 'refs/heads/main'`                     |
| Environment  | `staging` → `https://staging.shreeshyamdairyfarm.com` |
| Image tags   | `staging-<sha>`, `staging`                            |
| Docker cache | GHA cache enabled                                     |

**Kubernetes (optional):**

```yaml
if: vars.ENABLE_K8S_DEPLOY == 'true'
```

Uses `secrets.KUBE_CONFIG_STAGING` (base64) → `kubectl set image` + `rollout status` (300s timeout).

---

### Job: `deploy-production`

| Setting      | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Condition    | `startsWith(github.ref, 'refs/tags/v')`                    |
| Environment  | `production` → `https://shree-shyam-dairy-farm.vercel.app` |
| Image tags   | Semver (`1.2.3`), `major.minor`, `latest`                  |
| Docker cache | **Not configured** (unlike staging)                        |

**Kubernetes (optional):** `KUBE_CONFIG_PRODUCTION`, image tag = `github.ref_name` (e.g. `v1.2.3`).

---

### Deploy gaps

| Issue                       | Severity | Detail                                                                                                  |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| **No CI gate**              | High     | Deploy does not `needs:` CI workflow — a direct push to `main` deploys even if CI is failing or skipped |
| **No test/lint in deploy**  | High     | Deploy only builds Docker image; no `npm run test`                                                      |
| **Production URL mismatch** | Medium   | Environment URL is Vercel; workflow deploys Docker/GHCR/K8s                                             |
| **No DB migrations**        | Medium   | No `prisma migrate deploy` step in deploy                                                               |
| **Dockerfile build env**    | Medium   | Same missing secrets as CI docker job                                                                   |
| **Staging vs prod cache**   | Low      | Production build omits GHA docker cache                                                                 |

---

## 3. Test workflow

**There is no dedicated `test.yml`.**

Tests are executed in **CI → `validate` → Unit tests**:

```yaml
- name: Unit tests
  run: npm run test
```

### Test runner config (`vitest.config.ts`)

| Setting     | Value                |
| ----------- | -------------------- |
| Environment | `node`               |
| Include     | `tests/**/*.test.ts` |
| Alias       | `@` → `src/`         |

### Known failure mode

Vitest loads modules that import `server-only` (`@/lib/logging/server`, config startup path). Affected suites:

- `tests/errors.test.ts`
- `tests/logging.test.ts`
- `tests/env.test.ts` (1 assertion)

**CI will fail at the test step** until Vitest mocks `server-only` or test imports are adjusted.

### Test inventory

18 test files under `tests/` (fleet, workflows, retail, security, env, documents, api, tenant, etc.). Last local run: **124/125 passed**, 3 files failed to load.

---

## 4. Release workflow (`release.yml`)

### Trigger

Manual only: `workflow_dispatch`

### Inputs

| Input      | Type              | Purpose                              |
| ---------- | ----------------- | ------------------------------------ |
| `version`  | string (required) | Semver without `v` prefix            |
| `rollback` | boolean           | Skip tag; run `kubectl rollout undo` |

### Flow (normal release)

1. Checkout with full history (`fetch-depth: 0`)
2. Create annotated tag `v{version}` and push to `origin`
3. `softprops/action-gh-release@v2` with generated release notes

**Side effect:** Pushing the tag triggers **`deploy.yml` → `deploy-production`**.

### Flow (rollback)

```bash
kubectl rollout undo deployment/ssd-app -n shree-shyam
kubectl rollout status ... --timeout=300s
```

Requires `KUBE_CONFIG_PRODUCTION` secret. No `ENABLE_K8S_DEPLOY` guard (unlike deploy.yml).

---

## Pipeline diagram

```
                    ┌─────────────────────────────────────┐
                    │  PR / push (main, develop)          │
                    └─────────────────┬───────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ci.yml                                                                  │
│  ┌──────────────────────┐    ┌─────────────────┐                        │
│  │ validate             │    │ security        │  (parallel)             │
│  │ lint→typecheck→     │    │ npm audit       │  continue-on-error      │
│  │ test→build           │    └─────────────────┘                        │
│  └──────────┬───────────┘                                               │
│             │ needs (push only)                                         │
│             ▼                                                           │
│  ┌──────────────────────┐                                               │
│  │ docker (no push)     │                                               │
│  └──────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘

  push main ──────────────────────────────► deploy.yml → staging (GHCR + K8s?)
  tag v*    ──► release.yml (manual tag) ──► deploy.yml → production

  ⚠ Deploy is NOT gated on CI success
```

---

## Action versions

| Action                        | Version | Used in    |
| ----------------------------- | ------- | ---------- |
| `actions/checkout`            | v4      | All        |
| `actions/setup-node`          | v4      | CI         |
| `docker/setup-buildx-action`  | v3      | CI, Deploy |
| `docker/build-push-action`    | v6      | CI, Deploy |
| `docker/login-action`         | v3      | Deploy     |
| `docker/metadata-action`      | v5      | Deploy     |
| `softprops/action-gh-release` | v2      | Release    |

Versions are current-generation (2024–2025).

---

## Secrets & variables reference

| Name                     | Type                | Workflow        | Purpose                                |
| ------------------------ | ------------------- | --------------- | -------------------------------------- |
| `GITHUB_TOKEN`           | Auto                | Deploy          | GHCR login                             |
| `KUBE_CONFIG_STAGING`    | Secret              | Deploy, Release | Staging cluster kubeconfig (base64)    |
| `KUBE_CONFIG_PRODUCTION` | Secret              | Deploy, Release | Production cluster kubeconfig (base64) |
| `ENABLE_K8S_DEPLOY`      | Repository variable | Deploy          | Gate kubectl steps (`'true'`)          |

---

## Local hooks vs CI

| Check                 | Husky / lint-staged       | CI                  |
| --------------------- | ------------------------- | ------------------- |
| ESLint (staged files) | `pre-commit`              | Full `npm run lint` |
| Commit message format | `commit-msg` → commitlint | Not in Actions      |
| Tests                 | Not pre-push              | `npm run test`      |
| Build                 | Not pre-push              | `npm run build`     |

---

## Recommendations (not implemented)

| Priority | Item                                                                      |
| -------- | ------------------------------------------------------------------------- |
| **P0**   | Fix Vitest `server-only` mock so `npm run test` passes in CI              |
| **P0**   | Gate `deploy.yml` on CI success (`workflow_run` or required status check) |
| **P1**   | Add `DATABASE_URL` + JWT secrets to Dockerfile build stage (match CI)     |
| **P1**   | Add `prisma migrate deploy` to deploy workflow post-image-push            |
| **P2**   | Run `npm run format:check` in CI                                          |
| **P2**   | Remove `continue-on-error` from `npm audit` after dependency cleanup      |
| **P2**   | Align production environment URL with actual host (K8s vs Vercel)         |
| **P3**   | Add GHA cache to production Docker build                                  |
| **P3**   | Run `docker` job on PRs (build-only) for earlier Dockerfile feedback      |

---

## Verdict

| Workflow              | Assessment                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------- |
| **CI (build + test)** | Well-structured single `validate` job with correct order; **tests currently block green CI** |
| **Test**              | Embedded in CI — no standalone workflow; adequate for project size                           |
| **Deploy**            | Functional GHCR + optional K8s pattern; **missing CI dependency and migration steps**        |
| **Release**           | Clean manual tagging → triggers production deploy                                            |

The CI pipeline design matches `docs/deployment.md`. The main risks are **failing tests in Actions**, **deploy without CI gate**, and **Dockerfile/CI env parity** for production builds.

---

## Related docs

- [docs/deployment.md](docs/deployment.md) — CI/CD section
- [BUILD_VALIDATION.md](BUILD_VALIDATION.md) — Local lint/typecheck/test/build results
- [Dockerfile](Dockerfile) — Multi-stage production image
