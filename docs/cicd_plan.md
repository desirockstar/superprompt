# CI/CD Deployment Plan — SuperPrompt

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TRIGGER: PUSH / PR (any branch)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                            │                                                │
│         ┌──────────────────┴──────────────────┐                             │
│         ▼                                   ▼                              │
│    ┌──────────┐                     ┌──────────────┐                      │
│    │   CI   │                     │ Dev Deploy  │                      │
│    │ lint   │                     │ Vercel     │                      │
│    │ type   │                     │ Render    │                      │
│    │ test   │                     │           │                      │
│    │ build  │                     │           │                      │
│    │ secret│                     │           │                      │
│    └───────┘                     └──────────────┘                      │
│                                                      RUNS PARALLEL
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        TRIGGER: MANUAL (workflow_dispatch)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│    ┌──────────────────────────────────────────────────┐                       │
│    │              Security Scan Manual                 │                       │
│    │  (dependencies, containers, SAST, secrets) │                       │
│    └──────────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      TRIGGER: GIT TAG (v*)                                │
├────────────────────────────────────���────────────────────────────────────────┤
│                              │                                              │
│    ┌─────────────────────────┴───────────────────────┐                          │
│    ▼                                            ▼                           │
│    │                                     ┌──────────────┐                   │
│    │                                ┌────│Security Scan│                  │
│    │                                │    │ (within 24h)  │    │           │
│    │                                │    └──────────────┘    │           │
│    ▼                                │           │               ▼           │
│ ┌──────────────┐                     │           └──────────────►Prod Deploy │
│ │Prod Deploy  │                     │                                │          │
│ │Cloudflare  │                      │                                │          │
│ │Oracle VM   │                      │                                │          │
│ ├───────────┤                      │                                │          │
│ │requires CI│◄──────────────────┴────────────────                 │          │
│ │requires  │                                                     │          │
│ │Sec Scan │                                                     │          │
│ │ (24h)   │                                                     │          │
│ └─────────┴─────────────────────────────────────────────────────────►           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Architecture

| Environment | Frontend | Backend | Database | Trigger |
|---|---|---|---|---|
| **Dev** | Vercel (preview) | Render (Docker) | Neon | Branch push |
| **Prod** | Cloudflare Pages | Oracle VM (Docker) | Oracle Docker | Git tag (`v*`) |

---

## Security Requirements

- All secrets stored in GitHub repository secrets (never in code)
- Secret detection: GitHub native + TruffleHog in CI
- Container scanning: Trivy in Security Scan workflow
- SAST: Semgrep in Security Scan workflow
- Production requires: successful CI + successful Security Scan (within 24h)

---

## NestJS Security Requirements

Required packages: `@nestjs/throttler`, `helmet`, `class-validator`, `class-transformer`

Required middleware:
- Helmet (security headers)
- CORS (restricted origin)
- Rate limiting (throttler)
- Global validation pipe (DTO whitelist)

---

## Next.js Security Requirements

- Disable source maps in production
- Security headers (X-Content-Type-Options, X-Frame-Options)
- Only expose `NEXT_PUBLIC_*` variables to client

---

## Backup Strategy

- Daily `pg_dump` via cron
- Retention: 7 daily + 4 weekly
- Storage: Oracle Object Storage (or local)

---

## Security Hardening (Oracle VM)

- SSH key-only (no password)
- Fail2ban for brute-force prevention
- UFW firewall (80, 443, SSH only)
- Non-root Docker containers

---

## GitHub Secrets Matrix

| Secret | Dev | Prod | Purpose |
|---|---|---|---|
| `VERCEL_TOKEN` | ✅ | — | Vercel API |
| `VERCEL_ORG_ID` | ✅ | — | Vercel org |
| `VERCEL_PROJECT_ID` | ✅ | — | Vercel project |
| `VERCEL_DEV_ENVIRONMENT` | ✅ | — | Vercel env vars |
| `RENDER_SERVICE_ID_DEV` | ✅ | — | Render service |
| `RENDER_API_KEY` | ✅ | — | Render API |
| `DOCKER_HUB_USERNAME` | ✅ | ✅ | Docker registry |
| `DOCKER_HUB_TOKEN` | ✅ | ✅ | Docker auth |
| `CLOUDFLARE_API_TOKEN` | — | ✅ | Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | — | ✅ | Cloudflare account |
| `SSH_PRIVATE_KEY` | — | ✅ | Oracle SSH |
| `SSH_HOST` | — | ✅ | Oracle host |
| `ORACLE_DATABASE_URL` | — | ✅ | PostgreSQL |
| `JWT_SECRET_PROD` | — | ✅ | JWT secret |
| `CORS_ORIGIN_PROD` | — | ✅ | CORS origin |

---

# Implementation Phases

---

## Phase 1: Core CI/CD Pipeline

### Story CI-001: CI Workflow
As a developer, I want every push/PR to main branch to run validation checks, so that we block merging broken code.

**Tasks:**
- [ ] CI workflow exists in `.github/workflows/ci.yml`
- [ ] Runs on `push` (main) and `pull_request` (main)
- [ ] Includes: lint → typecheck → test → build
- [ ] Includes: secrets scan (TruffleHog)
- [ ] Blocks merge on failure

### Story CI-002: Dev Deploy Workflow
As a developer, I want every branch push to deploy preview URLs, so that we can test changes in the cloud.

**Tasks:**
- [ ] Dev Deploy workflow exists in `.github/workflows/dev-deploy.yml`
- [ ] Runs on push (any branch except tags)
- [ ] Deploys frontend to Vercel preview
- [ ] Deploys backend to Render
- [ ] Runs in parallel with CI (no dependencies)

