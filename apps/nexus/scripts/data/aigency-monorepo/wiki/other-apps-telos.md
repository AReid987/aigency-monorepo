# Other — apps/telos

# TELOS App (`apps/telos`)

## Overview
**TELOS** (`@aigency/telos`) is Aigency’s Deep Context Framework. It captures the identity, mission, goals, and operational state of every entity in the ecosystem — the company, the founder, and every agent.

> τέλος (telos): purpose, end, goal, ultimate aim.

## Current State (v0.1 — Content Only)

`apps/telos` is a content system today and a runtime tomorrow:

| Asset | Purpose |
|-------|---------|
| `TELOS.md` | Framework spec: what TELOS is and how to use it. |
| `INTERVIEW.md` | 10-phase interview protocol for capturing TELOS. |
| `templates/agent-persona.md` | Pre-interview agent biography template. |
| `templates/TELOS-v1-blank.md` | Blank template for new TELOS files. |
| `agents/*.md` | Skeleton drafts for each of the 8 executive agents. |
| `drafts/*.DRAFT.md` | Placeholder corporate and personal TELOS files. |

## Why an App, Not a Package

TELOS lives in `apps/` because it is deployable and self-contained:

* Planned web UI and CLI entrypoint.
* Intended for Vercel deployment.
* Other apps read TELOS files but do not import TELOS as a library.

## Public Scripts

```bash
pnpm dev        # tsx watch src/dev-server.ts
pnpm build      # tsup src/index.ts src/cli.ts
pnpm start      # node dist/dev-server.js
pnpm typecheck  # tsc --noEmit
```

## Runtime (Future)

* CLI interview workflow: `npx telos interview --agent zenith`
* Validation: `npx telos validate agents/cipher.md`
* Staleness check for files not updated in >30 days.
* Web UI for browsing and updating TELOS files.

## Integration Points

* Uses `@aigency/agent-core` for agent callsigns.
* Agent TELOS files are consumed by ORACLE, MemBrain, and Nexus.
* Corporate TELOS becomes the north-star context for the whole monorepo.
