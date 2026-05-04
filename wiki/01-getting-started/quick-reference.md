# Quick Reference

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm install` | Install all workspace deps |
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages + apps |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | Type-check all workspaces |
| `pnpm clean` | Remove all dist/ + node_modules |
| `pnpm router` | Dev just the router |
| `pnpm membrane` | Dev just the membrane UI |
| `pnpm oracle` | Dev just ORACLE |

## Ports

| Service | Port | Config Location |
|---------|------|-----------------|
| LLM Router | 8402 | `apps/router/config/providers.yaml:5` |
| SurrealDB | 8000 | Default / `SURREAL_URL` env |
| Membrane (Vite) | 5173 | Vite default |

## Agent Registry

All 11 identities are defined in `packages/agent-core/src/index.ts:26-38`:

| Callsign | Name | Role | Color | Substrate |
|----------|------|------|-------|-----------|
| THE_ARCHITECT | Antonio Reid | Founder & Chief Architect | `#FFD700` | human |
| ZENITH | Newton Hughes | Chief of Staff & Orchestrator | `#00E5CC` | OpenClaw |
| VECTOR | Dominique Osei | Strategy & Intelligence | `#7B2FFF` | gptme |
| CIPHER | Roman Voss | Engineering & DevOps | `#39FF14` | gptme |
| ECHO | Selene Navarro | Marketing & Content | `#FF2D78` | TBD |
| ATLAS | Jordan Mercer | Revenue & Sales Ops | `#FFB300` | TBD |
| COMPASS | Imara Adeyemi | Finance & Operations | `#00BFA5` | TBD |
| IRIS | Vivienne Calloway | Design & Brand Systems | `#C77DFF` | TBD |
| HERALD | Dax Okafor | Communications | `#FFFFFF` | Motia |
| ORACLE | Sable Quinn | Persistent Memory Agent | `#1A237E` | Letta/MemGPT |
| LIBRARIAN | Ren Nakamura | Knowledge Graph Curator | `#FF6D00` | ZeroClaw |

## Workspace Packages

| Package | Path | Consumers |
|---------|------|-----------|
| `@aigency/agent-core` | `packages/agent-core` | All apps & packages |
| `@aigency/surreal` | `packages/surreal` | Oracle, Librarian, Mem-Brain, Membrane |
| `@aigency/honcho` | `packages/honcho` | Oracle, Mem-Brain |
| `@aigency/mem-brain` | `packages/mem-brain` | Oracle |
| `@aigency/vault-tools` | `packages/vault-tools` | Librarian |
| `@aigency/design-tokens` | `packages/design-tokens` | Membrane |
| `@aigency/tsconfig` | `packages/tsconfig` | All (dev) |

## File Paths

| Purpose | Path |
|---------|------|
| Agent registry | `packages/agent-core/src/index.ts` |
| SurrealDB client | `packages/surreal/src/client.ts` |
| LIVE queries | `packages/surreal/src/live.ts` |
| MemBrain unified API | `packages/mem-brain/src/mem-brain.ts` |
| Router server | `apps/router/src/server.ts` |
| Router classification | `apps/router/src/router.ts` |
| Membrane App | `apps/membrane/src/App.tsx` |
| Oracle bootstrap | `apps/oracle/src/index.ts` |
| Librarian workflow | `apps/librarian/src/index.ts` |
| HarvestMoon contract | `apps/contracts/src/HarvestMoon.sol` |
| TELOS framework spec | `apps/telos/TELOS.md` |
| Working memory | `CLAUDE.md` |

## Routing Tiers

The router classifies requests into four tiers (`apps/router/src/router.ts:13`):

| Tier | Score Range | Example |
|------|-------------|---------|
| SIMPLE | 0-2 | Greeting, simple fact |
| MEDIUM | 3-5 | Short explanation |
| COMPLEX | 6-9 | Code review, architecture |
| REASONING | 10+ | Multi-step analysis, math |

## Harvest Moon Thresholds

Crystal Graft minting requires (`apps/contracts/src/HarvestMoon.sol:24-28`):

| Metric | Threshold | Source |
|--------|-----------|--------|
| Health Score | >= 85/100 | `vault-tools/lint.ts` |
| Wiki Density | >= 0.70 | `vault-tools/lint.ts` |
| Vault Age | >= 90 days | Genesis: 2026-04-07 |
| Cooldown | 30 days | On-chain |

## Mermaid Color Palette (Dark Mode)

Use these colors in all wiki diagrams:

| Role | Fill | Stroke |
|------|------|--------|
| Primary | `#1e3a5f` | `#4a9eed` |
| Success | `#2d4a3e` | `#4aba8a` |
| Warning | `#5a4a2e` | `#d4a84b` |
| Danger | `#4a2e2e` | `#d45b5b` |
| Neutral | `#2d2d3d` | `#7a7a8a` |
