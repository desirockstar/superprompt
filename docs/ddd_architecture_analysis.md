# Domain-Driven Design Architecture Analysis — SuperPrompt

> **Date:** April 2026 | **Status:** Analysis & Proposal

---

## 1. Current State Analysis

### 1.1 Existing Organization

The backend follows a **layer-by-technical-concern** NestJS module structure with 11 modules all wired into a single `AppModule`:

| Module | Responsibility |
|--------|---------------|
| `AuthModule` | Session management, login, registration |
| `UserModule` | User profile |
| `PromptModule` | CRUD, search, content retrieval, preview logic |
| `UnlockModule` | Entitlement writes (ad/subscription unlocks) |
| `BillingModule` | Stripe checkout, webhook, subscription status |
| `RatingModule` | User ratings |
| `GradingModule` | AI evaluation pipeline (cron + manual) |
| `AdminModule` | Moderation (approve/reject) |
| `CacheModule` | In-memory TTL map |
| `AdModule` | Ad provider abstraction |
| `DatabaseModule` | Drizzle connection |

### 1.2 Coupling Pain Points Identified

1. **PromptService is a God Service** — It queries `evaluations`, `subscriptions`, `unlocks`, and file system content in a single method (`findAll`). It owns preview logic, full content logic, search, tier mapping, and pagination.

2. **Grading is tightly coupled to file I/O and raw HTTP** — `GradingService` uses `require('https')` inline, reads filesystem directly with synchronous `fs.readFileSync`, and manages DB evaluation lifecycle (insert → update → score storage) all in one class.

3. **Entitlement logic is fragmented** — `UnlockService` handles the write-side, but the read-side (`canAccess`) is implicit in `PromptService`. There is no dedicated `EntitlementService` that encapsulates the complete access decision.

4. **No domain events** — Modules communicate via direct imports. When a grading completes, there's no event to notify the Prompt domain that a tier has been assigned. When a subscription activates, there's no event to trigger cache invalidation.

5. **Schema is a single flat file** — `packages/db/src/index.ts` exports all tables as a monolith. No separation between domain concerns at the data layer.

6. **Grading re-evaluates ALL approved prompts** — No `needsGrading` filter in the current implementation (queries all approved prompts), violating the BRD's "never re-grade unchanged prompts" rule.

---

## 2. Domain Identification

Based on the business capabilities and language used by stakeholders (BRD, user stories):

### Core Domains (highest strategic differentiation)

| Domain | Business Capability | Why Core |
|--------|-------------------|----------|
| **Prompt Catalog** | Discovery, browsing, search, categorization | Central value proposition |
| **Prompt Evaluation** | AI grading, rubrics, tier assignment | Key differentiator — primary pain point |

### Supporting Domains (enable core, but generic)

| Domain | Business Capability |
|--------|-------------------|
| **Entitlement & Access** | Unlock logic, subscription checks, access decisions |
| **Monetization** | Stripe billing, ad-based unlock flow |
| **Identity & Auth** | User registration, sessions, OAuth |

### Generic Domains (commodity, off-the-shelf)

| Domain | Business Capability |
|--------|-------------------|
| **Content Storage** | File I/O for markdown prompt content |
| **Administration** | Moderation queue, manual triggers |

---

## 3. Bounded Context Design

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SuperPrompt System                              │
│                                                                        │
│  ┌─────────────────┐    ┌──────────────────────┐    ┌──────────────┐ │
│  │  CATALOG BC      │    │  EVALUATION BC        │    │ ACCESS BC    │ │
│  │                  │    │                       │    │              │ │
│  │ • Prompt CRUD    │    │ • Rubric management   │    │ • canAccess  │ │
│  │ • Search/Filter  │    │ • LLM orchestration   │    │ • Unlock     │ │
│  │ • Versioning     │    │ • Score calculation   │    │ • Subscription│ │
│  │ • Preview logic  │    │ • Tier assignment     │    │ • Ad verify  │ │
│  │ • Creator submit │    │ • Scheduling          │    │              │ │
│  └────────┬─────────┘    └──────────┬────────────┘    └──────┬───────┘ │
│           │                         │                         │         │
│           │ PromptCreated           │ EvaluationCompleted     │         │
│           │ PromptApproved    ◄─────┘                         │         │
│           │                                                   │         │
│  ┌────────┴─────────┐    ┌──────────────────────┐    ┌──────┴───────┐ │
│  │  MODERATION BC   │    │  BILLING BC           │    │ IDENTITY BC  │ │
│  │                  │    │                       │    │              │ │
│  │ • Approval queue │    │ • Stripe integration  │    │ • Auth       │ │
│  │ • Approve/Reject │    │ • Checkout session    │    │ • Sessions   │ │
│  │                  │    │ • Webhook handling    │    │ • OAuth      │ │
│  └──────────────────┘    └───────────────────────┘    └──────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Context Mapping (relationships)

