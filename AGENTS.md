# AGENTS.md — SuperPrompt Coding Agent Specification

> **MANDATORY**: Every coding agent, AI assistant, or automated tool working on this repository MUST read and follow this document in full before writing a single line of code. This is the authoritative source of truth for all implementation decisions.

---

## 1. Project Identity

**Name:** SuperPrompt  
**Type:** AI prompt discovery and marketplace platform  
**Architecture:** Web-first, monolith backend, SSR frontend  
**Stage:** MVP build — production-executable specification  
**BRD Source of Truth:** `docs/BRD1.md` (v6 Master)

---

## 2. Monorepo Structure

The repository follows a strict pnpm workspace layout. Do not deviate.

```
superprompt/
├── apps/
│   ├── frontend/          # Next.js
│   └── backend/           # NestJS
├── packages/
│   ├── db/                # Drizzle schema + migrations
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared helpers
├── infra/
│   ├── docker/
│   └── scripts/
├── .devcontainer/
│   ├── devcontainer.json  # VS Code devcontainer config
│   └── Dockerfile         # Dev image
├── .env
├── docker-compose.yml
├── pnpm-workspace.yaml
└── AGENTS.md              # This file
```

**Rules:**
- Package manager is **pnpm** exclusively. Never use npm or yarn.
- All cross-package imports use workspace protocol: `"@superprompt/db": "workspace:*"`
- Never place business logic in `packages/utils`. It is for pure helpers only.

---

## 2.1 Development Environment Rules

> These rules apply to every agent, developer, and automated tool without exception.

**No local installation of any kind.** Every service, runtime, and tool runs inside Docker. Nothing is installed directly on the host machine.

**Docker is the only runtime environment:**
- All services (PostgreSQL, backend, frontend) run via `docker-compose`
- All development work happens inside the devcontainer defined in `.devcontainer/`
- The devcontainer image includes Node.js, pnpm, and all required CLI tools
- Do not install Node, pnpm, or any CLI tool on the host; use the devcontainer

**Devcontainer is mandatory for development:**
- Open the repository in VS Code and use "Reopen in Container"
- The `.devcontainer/devcontainer.json` defines the complete dev environment
- All `pnpm` commands, migrations, and scripts must be run inside the container
- Port forwarding for frontend (3000), backend (4000), and PostgreSQL (5432) is configured in `devcontainer.json`

### .devcontainer Files

Create these files in `.devcontainer/`:
- `devcontainer.json` - VS Code devcontainer config
- `docker-compose.yml` - Dev environment services
- `Dockerfile` - Dev container image

**No new dependencies or tools without explicit approval:**
- Do not add any new npm package, system package, or Docker image without prior approval
- Do not modify `Dockerfile`, `docker-compose.yml`, or `.devcontainer/devcontainer.json` without approval
- Any proposed dependency addition must state: what it is, why it is needed, and what it replaces
- Approval is required before the change lands in any commit

**docker-compose is the source of truth for service configuration:**
- PostgreSQL, backend, and frontend are all defined as services in `docker-compose.yml`
- No service should be started outside of docker-compose (e.g., no `pg_ctl start` on host)
- Environment variables are injected via the `.env` file mounted into containers

---

## 3. Tech Stack (Final — No Deviations)

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | Next.js (App Router) | SSR + CSR as needed |
| Frontend styling | Tailwind CSS | No other CSS frameworks |
| Frontend UI components | shadcn/ui | Do not add other component libraries |
| Frontend state — server | TanStack Query (React Query v5) | For all API calls + caching |
| Frontend state — UI | React `useState` / `useReducer` | For local component state |
| Frontend state — global | Zustand | Only for auth session + light global state |
| Backend framework | NestJS | Monolith. No microservices. |
| Database | PostgreSQL | |
| ORM | Drizzle ORM | No Prisma, no TypeORM |
| Auth | BetterAuth | Email/password + Google + GitHub OAuth |
| Payments | Stripe | Subscriptions only |
| AI provider | Groq | See Section 9 |
| Ad network (MVP) | Google AdMob | Rewarded ads only |
| Search | PostgreSQL Full-Text Search (`tsvector`) | No Meilisearch, no Elasticsearch, no `ILIKE` |
| File storage | Local filesystem | Single: `{id}/v{n}/prompt.md` · Multi: `{id}/v{n}/content/{tier}.md` |
| Cache | In-memory `Map` with TTL | No Redis. `CacheService` in `modules/cache/` |
| Analytics | PostHog Cloud | `posthog-js` on frontend. See Section 15.3 |
| Logger | pino | Backend only |
| Error monitoring | Sentry | Both frontend and backend |
| CI/CD | GitHub Actions | See Section 13 |
| Deployment | Oracle VM via SSH + docker-compose | |
| Testing — unit | Vitest | |
| Testing — integration | Supertest | |
| Testing — E2E | Playwright | |