### Story CI-003: Prod Deploy Workflow
As a release manager, I want production deployment to happen only on git tags, so that releases are controlled.

**Tasks:**
- [ ] Prod Deploy workflow exists in `.github/workflows/deploy.yml`
- [ ] Runs on git tag (`v*`)
- [ ] Deploys frontend to Cloudflare Pages
- [ ] Deploys backend to Oracle VM via SSH
- [ ] Requires CI passed
- [ ] Requires Security Scan passed (within 24h)

### Story CI-004: Security Scan Workflow
As a security engineer, I want manual security scanning capability, so that we can run deep scans on demand.

**Tasks:**
- [ ] Security Scan workflow exists in `.github/workflows/security-scan.yml`
- [ ] Triggered via `workflow_dispatch` (manual)
- [ ] Scan options: full, dependencies, containers, sast, secrets
- [ ] Includes: npm audit, Trivy, Semgrep, TruffleHog
- [ ] Uploads reports as artifacts

### Story CI-005: Docker Configuration
As a platform engineer, I want identical Docker builds across dev and prod, so that we avoid environment drift.

**Tasks:**
- [ ] Create `apps/backend/Dockerfile`
- [ ] Multi-stage build (builder + runner)
- [ ] Non-root user in runtime stage
- [ ] Production-ready configuration

---

## Phase 2: Oracle Infrastructure

### Story ORACLE-001: Docker Compose for Oracle
As a platform engineer, I want Docker Compose configuration for Oracle VM, so that we can run PostgreSQL + Backend + Caddy together.

**Tasks:**
- [ ] Create `oracle-deploy/docker-compose.yml`
- [ ] Services: db (PostgreSQL), backend, caddy
- [ ] Network configuration
- [ ] Volume configuration

### Story ORACLE-002: Caddy Configuration
As a platform engineer, I want Caddy reverse proxy configuration, so that we have automatic HTTPS.

**Tasks:**
- [ ] Create `oracle-deploy/Caddyfile`
- [ ] HTTPS automatic setup
- [ ] Reverse proxy to backend
- [ ] Frontend static serving

### Story ORACLE-003: Backup Script
As a platform engineer, I want automated backup scripts, so that we don't lose data.

**Tasks:**
- [ ] Create `oracle-deploy/backup.sh`
- [ ] Daily pg_dump execution
- [ ] Retention policy (7 daily)
- [ ] Upload to Oracle Object Storage

---

## Phase 3: Security Hardening

### Story SEC-001: NestJS Security Middleware
As a backend engineer, I want security middleware in NestJS, so that the API is protected.

**Tasks:**
- [ ] Install `@nestjs/throttler`
- [ ] Install `helmet`
- [ ] Add CORS configuration
- [ ] Add global validation pipe

### Story SEC-002: Next.js Security Headers
As a frontend engineer, I want security headers in Next.js, so that the app is protected.

**Tasks:**
- [ ] Update `next.config.js`
- [ ] Disable production source maps
- [ ] Add security headers
- [ ] Sanitize env vars exposure

---

## Phase 4: GitHub Secrets Setup

### Story SECRETS-001: Repository Secrets
As a platform engineer, I want all required secrets configured in GitHub, so that workflows can authenticate.

**Tasks:**
- [ ] Configure Vercel secrets (token, org, project)
- [ ] Configure Render secrets (service ID, API key)
- [ ] Configure Docker Hub secrets
- [ ] Configure Cloudflare secrets
- [ ] Configure Oracle secrets (SSH, DB, JWT)

---

## Phase 5: Integration & Testing

### Story INT-001: End-to-End Pipeline Test
As a platform engineer, I want to test the full pipeline, so that deployment works as expected.

**Tasks:**
- [ ] Test CI on push to feature branch
- [ ] Test Dev Deploy preview URL generation
- [ ] Test Security Scan manual trigger
- [ ] Test production deployment (dry run)

---

## Phase 6: Infrastructure Automation

### Story INFRA-001: Infra Tools Container
As a platform engineer, I want all tooling in containers, so that there's no local environment drift.

**Tasks:**
- [ ] Create `infra/tools/Dockerfile`
- [ ] Create `infra/tools/docker-compose.yml`
- [ ] Include: Node.js 22, pnpm, gh CLI, vercel CLI, curl, jq, bash

### Story INFRA-002: Bootstrap Script
As a platform engineer, I want automated provisioning, so that infra setup is reproducible.

**Tasks:**
- [ ] Create `infra/scripts/bootstrap-infra.ts`
- [ ] Provision Neon project → get connection string
- [ ] Link Vercel project → get project ID
- [ ] Link Render service → get service ID
- [ ] Generate `.env` with all credentials
- [ ] Sync secrets to GitHub Actions

### Story INFRA-003: Environment Template
As a platform engineer, I want a template for environment variables, so that setup is documented.

**Tasks:**
- [ ] Create `infra/templates/.env.template`
- [ ] Document all required variables
- [ ] Include placeholders for secrets

---

# Usage

## Start Infra Shell

```bash
docker compose -f infra/tools/docker-compose.yml run --rm infra bash
```

## Run Bootstrap

```bash
pnpm tsx infra/scripts/bootstrap-infra.ts
```

## Workflow

```
1. Copy .env.template to .env
2. Fill in your API keys
3. Run bootstrap inside infra container
4. Secrets sync to GitHub automatically
5. Dev Deploy triggers on branch push
```

---

# Directory Structure

```
infra/
├── tools/
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/
│   └── bootstrap-infra.ts
├── templates/
│   └── .env.template
└── outputs/
    └── infra-outputs.json
```

---

# References

- AGENTS.md — Tech stack and architecture
- BRD1.md — Business requirements
- build_blueprint.md — Implementation guide