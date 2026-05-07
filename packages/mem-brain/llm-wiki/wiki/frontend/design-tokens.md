# Frontend & Design Tokens

> **Confidence:** 0.9
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/frontend.md`, `packages/design-tokens/src/index.ts`
> **Supersedes:** N/A
> **Related:** [../services/membrane.md](../services/membrane.md), [../agents/registry.md](../agents/registry.md)

---

## Summary

Aigency's frontend is the **Membraned Interface** — a 3D spatial knowledge graph rendered with Three.js and React, overlaid with frosted glass panels. It consumes design tokens from `@aigency/design-tokens` and connects to SurrealDB for live data.

## Membrane Architecture

```
Membrane App:
  App.tsx
  ├── Canvas (@react-three/fiber)
  │   ├── SynapTree (3D Knowledge Graph) — PLANNED
  │   └── ambientLight
  └── Floating Panels (pointerEvents: none)
      ├── QuerySurface (Cmd+K bar) — PLANNED
      ├── DirectiveFeed (left edge) — PLANNED
      └── TimelineRail (bottom scrubber) — PLANNED

Data Sources:
  @aigency/design-tokens
  @aigency/surreal (LIVE queries)
```

## Current Implementation

The Membrane is in early scaffolding. `App.tsx` renders a fullscreen canvas with dark background from design tokens and ambient lighting. Planned components (SynapTree, QuerySurface, DirectiveFeed, TimelineRail) are not yet implemented.

## Design Tokens

`@aigency/design-tokens` exports W3C DTCG tokens in three tiers:

| Tier | Example | Purpose |
|------|---------|---------|
| Atoms | `color.agent.zenith`, `opacity.fresh` | Primitive values |
| Molecules | (future) | Composed atoms |
| Organisms | (future) | Component-level tokens |

### Token Accessors

```typescript
export const agentColor = (callsign: string): string;
export const nodeShape = (nodeType: string): string;
export const opacityForAge = (ageHours: number): number;
```

### Temporal Opacity

`opacityForAge` maps temporal decay to visual opacity:

| Age | Opacity Token |
|-----|---------------|
| < 24h | `fresh` |
| < 72h | `semi-fresh` |
| < 1 week | `aging` |
| < 1 month | `stale` |
| < 3 months | `archived` |
| >= 3 months | `deprecated` |

## Technology Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `three` | ^0.170.0 | 3D engine |
| `@react-three/fiber` | ^8.17.10 | React renderer for Three.js |
| `@react-three/drei` | ^9.117.3 | Helpers |
| `@react-three/postprocessing` | ^2.16.3 | Screen effects |
| `d3-force-3d` | ^3.0.5 | Force-directed graph layout |
| `zustand` | ^5.0.2 | State management |
| `@tanstack/react-query` | ^5.62.3 | Server state |
| `framer-motion` | ^11.14.1 | UI animations |

## Build Setup

Membrane uses Vite:
```bash
pnpm --filter @aigency/membrane dev     # Vite dev server
pnpm --filter @aigency/membrane build   # Production build
```

Depends on `@aigency/agent-core`, `@aigency/surreal`, `@aigency/design-tokens`.

## Visual Design Language

The Membrane follows IRIS's **SynapTree** design system:
- **Dark canvas** — `#0a0a12` background
- **Agent-colored nodes** — Registry colors map to graph nodes
- **Frosted glass panels** — CSS `backdrop-filter: blur()`
- **Temporal opacity** — Older data fades via `opacityForAge()`
- **No traditional chrome** — Everything lives in 3D space or floating panels

## Planned Data Flow

1. Membrane UI fetches directives via React Query
2. SurrealDB returns `DirectiveRecord[]`
3. UI renders DirectiveFeed
4. LIVE SELECT on timeline streams CREATE events
5. Events append to TimelineRail in real time
