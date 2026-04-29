# SPEC-1-SuperPrompt Architecture

## Background

SuperPrompt is a web-based platform that enables users to discover, unlock, and utilize high-quality AI prompts through a hybrid monetization model.

The platform starts with a few hundred curated prompts and scales gradually to thousands of users and prompts. Core capabilities include browsing prompts without login, unlocking prompts via reward-based ads, subscription-based access, and a scheduled AI-driven grading system.

The system is web-first, optimized for low cost, high read performance, and incremental scalability.

Core value loop:
Discovery → Login → Unlock → Copy → Use

---

## Requirements

### Must Have

* Browse prompts without login (partial preview)
* Unlock prompts via reward ads (per-prompt, permanent unlock)
* Subscription-based unlimited access
* Prompt categorization and versioning
* AI grading system (scheduled + manual trigger)
* Authentication (email + OAuth)

### Should Have

* Search (title/tags) and filtering
* User ratings
* Creator submissions
* Basic admin interface

### Non-Functional

* <2s load time
* 99.5% uptime
* Support up to ~50K users

---

## UI/UX Implementation

### Header/Navbar
- Fixed position at top, centered horizontally
- Circular pill shape with black background
- Responsive logo (full logo on desktop, small logo on mobile)
- Theme toggle, user profile, logout, login/register buttons

### Bottom Search Bar
- Fixed position at bottom, centered horizontally
- 700px max-width with gradient border (Framer-style purple gradient)
- 3-row layout:
  1. Applied filters row (visible when filters active)
  2. Search input + Date/Tier dropdowns
  3. Horizontally scrollable category chips with arrow navigation
- Categories displayed in uppercase

### Prompt Cards
- CSS Grid layout with responsive columns (auto-fill, minmax 380px)
- Theme-consistent styling (all light in light mode, all dark in dark mode)
- No alternating pattern

### Login/Register Pages
- Inline component definitions to avoid SSR import issues
- OAuth buttons with inline SVG icons
- Email/password login form

---

## Method

### High-Level Architecture

```plantuml
@startuml
actor User
User --> Frontend
Frontend --> Backend
Backend --> PostgreSQL
Backend --> FileStorage
Backend --> InMemoryCache
Backend --> AIProvider
Backend --> AdMediation
cloud Cloudflare
Cloudflare --> Frontend
Cloudflare --> Backend
@enduml
```

---

### Components

#### Frontend (Next.js)

* Hosted on Vercel/Cloudflare Pages
* SSR/CSR
* Calls backend APIs
* Key components:
  - Header (navbar)
  - BottomSearchBar (search + filters)
  - PromptCard (prompt display)
  - CircularScore (grading score)

#### Backend (NestJS Monolith)

Modules:

* Auth (BetterAuth)
* Prompt
* Unlock/Entitlement
* Subscription (Stripe)
* Ratings
* Grading (scheduler + manual trigger)
* Ad Mediation Adapter
* Cache
* Admin

#### Database (PostgreSQL + Drizzle)

* Source of truth for all metadata and transactions

#### File Storage (Local → S3 later)

* Stores prompt content as Markdown

#### In-Memory Cache

* Map-based cache for shared, non-user-specific data
* TTL: 5–15 minutes

---

### File Storage Contract

```
/prompts/{promptId}/
  v1/
    starter.md
    builder.md
    pro.md
    super.md
  v2/
    starter.md
    ...
```

Rules:

* DB stores base path + version
* Backend composes file path per version
* Versioning is immutable (new version created on update)

---

### Database Schema (Drizzle-Oriented)

```sql
users(
  id uuid pk,
  email text unique,
  password_hash text,
  created_at timestamptz
)

sessions(
  id uuid pk,
  user_id uuid,
  expires_at timestamptz
)

prompts(
  id uuid pk,
  title text,
  category text,
  base_path text,
  current_version int,
  is_multi_version boolean,
  created_at timestamptz
)

prompt_versions(
  id uuid pk,
  prompt_id uuid,
  version_number int,
  created_at timestamptz
)

prompt_version_files(
  id uuid pk,
  prompt_version_id uuid,
  level text, -- starter|builder|pro|super
  file_name text
)

ratings(
  id uuid pk,
  user_id uuid,
  prompt_id uuid,
  rating int,
  created_at timestamptz,
  unique(user_id, prompt_id)
)

unlocks(
  id uuid pk,
  user_id uuid,
  prompt_id uuid,
  unlocked_via text,
  created_at timestamptz,
  unique(user_id, prompt_id)
)

subscriptions(
  id uuid pk,
  user_id uuid,
  status text,
  expires_at timestamptz
)

grading_jobs(
  id uuid pk,
  status text,
  triggered_by text, -- system|admin
  created_at timestamptz
)

grading_history(
  id uuid pk,
  prompt_version_id uuid,
  score jsonb,
  created_at timestamptz
)
```

---

### API Design (Frontend ↔ Backend)

#### Auth

* POST /auth/register
* POST /auth/login
* GET /auth/me

#### Prompts

* GET /prompts?category=&search=
* GET /prompts/:id
* GET /prompts/:id/version/:v

#### Prompt Versioning

* POST /prompts (create v1)
* PUT /prompts/:id (creates new version vN+1)

#### Unlock

* POST /prompts/:id/unlock
* POST /ads/callback

#### Subscription

* POST /billing/checkout
* GET /billing/status

#### Ratings

* POST /prompts/:id/rate

#### Admin

* POST /admin/grading/run (manual trigger)
* GET /admin/prompts/pending

---

### Ad Mediation Abstraction

```ts
interface AdProvider {
  loadAd(): Promise<AdToken>
  verifyCompletion(token: string): Promise<boolean>
}
```

---

### Entitlement Logic

Access = TRUE if:

* active subscription
  OR
* unlock exists

---

### In-Memory Cache Strategy

Cache keys:

* prompt:{id}:meta
* prompt:{id}:preview
* prompt:{id}:grading

Never cache user-specific data

---

### AI Grading Pipeline (Scheduled + Manual)

Trigger:

* Runs every 24 hours
* Only processes:

  * new prompts
  * updated prompt versions

Also supports:

* Manual trigger via admin API

Flow:

```plantuml
@startuml
Scheduler -> Backend : trigger grading
Backend -> DB : fetch new/updated versions
Backend -> FileStorage : read content
Backend -> AIProvider : evaluate
AIProvider --> Backend : scores
Backend -> DB : store grading_history
Backend -> DB : update category
@enduml
```

---

## Implementation

1. Setup monorepo (frontend + backend)
2. Setup Oracle VM
3. Install PostgreSQL
4. Setup NestJS + Drizzle + BetterAuth
5. Implement auth + session
6. Implement prompt + versioning system
7. Implement file storage layer
8. Implement unlock + ad adapter
9. Integrate Stripe
10. Add in-memory cache
11. Implement grading scheduler + manual trigger
12. Build basic admin APIs/UI
13. Deploy frontend

---

## Milestones

1. Core (browse + auth + prompts)
2. Monetization (ads + subscription)
3. Versioning + grading
4. Admin + optimization

---

## Gathering Results

* DAU
* Unlock rate
* Conversion rate
* Prompt engagement
* Grading consistency

---

| Layer         | Choice                       |
| ------------- | ---------------------------- |
| Framework     | Next.js ✅                    |
| Styling       | Tailwind CSS ✅               |
| UI Components | shadcn/ui ✅                  |
| State         | React Query (TanStack Query) |
| Forms         | React Hook Form              |
| Auth client   | BetterAuth client            |