**Prohibited technologies (do not introduce):**
- Redis, Meilisearch, Elasticsearch
- Prisma, TypeORM, Sequelize
- Redux, MobX
- npm, yarn
- In-platform AI prompt execution
- S3 (deferred to post-MVP)
- Any locally installed runtime, tool, or service outside the devcontainer or docker-compose
- Any new package or dependency not yet approved (see Section 2.1)

---

## 4. Database Schema

All tables are implemented using Drizzle ORM in `packages/db/schema.ts`. This is the complete, authoritative schema.

### 4.1 Enums

```ts
export const promptStatusEnum = pgEnum('prompt_status', ['pending', 'approved', 'rejected']);
export const promptLevelEnum = pgEnum('prompt_level', ['starter', 'builder', 'pro', 'super']);
export const unlockMethodEnum = pgEnum('unlock_method', ['ad', 'subscription']);
export const gradingTriggerEnum = pgEnum('grading_trigger', ['system', 'admin']);
```

### 4.2 Tables

```ts
// users
users(
  id: uuid PK,
  email: text UNIQUE NOT NULL,
  password_hash: text,
  is_admin: boolean DEFAULT false,
  stripe_customer_id: text,
  created_at: timestamptz DEFAULT now()
)

// sessions (managed by BetterAuth)
sessions(
  id: uuid PK,
  user_id: uuid FK → users.id,
  expires_at: timestamptz NOT NULL
)

// prompts
prompts(
  id: uuid PK,
  title: text NOT NULL,
  category: text NOT NULL,
  status: prompt_status DEFAULT 'pending',
  base_path: text NOT NULL,
  current_version: integer DEFAULT 1,
  is_multi_version: boolean DEFAULT false,
  preview: text,                         -- first ~220 chars of body, stored at ingest
  primary_tag: text,
  secondary_tags: text,
  views: integer DEFAULT 0,
  is_viral: boolean DEFAULT false,
  is_nano: boolean DEFAULT false,
  search_vector: tsvector,               -- populated via trigger
  created_at: timestamptz DEFAULT now()
)
-- indexes: idx_prompts_category, idx_prompts_status, idx_prompts_search (GIN on search_vector)

// prompt_versions
prompt_versions(
  id: uuid PK,
  prompt_id: uuid FK → prompts.id,
  version_number: integer NOT NULL,
  needs_grading: boolean DEFAULT true,
  created_at: timestamptz DEFAULT now()
)

// prompt_version_files
prompt_version_files(
  id: uuid PK,
  prompt_version_id: uuid FK → prompt_versions.id,
  level: prompt_level NOT NULL,
  file_name: text NOT NULL
)

// ratings
ratings(
  id: uuid PK,
  user_id: uuid FK → users.id,
  prompt_id: uuid FK → prompts.id,
  rating: integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at: timestamptz DEFAULT now(),
  UNIQUE (user_id, prompt_id)
)

// unlocks
unlocks(
  id: uuid PK,
  user_id: uuid FK → users.id,
  prompt_id: uuid FK → prompts.id,
  unlocked_via: unlock_method NOT NULL,
  created_at: timestamptz DEFAULT now(),
  UNIQUE (user_id, prompt_id)           -- permanent, enforced at DB level
)

// subscriptions
subscriptions(
  id: uuid PK,
  user_id: uuid FK → users.id,
  status: text NOT NULL,               -- 'active' | 'canceled' | 'past_due'
  stripe_subscription_id: text,
  expires_at: timestamptz
)

// grading_jobs
grading_jobs(
  id: uuid PK,
  status: text NOT NULL,               -- 'pending' | 'running' | 'done' | 'failed'
  triggered_by: grading_trigger NOT NULL,
  created_at: timestamptz DEFAULT now()
)

// grading_history
grading_history(
  id: uuid PK,
  prompt_version_id: uuid FK → prompt_versions.id,
  score: jsonb NOT NULL,
  created_at: timestamptz DEFAULT now()
)
```

