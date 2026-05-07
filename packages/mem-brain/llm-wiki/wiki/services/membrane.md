# Membrane

> **Confidence:** 0.9
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/apps/membrane.md`, `apps/membrane/src/App.tsx`
> **Supersedes:** N/A
> **Related:** [../frontend/design-tokens.md](../frontend/design-tokens.md), [../architecture/data-layer.md](../architecture/data-layer.md)

---

## Summary

The **Membraned Interface** (`@aigency/membrane`) is Aigency's 3D spatial frontend — a Three.js knowledge graph with frosted glass UI overlays. It renders agent relationships, directives, and timeline data from SurrealDB in real time.

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/membrane` |
| Renderer | Three.js + @react-three/fiber |
| Build Tool | Vite |
| State | Zustand + TanStack Query |
| Animation | Framer Motion |

## Current State

The Membrane is in **scaffolding phase**. `App.tsx` sets up a fullscreen canvas with a dark background from design tokens and ambient lighting. The SynapTree knowledge graph and floating panels are not yet implemented.

## Architecture

```
Render Layer:
  Canvas (@react-three/fiber)
  ├── SynapTree (3D Graph) — NOT YET IMPLEMENTED
  ├── Lighting
  └── PostProcessing

UI Layer:
  Floating Panels (pointerEvents: none)
  ├── QuerySurface (Cmd+K bar) — NOT YET IMPLEMENTED
  ├── DirectiveFeed (left edge) — NOT YET IMPLEMENTED
  └── TimelineRail (bottom scrubber) — NOT YET IMPLEMENTED

Data Layer:
  Zustand (Local State)
  React Query (Server State)
  Surreal LIVE (Real-time)
```

## Design Tokens Integration

Membrane imports tokens from `@aigency/design-tokens`:
- **Canvas background**: `tokens.atoms.color.base.canvas.$value`
- **Agent node colors**: `agentColor(callsign)`
- **Node shapes**: `nodeShape(nodeType)`
- **Temporal opacity**: `opacityForAge(ageHours)`

## Planned Components

| Component | Layer | Purpose |
|-----------|-------|---------|
| SynapTree | 3D | Force-directed knowledge graph of agents, directives, patterns |
| QuerySurface | UI | Cmd+K search bar for ORACLE queries |
| DirectiveFeed | UI | Left-edge panel showing active directives |
| TimelineRail | UI | Bottom scrubber for timeline events |

## Force-Directed Graph

`d3-force-3d` will drive the SynapTree layout:
- Link distance (agent-to-directive, directive-to-pattern)
- Charge repulsion (prevents overlap)
- Centering gravity (keeps graph in view)

## Real-Time Data

SurrealDB LIVE queries stream updates into the 3D scene:
```typescript
LIVE.subscribe<DirectiveRecord>("directive", (action, record) => {
  // Add/remove/update 3D node
}, "status = 'active'");
```

## Build Commands

```bash
pnpm --filter @aigency/membrane dev      # Vite dev server
pnpm --filter @aigency/membrane build    # Production build
pnpm --filter @aigency/membrane preview  # Preview production build
```

## Ownership

CIPHER owns Membrane implementation. IRIS owns design tokens.

## Visual Design Language

- **Dark canvas** — `#0a0a12` background
- **Agent-colored nodes** — Registry colors map to graph nodes
- **Frosted glass panels** — CSS `backdrop-filter: blur()`
- **Temporal opacity** — Older data fades via `opacityForAge()`
- **No traditional chrome** — Everything lives in 3D space or floating panels
