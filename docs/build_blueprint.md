This is the **build blueprint** 👇

---

# 🚀 Monorepo Structure (Final)

```bash
superprompt/
│
├── apps/
│   ├── frontend/        # Next.js
│   └── backend/         # NestJS
│
├── packages/
│   ├── db/              # Drizzle schema + migrations
│   ├── types/           # Shared types
│   └── utils/           # Shared helpers
│
├── infra/
│   ├── docker/
│   └── scripts/
│
├── .env
├── docker-compose.yml
└── README.md
```

---

# 🧱 Frontend UI Implementation (Current)

## Header/Navbar (`src/components/header.tsx`)

- **Position**: Fixed at top, centered horizontally
- **Style**: Circular pill shape, black background
- **Logo**: Responsive (logo.png for md+, logo_small.png for small screens)
- **Elements**:
  - Theme toggle (sun/moon with SVG icons)
  - User profile icon
  - Logout icon button
  - Login/Sign Up buttons (when not authenticated)

## Bottom Search Bar (`src/components/bottom-search-bar.tsx`)

- **Position**: Fixed at bottom, centered horizontally
- **Max Width**: 700px
- **Style**: Black background with gradient border (Framer-style)
- **Rows**:
  1. Applied Filters (shows when active, click to remove)
  2. Search input + Date/Tier dropdowns
  3. Category chips with scroll arrows

## Prompt Cards Grid (`src/app/page.tsx`)

- **Layout**: CSS Grid with `auto-fill, minmax(380px, 1fr)`
- **Theme Consistency**: All cards follow theme (all light in light mode, all dark in dark mode)
- **No more alternating pattern**

## Login/Register Pages

- **Style**: Inline component definitions to avoid import issues
- **OAuth Buttons**: All use inline SVG icons (no external icon dependencies)

---

# 🧱 Backend Architecture (NestJS Modules)

```bash
apps/backend/src/

modules/
├── auth/
├── user/
├── prompt/
├── version/
├── unlock/
├── billing/
├── rating/
├── grading/
├── ad/
├── admin/
├── cache/

common/
├── guards/
├── interceptors/
├── decorators/

config/
```

---

## 🔥 Key Module Responsibilities

### Prompt Module

* Fetch prompt metadata
* Serve preview/full content

---

### Version Module

* Handle version creation (`v1 → v2`)
* Manage file paths

---

### Unlock Module (CRITICAL)

* Check entitlement
* Store unlock events
* Prevent duplicates

---

### Grading Module

* Scheduler (24h)
* Manual trigger
* AI integration

---

### Ad Module

* Abstraction layer
* Provider switching ready

---

### Admin Module (Minimal)

Endpoints:

```ts
POST /admin/grading/run
GET  /admin/prompts?needs_grading=true
POST /admin/prompts
PUT  /admin/prompts/:id
```

---

# 🧬 Drizzle Schema (Starter)

```ts
// packages/db/schema.ts

export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey(),
  title: text('title'),
  category: text('category'),
  basePath: text('base_path'),
  currentVersion: integer('current_version'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey(),
  promptId: uuid('prompt_id'),
  versionNumber: integer('version_number'),
  needsGrading: boolean('needs_grading').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const unlocks = pgTable('unlocks', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  promptId: uuid('prompt_id'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

---

# 🎨 Frontend Structure (Next.js)

```bash
apps/frontend/

app/
├── page.tsx
├── prompts/
│   ├── page.tsx
│   └── [id]/page.tsx
│
├── admin/
│   ├── page.tsx
│   └── grading/page.tsx
│
components/
├── prompt/
├── ui/
├── layout/
├── auth/
```

---

# 🔥 Key UI Components

* PromptCard
* PromptDetail
* UnlockModal
* VersionTabs
* RatingStars
* AdminPanel (simple table + buttons)

---

# ⚙️ Oracle VM Setup (Simple)

```bash
# install docker
sudo apt update
sudo apt install docker.io