### 4.3 Drizzle Migration Rules

1. **Always** run `pnpm drizzle-kit generate` to create SQL migration files. Never use `drizzle-kit push` in production.
2. **Review** every generated migration before applying. Check for accidental drops, wrong types, missing indexes.
3. Migrations live in `packages/db/migrations/`. Commit them. Never delete them.
4. Apply via `drizzle-kit migrate` in CI after approval.

---

## 5. Backend — NestJS Module Structure

```
apps/backend/src/
├── modules/
│   ├── auth/           # Session auth (email/password + OAuth)
│   ├── user/           # User profile management
│   ├── catalog/        # Prompt CRUD, preview, search (DDD Catalog BC)
│   ├── access/         # Entitlement checks (DDD Access BC)
│   ├── evaluation/     # AI grading pipeline (DDD Evaluation BC)
│   ├── moderation/     # Admin approve/reject (DDD Moderation BC)
│   ├── unlock/         # Unlock events
│   ├── billing/        # Stripe subscription
│   ├── rating/         # User ratings
│   ├── grading/        # AI grading scheduler + manual trigger
│   ├── ad/             # Ad provider abstraction
│   ├── admin/          # Admin-only endpoints
│   └── cache/          # In-memory TTL cache service (CacheService)
├── common/
│   ├── guards/         # AuthGuard, AdminGuard, EntitlementGuard
│   ├── interceptors/
│   └── decorators/
└── config/             # Environment config module
```

---

## 6. API Contract (Full)

All endpoints are prefixed with `/api`. Frontend calls `/api/...`.

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/me/state          # Returns { subscription, unlocks[], ratings{} } — single hydration call
```

### Prompts
```
GET    /api/prompts                        # ?category=&search=&page=&limit=&rating=&date=
GET    /api/prompts/:id                    # Returns preview or full based on entitlement
GET    /api/prompts/:id/version/:v         # Specific version content
POST   /api/prompts                        # Creator submission → status=pending
PUT    /api/prompts/:id                    # Creates new version (vN+1), immutable
```

### Unlock
```
POST   /api/prompts/:id/unlock             # Body: { adToken: string }
POST   /api/ads/callback                   # Ad provider server-side callback
```

### Billing
```
POST   /api/billing/checkout               # Creates Stripe checkout session
GET    /api/billing/status                 # Returns subscription status
POST   /api/billing/webhook                # Stripe webhook (raw body, signature verified)
```

### Ratings
```
POST   /api/prompts/:id/rate               # Body: { rating: 1–5 }
```

### Admin (requires `is_admin = true`)
```
GET    /api/admin/prompts?status=pending
POST   /api/admin/prompts/:id/approve
POST   /api/admin/prompts/:id/reject
POST   /api/admin/grading/run              # Manual grading trigger
```

---

## 7. Entitlement Rules

This is the most security-critical piece of the system. Follow exactly.

```ts
function canAccess(user: User, promptId: string): boolean {
  return hasActiveSubscription(user) || hasUnlock(user, promptId);
}
```

**Rules:**
- `hasActiveSubscription`: `subscriptions` row exists with `status = 'active'` AND `expires_at > now()`
- `hasUnlock`: row exists in `unlocks` with matching `user_id` AND `prompt_id`
- Unlock is **permanent**. There is no session-based or time-limited unlock.
- The unique constraint `UNIQUE(user_id, prompt_id)` on `unlocks` enforces deduplication at DB level.
- **NEVER** evaluate entitlement from frontend state. Always query from backend.
- **NEVER** grant unlock without a verified ad token: `adProvider.verifyCompletion(token) === true`

**Preview logic:**
- Unauthenticated users → return first 2–3 lines of prompt content only
- Authenticated users without entitlement → return preview + unlock prompt UI
- Authenticated users with entitlement → return full prompt content

---

## 8. Auth Implementation

**Library:** BetterAuth  
**Session transport:** HTTP-only cookies only. Never localStorage.

```ts
// packages/db/schema.ts — BetterAuth adapter tables added to schema
// apps/backend/src/modules/auth/auth.service.ts

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
  },
  trustedOrigins: [process.env.FRONTEND_URL!],
});
```

**Guards:**
- `AuthGuard`: blocks unauthenticated requests
- `AdminGuard`: extends AuthGuard, additionally checks `user.is_admin === true`
- `EntitlementGuard`: used on `/api/prompts/:id` full content route, runs `canAccess()`

**Security requirements:**
- Account locks for 15 minutes after 5 failed login attempts
- Passwords: minimum 8 characters + at least one number
- All traffic over HTTPS in production
- Session extends 30 days with "remember me"

---

## 9. AI Grading Pipeline

**Provider:** Groq  
**Primary model:** `llama-3.1-8b-instant`  
**Fallback model:** `llama-3.3-70b-versatile` (used only when primary fails JSON parsing)

### 9.1 Grading Prompt Template

```
You are an expert AI prompt evaluator.