| Upstream → Downstream | Relationship Type | Integration |
|----------------------|-------------------|-------------|
| Catalog → Evaluation | Published Language | Domain Event: `PromptApproved` triggers grading |
| Evaluation → Catalog | Conformist | Catalog reads tier from Evaluation's read model |
| Billing → Access | Customer-Supplier | `SubscriptionActivated` event updates entitlement |
| Access → Catalog | Open Host Service | Catalog calls Access to determine preview vs. full |
| Identity → All | Shared Kernel | `userId` is the shared identity concept |

---

## 4. Aggregate Root Definition

### 4.1 Catalog Bounded Context

**Aggregate Root: `Prompt`**
```
Prompt (Aggregate Root)
├── PromptVersion (Entity)
│   └── PromptVersionFile (Value Object)
├── Category (Value Object)
├── Status (Value Object: pending | approved | rejected)
└── SearchVector (Value Object, derived)
```

**Invariants:**
- A prompt always has at least one version
- Versions are immutable once created
- Only approved prompts appear in search
- `current_version` always points to the latest

---

### 4.2 Evaluation Bounded Context (primary pain point)

**Aggregate Root: `Evaluation`**
```
Evaluation (Aggregate Root)
├── EvaluationScore[] (Entity, per criterion)
├── Rubric (Value Object — snapshot at time of eval)
├── Tier (Value Object: starter | builder | pro | super)
└── Status (Value Object: pending | completed | failed)
```

**Invariants:**
- An evaluation is linked to exactly one prompt version
- Once completed, scores are immutable (re-evaluation creates new record)
- Tier is computed deterministically from weighted scores
- Rubric is snapshotted at evaluation time (not a live reference)

**Aggregate Root: `Rubric`** (separate aggregate)
```
Rubric (Aggregate Root)
├── Category (identifier)
└── Criterion[] (Value Object: name + weight)
```

**Invariants:**
- Each category has exactly one active rubric
- Criteria weights must sum to 1.0
- Changing a rubric does NOT retroactively change existing evaluations

---

### 4.3 Access Bounded Context

**Aggregate Root: `Entitlement`** (conceptual — not a single table)
```
Entitlement (Aggregate Root — logical)
├── Unlock (Entity: permanent per prompt)
└── Subscription (Entity: time-bounded global)
```

**Invariants:**
- `canAccess(user, prompt) = hasActiveSubscription(user) || hasUnlock(user, prompt)`
- Unlock is permanent and idempotent (UNIQUE constraint)
- Subscription grants access to ALL prompts while active
- Entitlement decisions are NEVER cached on the frontend

---

### 4.4 Billing Bounded Context

**Aggregate Root: `Subscription`**
```
Subscription (Aggregate Root)
├── StripeSubscriptionId (Value Object)
├── Status (Value Object: active | canceled | past_due)
└── ExpiresAt (Value Object)
```

**Invariants:**
- Activation ONLY via verified Stripe webhook
- One active subscription per user maximum
- Frontend success redirect ≠ activation

---

## 5. Interface Abstraction Strategy

### 5.1 Anti-Corruption Layers

**LLM Provider ACL** (biggest pain point fix):
```ts
// evaluation/ports/llm-evaluator.port.ts
interface LLMEvaluator {
  evaluate(content: string, criteria: Criterion[], level: PromptLevel): Promise<EvaluationResult>;
}

// evaluation/adapters/groq.adapter.ts  (implements LLMEvaluator)
// evaluation/adapters/mock.adapter.ts  (implements LLMEvaluator, for testing)
```

**Content Storage ACL:**
```ts
// catalog/ports/content-repository.port.ts
interface ContentRepository {
  getPreview(promptId: string, version: number): Promise<string>;
  getFullContent(promptId: string, version: number): Promise<Record<PromptLevel, string>>;
  store(promptId: string, version: number, level: PromptLevel, content: string): Promise<void>;
}
```

**Ad Provider ACL** (already partially exists):
```ts
// access/ports/ad-verifier.port.ts
interface AdVerifier {
  verifyCompletion(token: string): Promise<boolean>;
}
```

