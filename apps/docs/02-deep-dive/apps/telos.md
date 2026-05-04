# TELOS

**TELOS** (τέλος: purpose, end, goal) is Aigency's Deep Context Framework — a structured system for capturing the identity, mission, goals, and operational state of every entity in the ecosystem. It is both a content system (today) and a planned runtime (tomorrow).

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/telos` |
| Type | Content system + future CLI / web UI |
| Format | Markdown |
| Current Version | v0.1 — Content Only |

## Why TELOS Is an App

TELOS sits in `apps/` because it is **deployable and self-contained** (`apps/telos/README.md:23-33`):

| Concern | App? | Package? | TELOS |
|---------|------|----------|-------|
| Has a web UI | ✅ | ❌ | ✅ (planned) |
| Deployed to Vercel | ✅ | ❌ | ✅ (planned) |
| Has a CLI entrypoint | ✅ | ❌ | ✅ (planned) |
| Consumed by other apps | ❌ | ✅ | ❌ |

Other apps may **read** TELOS files, but they do not import TELOS as a dependency. TELOS is a **source of truth**, not a shared module.

## Telos Context File (TCF) Structure

Every TCF follows a standardized structure (`apps/telos/TELOS.md:31-78`):

| Section | Required | Description |
|---------|----------|-------------|
| Document Purpose | Yes | Who uses this, how it shapes decisions |
| Entity Identity | Yes | Name, callsign, role, tagline, color, substrate |
| Mission (M) | Yes | Single immutable purpose |
| Problems (P) | Yes | Tensions the entity exists to resolve |
| Goals (G) | Yes | Force-ranked outcomes (G1 > G2 > G3...) |
| KPIs | Yes | Measurable progress indicators |
| Strategies (S) | Yes | Stable approaches to achieve goals |
| Risk Register (R) | Yes | Likelihood × impact matrix |
| Narrative | Yes | Origin story, current state, future direction |
| Infrastructure | No | Tech stack, tools, dependencies |
| Team & Ownership | No | Who is involved, what they own |
| Projects | No | Active and planned initiatives |
| Activity Log | Yes | Append-only changelog |

### Goal Hierarchy Rule

Goals are **force-ranked**: each goal is half as important as the one before it. This forces ruthless prioritization (`apps/telos/TELOS.md:53`).

### TELOS Grammar

| Shorthand | Meaning |
|-----------|---------|
| `M1` | Mission #1 |
| `P1`, `P2` | Problem #1, #2 |
| `G1`, `G2` | Goal #1, #2 |
| `K1`, `K2` | KPI #1, #2 |
| `S1`, `S2` | Strategy #1, #2 |
| `R1`, `R2` | Risk #1, #2 |
| `PRJ-001` | Project reference |

(`apps/telos/TELOS.md:131-141`)

## Directory Structure

```
apps/telos/
├── README.md              # This app's TELOS
├── TELOS.md               # Framework spec
├── INTERVIEW.md           # 10-phase interview protocol
├── package.json           # @aigency/telos
├── src/
│   ├── index.ts           # Runtime placeholder
│   ├── cli.ts             # CLI placeholder
│   └── dev-server.ts      # Future dev server
├── agents/
│   ├── zenith.md          # Skeleton drafts for all 8 agents
│   ├── cipher.md
│   ├── vector.md
│   ├── echo.md
│   ├── atlas.md
│   ├── compass.md
│   ├── iris.md
│   └── herald.md
├── drafts/
│   ├── aigency-corporate.DRAFT.md
│   └── architect-personal.DRAFT.md
└── templates/
    ├── agent-persona.md   # Pre-interview biography
    └── TELOS-v1-blank.md  # Starting template
```

(`apps/telos/README.md:37-62`)

## Roadmap

### Phase 1: Content Foundation (Current)

- All TELOS files interview-captured and version-controlled
- Corporate TELOS written by THE ARCHITECT
- Agent TELOS captured through in-character interviews

### Phase 2: CLI Workflow (Q3 2025)

```bash
npx telos interview --agent zenith
npx telos validate agents/cipher.md
npx telos status
npx telos render agents/zenith.md --output zenith.html
```

Planned components: `cli.ts`, `interview.ts`, `validator.ts`, `renderer.ts`, `parser.ts` (`apps/telos/README.md:106-134`).

### Phase 3: Web UI (Q4 2025)

Static site at `telos.aigency.com` with:
- Agent cards with color, callsign, mission
- Goal hierarchy visualization
- Risk heatmap
- Project timeline
- Activity log stream
- Full-text search
- Git diff viewer

(`apps/telos/README.md:138-172`)

### Phase 4: Auto-Deployment

GitHub Actions workflow triggers on `apps/telos/**` changes:
1. Validate TELOS files
2. Build static site
3. Deploy to Vercel

(`apps/telos/README.md:175-208`)

### Phase 5: Agent Substrate Integration (Q1 2026)

Agents read and update their own TELOS files:
- Self-reporting after project completion
- KPI auto-updating
- Quarterly goal re-evaluation
- Cross-reference other agents' TELOS

All agent edits are PRs requiring THE ARCHITECT approval (`apps/telos/README.md:211-236`).

### Phase 6: TELOS as Protocol (Q2 2026)

Open standard with JSON Schema, NPM package (`telos-framework`), and community templates.

## Current Runtime Code

The runtime is currently a placeholder (`apps/telos/src/index.ts:1-30`):

```typescript
export const VERSION = "0.1.0";

export interface TelosContextFile {
  entity: string;
  mission: string;
  problems: string[];
  goals: string[];
  kpis: string[];
  strategies: string[];
  risks: string[];
  narrative: string;
  projects?: string[];
  activityLog: string[];
}

export function parseTelos(markdown: string): TelosContextFile {
  throw new Error("Not implemented — see Roadmap Phase 2");
}
```

The CLI is also a placeholder (`apps/telos/src/cli.ts:1-16`):

```typescript
#!/usr/bin/env node
console.log("TELOS CLI v0.1.0 — placeholder");
console.log("See apps/telos/README.md for roadmap.");
process.exit(0);
```

## Agent TELOS Files

Each agent's `agent.yaml` links to its TELOS file:

```yaml
# agents/zenith/agent.yaml
telos: "../../apps/telos/agents/zenith.md"
```

(`agents/zenith/agent.yaml:12`)

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| App vs Package | App | Deployable CLI + web UI |
| Content format | Markdown | Human-editable, git-friendly |
| Interview model | Human-led, agent-assisted | Personal TELOS must come from THE ARCHITECT |
| Build target | Static site (SSG) | Content changes slowly |
| Deployment | Vercel + GitHub Actions | Same infra as other apps |
| Styling | `@aigency/design-tokens` | Consistent with Membrane |

(`apps/telos/README.md:252-262`)

## Ownership

| Callsign | Responsibility |
|----------|---------------|
| THE_ARCHITECT | Personal TELOS, corporate TELOS, framework vision |
| ZENITH | Squad alignment, review cadence |
| CIPHER | CLI tooling, web UI, deployment pipeline |
| ECHO | Public TELOS page content |
| IRIS | Web UI design, agent card design |

(`apps/telos/README.md:305-314`)

## Source Citations

- TELOS framework spec: `apps/telos/TELOS.md:1-187`
- TELOS app README: `apps/telos/README.md:1-326`
- Runtime placeholder: `apps/telos/src/index.ts:1-30`
- CLI placeholder: `apps/telos/src/cli.ts:1-16`
- Package config: `apps/telos/package.json:1-32`
- Agent yaml telos field: `agents/zenith/agent.yaml:12`