Evaluate the following prompt based on these criteria:

1. Clarity (0–10)
2. Specificity (0–10)
3. Effectiveness (0–10)
4. Structure (0–10)
5. Reusability (0–10)

Also:
- Identify weaknesses
- Suggest improvements

Return STRICT JSON only. No markdown, no explanation outside JSON:

{
  "scores": {
    "clarity": number,
    "specificity": number,
    "effectiveness": number,
    "structure": number,
    "reusability": number
  },
  "overall": number,
  "feedback": string,
  "improvements": string[]
}

PROMPT:
"""
{{prompt_content}}
"""
```

### 9.2 Validation Layer (Mandatory)

```ts
if (!parsed.scores || typeof parsed.overall !== 'number') {
  // retry with fallback model once, then throw
  throw new Error('Invalid AI grading response');
}
```

### 9.3 Score → Tier Mapping

```
overall > 8.5  →  SUPER
overall > 7.0  →  PRO
overall > 5.0  →  BUILDER
else           →  STARTER
```

### 9.4 Scheduler

- Runs every 24 hours via NestJS `@Cron`
- Only processes `prompt_versions` where `needs_grading = true`
- After successful grading: set `needs_grading = false`, insert `grading_history` row
- Manual trigger: `POST /api/admin/grading/run`

**Rules:**
- Never re-grade prompts that have not changed
- Groq API key stored in environment only, never committed
- JSON parse failure on primary model → retry once with fallback model → if still fails, log error and skip (do not crash scheduler)

---

## 10. Stripe Integration

### 10.1 Checkout

**Monthly Plan:**
```ts
stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'subscription',
  line_items: [{ price: process.env.STRIPE_PRICE_ID_MONTHLY, quantity: 1 }],
  success_url: `${process.env.FRONTEND_URL}/success`,
  cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  metadata: { userId },
});
```

**Yearly Plan:**
```ts
stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'subscription',
  line_items: [{ price: process.env.STRIPE_PRICE_ID_YEARLY, quantity: 1 }],
  success_url: `${process.env.FRONTEND_URL}/success`,
  cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  metadata: { userId },
});
```

### 10.2 Webhook

- Route: `POST /api/billing/webhook`
- Must receive raw body (not JSON-parsed) for signature verification
- Verify with `stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)`
- On `checkout.session.completed`: call `activateSubscription(session.metadata.userId)`
- On `customer.subscription.deleted`: mark subscription `status = 'canceled'`

**Rules:**
- Webhook is the **only** activation trigger. Frontend `/success` redirect does nothing on its own.
- Store `stripe_customer_id` on the user record at checkout session creation.
- Never trust frontend for subscription status.

---

## 11. Ad Integration

### 11.1 Interface (Must be implemented as abstract adapter)

```ts
interface AdProvider {
  loadAd(): Promise<{ token: string }>;
  verifyCompletion(token: string): Promise<boolean>;
}
```

### 11.2 MVP Implementation: Google AdMob

- Frontend: rewarded ad SDK, shows ad on user click
- On ad completion: provider calls backend via `POST /api/ads/callback` with token
- Backend verifies token with `AdProvider.verifyCompletion(token)`
- Only on `true` result: write unlock row to DB

### 11.3 Unlock Flow

```
1. User clicks "Unlock with Ad"
2. Frontend calls POST /api/prompts/:id/unlock (starts unlock intent)
3. Backend returns ad token
4. Frontend shows AdMob rewarded ad
5. Ad provider server-side callback → POST /api/ads/callback { token }
6. Backend: verifyCompletion(token) === true
7. Backend: INSERT INTO unlocks (user_id, prompt_id, unlocked_via='ad')
8. Backend: returns 200 OK
9. Frontend: re-fetches prompt content (now unlocked)
```

**CRITICAL:** Steps 6 and 7 are atomic. Never write the unlock row without step 6 returning `true`.

---

## 12. Search

**Implementation:** PostgreSQL Full-Text Search

```sql
-- tsvector column on prompts, populated via trigger
search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, ''))
) STORED;

