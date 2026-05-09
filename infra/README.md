# SuperPrompt Infrastructure

Pulumi-based provisioning for dev infrastructure via local Docker tooling. No CI runners required — developers run bootstrap locally.

## Prerequisites

- Docker
- pnpm

## Architecture

```
infra/
├── package.json              # @pulumi/pulumi + tsx + typescript
├── tsconfig.json
├── .gitignore
│
├── tools/                    # Dev container (Pulumi CLI + gh CLI + Node)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env                  # API keys (DO NOT COMMIT)
│
├── pulumi/dev/               # Pulumi stacks (local state per stack)
│   ├── neon/                # Neon DB project
│   ├── vercel/              # Vercel project
│   ├── render/              # Render service
│   └── github-secrets/      # GitHub Actions secrets sync
│
├── scripts/
│   └── bootstrap-infra.ts   # Orchestrator: spawns stacks, writes outputs JSON
│
└── outputs/                  # Provisioning outputs (gitignored)
    └── infra-outputs-latest.json
```

## Current Status

### Provisioned
| Resource | Status | ID / Value |
|---|---|---|
| Neon DB | Done | `quiet-lake-72949235` |
| Vercel | Done | `prj_IsNSah69X0fdIFjTlxLOsWP9Knx1` |
| GitHub Secrets | Done (2 synced) | `NEON_CONNECTION_STRING`, `VERCEL_PROJECT_ID` |
| Render | **Manual creation required** | 402 — billing required for web services |

### Render Manual Setup

Render's API requires billing info for `web_service` type (even on free tier). Create it manually:

1. Go to https://dashboard.render.com
2. Click `New +` → `Web Service`
3. Connect GitHub: `desirockstar/superprompt`, branch `main`
4. Region: `Oregon`, Instance: `Free`
5. Build: `npm install && pnpm build:backend`
6. Start: `node dist/main.js`
7. Click `Create Web Service`

Once created, re-run bootstrap — it will discover the service by name and sync `RENDER_SERVICE_ID_DEV` to GitHub.

## Quick Start

```bash
# 1. Build infra container
docker compose -f infra/tools/docker-compose.yml build

# 2. Run bootstrap
docker compose -f infra/tools/docker-compose.yml run --rm infra \
  pnpm tsx infra/scripts/bootstrap-infra.ts --env dev
```

Re-runs are idempotent — existing resources are reused.

## Environment Variables

Set in `infra/tools/.env`:

| Variable | Required | Description |
|---|---|---|
| `NEON_API_KEY` | Yes | From https://console.neon.tech |
| `NEON_ORG_ID` | Yes | From https://console.neon.tech |
| `VERCEL_TOKEN` | Yes | From https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | No | Vercel org ID (auto-detected if omitted) |
| `RENDER_API_KEY` | Yes | From https://dashboard.render.com/account |
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` scope |
| `GITHUB_REPO` | No | Format: `owner/repo` (defaults to `desirockstar/superprompt`) |

## Outputs

After bootstrap, outputs are written to:
- `infra/outputs/infra-outputs-latest.json`

```json
{
  "neon": { "projectId": "...", "connectionString": "..." },
  "vercel": { "projectId": "...", "projectUrl": "..." },
  "render": { "serviceId": "...", "serviceUrl": "..." },
  "github-secrets": { "syncedCount": 2 }
}
```

Dated snapshots are also kept: `infra-outputs-{timestamp}.json`.

## Stack Design

Each stack is a standalone script invoked via `spawn("pnpm tsx")` — not a Pulumi program. This avoids CJS/ESM module resolution issues.

The orchestrator (bootstrap-infra.ts) reads `OUTPUT: {...}` from stdout, collects results, writes `infra-outputs-latest.json`, then syncs secrets via `gh secret set`.

### Why not real Pulumi programs?
- `@pulumi/pulumi` is the Node SDK, not the CLI — stacks would need `pulumi up` calls
- Child process + stdout JSON is the simplest pattern for external API calls with local state
- Pulumi state lives in `.pulumi/` dirs per stack (gitignored)

## Destroy

```bash
docker compose -f infra/tools/docker-compose.yml run --rm infra \
  pnpm tsx infra/scripts/bootstrap-infra.ts --destroy
```

Currently a no-op — destroy not implemented since Render service must be deleted manually.

## Secrets Sync

GitHub Actions secrets are synced via `gh secret set` CLI (not manual RSA encryption). The `gh` CLI handles the encryption correctly — Node.js `crypto.publicEncrypt` fails on Curve25519 keys (32-byte).

Secrets synced:
- `NEON_CONNECTION_STRING`
- `VERCEL_PROJECT_ID`
- `RENDER_SERVICE_ID_DEV` (added after manual Render creation)