### 5.2 Domain Events (decoupling key modules)

```ts
// Emitted by Moderation → consumed by Evaluation
PromptApproved { promptId, category, version }

// Emitted by Evaluation → consumed by Catalog
EvaluationCompleted { promptId, tier, overallScore }

// Emitted by Billing → consumed by Access
SubscriptionActivated { userId, expiresAt }
SubscriptionCanceled { userId }

// Emitted by Access → consumed by Catalog (cache invalidation)
UnlockGranted { userId, promptId }
```

In NestJS, use `@nestjs/event-emitter` (in-process events for monolith) — no external broker needed.

---

## 6. Modular Architecture Proposal

### 6.1 Restructured Backend Layout

```
apps/backend/src/
├── modules/
│   ├── catalog/                    # Catalog BC
│   │   ├── catalog.module.ts
│   │   ├── prompt.aggregate.ts     # Domain logic
│   │   ├── prompt.repository.ts    # DB access
│   │   ├── prompt.service.ts       # Application service (thin)
│   │   ├── prompt.controller.ts
│   │   ├── search.service.ts       # FTS queries only
│   │   └── ports/
│   │       └── content-repository.port.ts
│   │
│   ├── evaluation/                 # Evaluation BC (pain point)
│   │   ├── evaluation.module.ts
│   │   ├── evaluation.aggregate.ts # Domain: scoring, tier assignment
│   │   ├── evaluation.repository.ts
│   │   ├── grading.orchestrator.ts # Coordinates the pipeline
│   │   ├── grading.scheduler.ts    # Cron scheduling ONLY
│   │   ├── rubric.service.ts       # Rubric CRUD + lookup
│   │   ├── tier-calculator.ts      # Pure function: score → tier
│   │   ├── ports/
│   │   │   └── llm-evaluator.port.ts
│   │   └── adapters/
│   │       ├── groq.adapter.ts     # HTTP calls to Groq
│   │       └── mock.adapter.ts     # Deterministic for tests
│   │
│   ├── access/                     # Access BC
│   │   ├── access.module.ts
│   │   ├── entitlement.service.ts  # Single canAccess() authority
│   │   ├── unlock.service.ts
│   │   ├── entitlement.guard.ts    # NestJS guard
│   │   └── ports/
│   │       └── ad-verifier.port.ts
│   │
│   ├── billing/                    # Billing BC
│   │   ├── billing.module.ts
│   │   ├── billing.service.ts
│   │   ├── billing.controller.ts
│   │   └── stripe.adapter.ts
│   │
│   ├── identity/                   # Identity BC
│   │   ├── identity.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── user.service.ts
│   │
│   ├── moderation/                 # Moderation BC
│   │   ├── moderation.module.ts
│   │   ├── moderation.service.ts
│   │   └── moderation.controller.ts
│   │
│   └── shared/                     # Shared Kernel
│       ├── events/                 # Domain event definitions
│       ├── database/               # Connection provider
│       └── cache/                  # TTL cache utility
```

### 6.2 Key Architectural Decisions for Evaluation BC

This addresses the stated pain point directly:

| Current Problem | DDD Solution |
|----------------|-------------|
| `GradingService` does everything (scheduling + HTTP + DB + scoring) | Split into `GradingScheduler` (when), `GradingOrchestrator` (what), `GroqAdapter` (how), `TierCalculator` (pure logic) |
| Inline `require('https')` for LLM calls | Port/Adapter: `LLMEvaluator` interface with `GroqAdapter` implementation |
| No retry isolation — failure in one prompt stops nothing but logs poorly | Orchestrator handles per-prompt try/catch with structured error domain events |
| Rubric hardcoded fallback | `RubricService` as first-class citizen with repository |
| `needsGrading` filter missing | Orchestrator queries `promptVersions.needsGrading = true` as per spec |
| Re-evaluates ALL approved prompts | Only process versions explicitly marked for grading |
| Scores stored as strings | Value Objects with proper numeric types in the domain layer |

### 6.3 Evaluation BC — Sequence Diagram

