# Contributor Onboarding

Welcome to Aigency. This guide gets you from zero to a running development environment in 15 minutes.

## Prerequisites

- Node.js >= 20
- pnpm >= 9.15.4
- SurrealDB 3.0+ (for memory services)
- Foundry (optional, for contracts)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start SurrealDB
surreal start --user root --pass root

# 3. Build packages
pnpm build

# 4. Start dev mode
pnpm dev
```

## Project Structure

```
aigency-monorepo/
├── apps/         # Deployable services (Router, Membrane, Oracle, etc.)
├── packages/     # Shared libraries (Agent Core, Surreal, Honcho, etc.)
├── agents/       # Agent identity manifests (agent.yaml)
└── wiki/         # This documentation
```

## Key Concepts

1. **Agent-native** — Every feature is designed for agent consumption
2. **Memory as infrastructure** — SurrealDB + Honcho = MemBrain
3. **Local-first** — Prefer MLX/Llama.cpp over cloud APIs
4. **TELOS identity** — Every entity has a purpose document

## Running Individual Services

```bash
pnpm router       # LLM Router on port 8402
pnpm membrane     # 3D UI (Vite)
pnpm oracle       # Memory bootstrap service
```

## Adding an Agent

1. Add entry to `packages/agent-core/src/index.ts` AGENT_REGISTRY
2. Create `agents/<callsign>/agent.yaml`
3. Add TELOS file at `apps/telos/agents/<callsign>.md`
4. Run `pnpm --filter @aigency/oracle seed` to bootstrap SurrealDB

## Code Style

- TypeScript strict mode (`packages/tsconfig/base.json:11`)
- ESM modules (`"type": "module"` in app package.json)
- `tsup` for package builds
- `tsx` for dev execution

## Where to Get Help

- Read `CLAUDE.md` for working memory and immediate next work
- Check `apps/telos/TELOS.md` for identity framework questions
- Review `packages/agent-core/src/index.ts` for agent definitions

## Source Citations

- Root package.json: `package.json:1-30`
- TSConfig strict mode: `packages/tsconfig/base.json:1-20`
- CLAUDE.md working memory: `CLAUDE.md:1-129`