-- GIN index
CREATE INDEX idx_prompts_search ON prompts USING GIN(search_vector);
```

**Query pattern:**
```sql
SELECT * FROM prompts
WHERE search_vector @@ plainto_tsquery('english', $1)
  AND status = 'approved'
ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC;
```

**Rules:**
- Never use `ILIKE` for search. It does not scale.
- Sanitize the search query before passing to `plainto_tsquery`. Drizzle handles parameterization.
- Return ranked results (ts_rank descending).
- Only return `status = 'approved'` prompts in public search results.

---

## 13. CI/CD Pipeline

**Tool:** GitHub Actions

### PR Workflow (`.github/workflows/pr.yml`)

Triggered on: all commits + pull requests to `main`

```yaml
steps:
  - install deps (pnpm install --frozen-lockfile)
  - lint (pnpm lint)
  - type check (pnpm tsc --noEmit)
  - run tests (pnpm test)
```

**Rule: PRs CANNOT merge if any step fails. This is enforced as a required status check.**

### Deploy Workflow (`.github/workflows/deploy.yml`)

Triggered on: **git tags only** (`v*` pattern, e.g. `v1.0.1`)

```yaml
steps:
  - build backend (pnpm --filter backend build)
  - build docker image
  - SSH into Oracle VM
  - docker-compose pull && docker-compose up -d