```
┌────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────┐
│  Scheduler │    │  Orchestrator     │    │  GroqAdapter     │    │  Repository  │
└─────┬──────┘    └────────┬──────────┘    └────────┬─────────┘    └──────┬───────┘
      │                    │                        │                      │
      │ triggerBatch()     │                        │                      │
      ├───────────────────►│                        │                      │
      │                    │ findPendingVersions()  │                      │
      │                    ├──────────────────────────────────────────────►│
      │                    │◄─────────────────────────────────────────────┤
      │                    │                        │                      │
      │                    │ for each version:      │                      │
      │                    │  loadContent()         │                      │
      │                    ├──────────────────────────────────────────────►│
      │                    │  loadRubric()          │                      │
      │                    ├──────────────────────────────────────────────►│
      │                    │                        │                      │
      │                    │  evaluate(content,     │                      │
      │                    │    criteria, level)    │                      │
      │                    ├───────────────────────►│                      │
      │                    │    EvaluationResult    │                      │
      │                    │◄──────────────────────┤                      │
      │                    │                        │                      │
      │                    │  computeTier(score)    │                      │
      │                    │  (pure function)       │                      │
      │                    │                        │                      │
      │                    │  saveEvaluation()      │                      │
      │                    ├──────────────────────────────────────────────►│
      │                    │  emit(EvaluationCompleted)                    │
      │                    │                        │                      │
```

---

## 7. Migration Roadmap

### Phase 1: Extract Evaluation BC (highest pain, highest value)

**Scope:** Refactor `GradingModule` into the `evaluation/` bounded context with ports/adapters.

1. Create `LLMEvaluator` port interface
2. Extract `GroqAdapter` from inline `require('https')` calls
3. Create `MockAdapter` (returns deterministic scores) for unit tests
4. Extract `TierCalculator` as a pure function (zero dependencies)
5. Split `GradingService` into `GradingScheduler` + `GradingOrchestrator`
6. Fix the `needsGrading` filter bug (currently grades ALL approved prompts)
7. Add `EvaluationCompleted` domain event emission

**Risk:** Low — isolated module, no consumers depend on its internal structure.

---

### Phase 2: Extract Access BC (security-critical consolidation)

**Scope:** Unify entitlement logic into a single authoritative service.

1. Create `EntitlementService.canAccess(userId, promptId): boolean`
2. Move unlock write-logic from current `UnlockService`
3. Create `EntitlementGuard` that delegates to `EntitlementService`
4. Remove subscription/unlock queries from `PromptService`
5. Wire `SubscriptionActivated` event from Billing → Access

**Risk:** Medium — touches auth guards and content access paths. Requires careful integration testing.

---

### Phase 3: Clean up Catalog BC

**Scope:** Slim down `PromptService` to its proper domain.

1. Extract `ContentRepository` port (filesystem reads)
2. Remove evaluation/tier queries — consume `EvaluationCompleted` events to maintain a read-model
3. Extract `SearchService` as dedicated FTS component
4. Emit `PromptCreated` / `PromptApproved` events for downstream consumers

**Risk:** Low-medium — mostly moving existing code, but `findAll()` is heavily used.

---

### Phase 4: Event Infrastructure + Moderation

**Scope:** Wire domain events across all bounded contexts.

1. Install `@nestjs/event-emitter`
2. Define all domain events in `shared/events/`
3. Convert direct module imports to event-driven communication
4. Extract `AdminModule` → `ModerationModule` with proper event emission

**Risk:** Low — additive, no breaking changes.

---

### Phase 5: Schema Splitting (optional, advanced)

**Scope:** Organize `packages/db/src/index.ts` by domain.

```
packages/db/src/
├── catalog.schema.ts       # prompts, promptVersions, promptVersionFiles
├── evaluation.schema.ts    # evaluations, evaluationScores, rubrics
├── access.schema.ts        # unlocks, subscriptions
├── identity.schema.ts      # users, sessions
└── index.ts                # Re-exports all
```

**Risk:** Low — purely organizational. All re-exported from `index.ts` for backwards compatibility.

---

## Summary of Key Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| **P0** | Extract `TierCalculator` as pure function + `LLMEvaluator` port | Unlocks testability of grading without LLM calls |
| **P0** | Fix `needsGrading` filter in grading scheduler | Fixes correctness bug — currently re-grades everything |
| **P1** | Create `EntitlementService` as single access authority | Eliminates fragmented entitlement logic |
| **P1** | Introduce domain events via `@nestjs/event-emitter` | Decouples modules without infrastructure overhead |
| **P2** | Extract `ContentRepository` port | Prepares for future S3 migration without touching business logic |
| **P2** | Split schema file by domain | Improves developer orientation and ownership clarity |

---

The Evaluation BC restructuring alone — which directly addresses the stated pain point — would make grading independently testable (mock the LLM port), deterministically verifiable (pure tier calculation), and correctly scoped (only grade what needs grading).