# postgres
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  postgres
```

---

# 🗓️ 2–3 Week MVP Sprint Plan

## 🟢 Week 1: Core System

### Day 1–2

* Setup monorepo
* Setup Next.js + NestJS
* Setup PostgreSQL + Drizzle

### Day 3–4

* Auth (BetterAuth)
* User session flow

### Day 5–7

* Prompt APIs
* File storage system
* Prompt listing UI

---

## 🟡 Week 2: Monetization

### Day 8–9

* Unlock flow (without ads first)
* Entitlement logic

### Day 10–11

* Ad integration (mock → real)

### Day 12–14

* Subscription (Stripe)
* UI polish

---

## 🔵 Week 3: Intelligence + Admin

### Day 15–16

* AI grading integration

### Day 17

* Scheduler (cron)

### Day 18

* Admin endpoints

### Day 19–21

* Admin UI (minimal)
* Testing + bug fixes

---

# ⚠️ Critical Implementation Tips

### 1. Start WITHOUT Ads

Mock unlock:

```ts
unlockPrompt(userId, promptId)
```

👉 Then integrate ads later

---

### 2. Keep FS Simple

```ts
const path = `/prompts/${id}/v${version}/pro.md`
```

---

### 3. Log Everything (VERY IMPORTANT)

* unlock events
* grading results
* errors

---

### 4. Avoid Over-Engineering

* No Redis yet
* No Meilisearch yet
* No microservices

---

# 🎯 Final State

You now have:

* Clean architecture
* Cost-optimized infra
* Scalable backend
* Fast frontend stack
* Clear execution plan

👉 This is **fully buildable by a small team**

---

.devcontainer/
├── devcontainer.json
├── docker-compose.yml
└── Dockerfile

---

# 🔧 Recommended Dev Container Setup

## 📁 Structure

```bash
.devcontainer/
├── devcontainer.json
├── docker-compose.yml
└── Dockerfile
```

---

## 🧱 docker-compose (Dev)

This replaces the earlier “Oracle VM simple setup” **for development**

```yaml
version: "3.8"

services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
    command: sleep infinity
    depends_on:
      - db

  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: superprompt
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

---

## 🧾 devcontainer.json

```json
{
  "name": "SuperPrompt Dev",
  "dockerComposeFile": "docker-compose.yml",
  "service": "backend",
  "workspaceFolder": "/workspace",
  "forwardPorts": [3000, 4000, 5432],
  "postCreateCommand": "pnpm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "ms-azuretools.vscode-docker"
      ]
    }
  }
}
```

---

## 🐳 Dockerfile (Dev)

```Dockerfile
FROM node:20

WORKDIR /workspace

RUN npm install -g pnpm

# optional tools
RUN apt-get update && apt-get install -y git

```

---

# 🔥 How This Maps to Your Architecture

| Layer      | Dev Container               |
| ---------- | --------------------------- |
| Backend    | `backend` container (4000)  |
| Frontend   | `frontend` container (3000) |
| DB         | `db` container (5432)       |
| FS storage | shared workspace volume     |

---

# ⚠️ Important Tips (From Experience)

## 1. Use `.env.local` per environment

Inside dev:

```env
DATABASE_URL=postgres://postgres:postgres@db:5432/superprompt
```

👉 Note:

* `db` = service name (not localhost)

---

## 2. Run services independently

Each service runs in its own container. Restart/rebuild without affecting the other:

```bash
# restart only the backend (does not touch frontend)
docker compose -f .devcontainer/docker-compose.yml restart backend

# tail backend logs only
docker compose -f .devcontainer/docker-compose.yml logs backend -f

# tail frontend logs only
docker compose -f .devcontainer/docker-compose.yml logs frontend -f
```

---

## 3. Drizzle migrations

Run inside container:

```bash
pnpm drizzle-kit push
```

---

## 4. Prompt File Storage

Keep inside repo for dev:

```bash
/apps/backend/prompts/
```

👉 Later:

* mount or move to external storage

---

# 🧠 Key Insight

Your environments now look like:

| Environment | Setup              |
| ----------- | ------------------ |
| Dev         | Dev containers     |
| Prod        | Oracle VM + Docker |
| Future      | Cloud-native       |


* 🧬 Drizzle migration setup (best practices)
* 🔐 BetterAuth integration (clean flow)
* 🧠 AI grading prompt design (very important for quality)

Just say 👍