```

**Frontend deploy:** Cloudflare Pages auto-deploys on push to `main` (connected via GitHub integration — no Actions step needed).

### Deployment Architecture

| Component | Host | Notes |
|---|---|---|
| Frontend (Next.js) | Cloudflare Pages | Auto-deploy on `main` push |
| Backend (NestJS) | Oracle VM (ARM A1) | SSH deploy on git tag |
| Database (PostgreSQL) | Oracle VM (same) | Co-located, zero-latency |
| Prompt files | Oracle VM filesystem | Path: `apps/backend/src/prompts/` |
| Analytics | PostHog Cloud | Free tier, 1M events/month |

---

## 14. Testing

### Coverage Requirements

| Layer | Tool | Coverage Target |
|---|---|---|
| Core business logic | Vitest | 90% |
| API endpoints | Supertest | 70% |
| Critical user flows | Playwright | All P0 flows |

### Must-Test Scenarios (Non-negotiable)

**Entitlement logic:**
- `canAccess` returns `true` for active subscriber
- `canAccess` returns `true` for user with existing unlock row
- `canAccess` returns `false` for logged-in user with neither
- `canAccess` returns `false` for unauthenticated user

**Unlock flow:**
- Duplicate unlock attempt returns existing unlock (not error, not double-write)
- Invalid ad token → `400 Bad Request`, no DB write
- Valid token → `200 OK`, unlock row created, `needs_grading` untouched

**Subscription flow:**
- Stripe webhook `checkout.session.completed` → subscription row created with `status = 'active'`
- Accessing prompt after webhook → entitlement check passes
- Frontend `/success` page alone does NOT grant access

**Grading pipeline:**
- Valid Groq response → `grading_history` row inserted, `needs_grading = false`
- Invalid JSON from Groq → error logged, no DB write, scheduler continues
- Prompt with `needs_grading = false` is skipped in scheduler run

**Admin moderation:**
- `GET /api/admin/prompts?status=pending` returns only pending prompts
- Approve → `status = 'approved'`, prompt visible in public search
- Reject → `status = 'rejected'`, prompt invisible in public search
- Non-admin user accessing `/api/admin/*` → `403 Forbidden`

---

## 15. Monitoring and Logging

### Sentry
- Backend: use NestJS global exception filter to capture all unhandled exceptions
- Frontend: initialize Sentry in `instrumentation.ts` (Next.js App Router convention)
- DSN stored in environment variables only

### pino (backend)
- Use structured JSON logging
- Log levels: `error`, `warn`, `info`, `debug`
- Never log passwords, tokens, or sensitive PII
- Log all incoming requests at `info` level (method, path, status, duration)
- Log all Groq API errors at `error` level with prompt version ID

### 15.3 PostHog Analytics (frontend)
- Library: `posthog-js` — initialized in `PostHogProvider` (`apps/frontend/src/components/posthog-provider.tsx`)
- Config: `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` in `.env`
- PostHog is **no-op when key is not set** — safe for local dev
- All event calls go through `apps/frontend/src/lib/analytics.ts` — never call `posthog.capture()` directly
- **Key events to track:**

| Event | When |
|---|---|
| `prompt_viewed` | Prompt detail page opened |
| `prompt_copied` | Copy button clicked |
| `unlock_initiated` | Ad unlock flow started |
| `unlock_completed` | Unlock confirmed |
| `checkout_started` | Subscription checkout opened |
| `subscription_activated` | Stripe webhook confirms activation |
| `search_performed` | Search query submitted |

- `analytics.identify(userId, email)` called on login, register, and `checkAuth`
- `analytics.reset()` called on logout

---

## 16. Environment Variables

All environment variables are defined in `.env` at the root. The `config/` module in NestJS validates them at startup using `@nestjs/config` with Joi or `zod`.

```
# Database
DATABASE_URL=

# Auth
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FRONTEND_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
STRIPE_WEBHOOK_SECRET=

# Groq
GROQ_API_KEY=

# AdMob
ADMOB_APP_ID=
ADMOB_AD_UNIT_ID=

# Sentry
SENTRY_DSN_BACKEND=
SENTRY_DSN_FRONTEND=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Rules:**
- Never commit `.env` or any secrets. `.env` is in `.gitignore`.
- Never hardcode secrets anywhere in source files.
- Validate required env vars at application startup and crash fast if any are missing.

---

## 17. File Storage Contract

Prompt content is stored as Markdown files on the local filesystem.

**Single-version prompt:**
```
apps/backend/src/prompts/
  {promptId}/
    v1/
      prompt.md          ← full content
```

**Multi-version prompt (4 tiers):**
```
apps/backend/src/prompts/
  {promptId}/
    v1/
      content/
        starter.md
        builder.md
        pro.md
        super.md
    v2/
      content/
        ...
```

**Rules:**
- DB stores `base_path` and `current_version` only. Backend composes the full file path.
- Versioning is immutable. When a prompt is updated, a new version directory is created. Old versions are never modified.
- `isMultiVersion = false` → single `prompt.md`. `isMultiVersion = true` → `content/{tier}.md` files.
- Files are pure content (Markdown). No metadata or manifest files — all structured data lives in DB.
- `preview` text (first ~220 chars) is stored in the `prompts.preview` DB column at ingest time — never read from filesystem on listing pages.

---

## 18. Admin Moderation Workflow

```
Creator submits prompt → status = 'pending'
Admin reviews via GET /api/admin/prompts?status=pending
Admin clicks Approve → POST /api/admin/prompts/:id/approve → status = 'approved'
Admin clicks Reject  → POST /api/admin/prompts/:id/reject  → status = 'rejected'
```

**Rules:**
- Only `status = 'approved'` prompts appear in public `GET /api/prompts` results.
- `status = 'pending'` and `status = 'rejected'` are invisible to non-admin users.
- Auto-approval is out of scope for MVP.
- AI grading score does NOT auto-approve. Grading only assigns tier, not publish status.

---

## 19. Scope Boundaries

### In Scope (MVP — Build These)

- Prompt browsing with partial preview for unauthenticated users
- User registration + login (email/password + Google + GitHub)
- Reward-based ad unlock (AdMob rewarded)
- Subscription access (Stripe, monthly + yearly)
- Prompt categorization (Starter / Builder / Pro / Super)
- Prompt versioning (multi-version tabs + single-version badge)
- Daily AI grading (Groq) + manual admin trigger
- Creator prompt submission (pending → admin approval)
- PostgreSQL full-text search
- Admin panel (pending queue, approve/reject, manual grading trigger)
- CI/CD pipeline (GitHub Actions)
- Error monitoring (Sentry) + structured logging (pino)
- Product analytics (PostHog Cloud)
- In-memory API caching (`CacheService`) with TTL + cache invalidation
- View counter with 60-second batch-flush to DB (`ViewCounterService`)
- User state hydration endpoint (`GET /api/auth/me/state`)

### Explicitly Out of Scope (Do Not Build)

- In-platform AI prompt execution
- Creator revenue share or payout system
- Meilisearch or any external search engine
- Redis or any external cache
- S3 or any external file storage
- Auto-approval based on grading score
- Multi-model AI evaluation
- Mobile apps (web only for MVP)

---

## 20. Reference Documents

Read these when implementing the corresponding feature:

| Document | Use When |
|---|---|
| `docs/BRD1.md` | Verifying feature scope, acceptance criteria, user flows |
| `docs/software_aarchitecture.md` | DB schema details, API design, ad abstraction interface, entitlement logic |
| `docs/build_blueprint.md` | Monorepo layout, NestJS module list, Drizzle starter schema, sprint plan |
| `docs/highleverage-pieces.md` | BetterAuth setup, Drizzle migration workflow, Stripe webhook pattern, AI grading prompt template, testing strategy |
| `docs/userstories.md` | GIVEN-WHEN-THEN scenarios for all P0 features, acceptance criteria tables |

---

## 21. Development Workflow

Every piece of work MUST be driven by a user story in `docs/userstories.md`. No code is written speculatively or without a corresponding story.

**Before starting any feature:**
1. Identify the user story (e.g. US-3) in `docs/userstories.md`
2. Read its acceptance criteria and GIVEN-WHEN-THEN scenarios in full
3. Confirm the story is not already marked `[x] Completed`

**After completing a feature:**
1. Verify every acceptance criterion in the story passes
2. Mark the story as completed in `docs/userstories.md` by updating its status to `[x] Completed`
3. Commit the status update in the same PR as the implementation

**Rules:**
- Do not start work on a story that is already marked completed
- Do not mark a story completed unless every acceptance criterion passes
- Partial completion is not completion — do not mark done until all criteria are met
- P0 stories must be completed before any P1 work begins

---

## 22. Definition of Done

A feature is complete when ALL of the following are true:

1. The corresponding user story in `docs/userstories.md` is identified and all its acceptance criteria pass
2. The user story status is updated to `[x] Completed` in `docs/userstories.md` and committed
3. Unit tests written with ≥90% coverage for core logic paths
4. Integration tests written for all new API endpoints
5. No TypeScript errors (`pnpm tsc --noEmit` passes)
6. ESLint passes with no warnings
7. Sentry is wired and exceptions are captured
8. All secrets are in environment variables, not source code
9. PR CI checks pass (lint + typecheck + tests)
10. Code reviewed against Section 7 (Entitlement Rules) if touching unlock/subscription logic
11. No out-of-scope features introduced

---

## 22. Caching Architecture

### Backend — CacheService (`modules/cache/cache.service.ts`)

In-memory `Map<string, { value, expiresAt }>` with TTL. No Redis.

**Cache key conventions:**

| Key pattern | TTL | Busted by |
|---|---|---|
| `prompts:list:p{page}:l{limit}:c{cat}:s{search}:t{tier}:d{date}` | 5 min | Admin approve/reject, view flush |
| `prompts:detail:{id}` | 10 min | Prompt update, new version |
| `evaluations:tiers` | 5 min | Grading completion, admin approve |
| `user:state:{userId}` | 5 min | Unlock, rating, Stripe webhook |

**Invalidation methods on `CatalogService`:**
- `invalidatePrompt(id)` — busts `prompts:detail:{id}` + all listing keys
- `invalidateListings()` — busts all listing + evaluation keys

### Backend — ViewCounterService (`modules/catalog/view-counter.service.ts`)

- `increment(promptId)` — adds to in-memory buffer (zero DB writes)
- `@Interval(60_000)` flush — single `UPDATE prompts SET views = views + N WHERE id IN (...)` for all buffered IDs, then clears buffer and busts listing cache
- View counts are **eventually consistent** (up to 60s lag) — acceptable for a marketplace

### Frontend — TanStack Query

- Set `staleTime: 5 * 60_000` on prompt listing queries
- Set `staleTime: 10 * 60_000` on single prompt queries
- Call `queryClient.invalidateQueries({ queryKey: ['prompts'] })` after mutations

### Frontend — Zustand User State

- `hydrateUserState()` calls `GET /api/auth/me/state` once on login/register/page reload
- Returns `{ subscription, unlocks: string[], ratings: Record<string, number> }`
- Mutations (unlock, rate) update Zustand optimistically — no refetch needed

---

*Last updated: April 2026 | Version: 1.1 | Status: Approved for implementation*
