# TELOS

> **Confidence:** 0.9
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/apps/telos.md`, `apps/telos/TELOS.md`, `apps/telos/README.md`
> **Supersedes:** N/A
> **Related:** [../agents/registry.md](../agents/registry.md), [../architecture/overview.md](../architecture/overview.md)

---

## Summary

**TELOS** (τέλος: purpose, end, goal) is Aigency's Deep Context Framework — a structured system for capturing the identity, mission, goals, and operational state of every entity in the ecosystem. It is both a content system (today) and a planned runtime (tomorrow).

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/telos` |
| Type | Content system + future CLI / web UI |
| Format | Markdown |
| Current Version | v0.1 — Content Only |

## Why TELOS Is an App

TELOS sits in `apps/` because it is **deployable and self-contained**:
- Has a planned web UI → App
- Will deploy to Vercel → App
- Has a planned CLI entrypoint → App
- Other apps **read** TELOS files but do not import it as a dependency

TELOS is a **source of truth**, not a shared module.

## Telos Context File (TCF) Structure

Every TCF follows a standardized structure:

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

Goals are **force-ranked**: each goal is half as important as the one before it. This forces ruthless prioritization.

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

## Roadmap

### Phase 1: Content Foundation (Current)
- All TELOS files interview-captured and version-controlled
- Corporate TELOS written by THE_ARCHITECT
- Agent TELOS captured through in-character interviews

### Phase 2: CLI Workflow (Q3 2025)
```bash
npx telos interview --agent zenith
npx telos validate agents/cipher.md
npx telos status
npx telos render agents/zenith.md --output zenith.html
```

### Phase 3: Web UI (Q4 2025)
Static site at `telos.aigency.com` with agent cards, goal visualization, risk heatmap, project timeline, activity log stream, search, git diff viewer.

### Phase 4: Auto-Deployment
GitHub Actions workflow triggers on `apps/telos/**` changes: validate → build → deploy to Vercel.

### Phase 5: Agent Substrate Integration (Q1 2026)
Agents read and update their own TELOS files. All agent edits are PRs requiring THE_ARCHITECT approval.

### Phase 6: TELOS as Protocol (Q2 2026)
Open standard with JSON Schema, NPM package (`telos-framework`), and community templates.

## Current Runtime Code

The runtime is a placeholder:
```typescript
export const VERSION = "0.1.0";
export interface TelosContextFile { /* ... */ }
export function parseTelos(markdown: string): TelosContextFile {
  throw new Error("Not implemented — see Roadmap Phase 2");
}
```

## Ownership

| Callsign | Responsibility |
|----------|---------------|
| THE_ARCHITECT | Personal TELOS, corporate TELOS, framework vision |
| ZENITH | Squad alignment, review cadence |
| CIPHER | CLI tooling, web UI, deployment pipeline |
| ECHO | Public TELOS page content |
| IRIS | Web UI design, agent card design |
