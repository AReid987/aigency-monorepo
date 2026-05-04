# AGENTS.md — Aigency Monorepo

> Agent instructions for working in the aigency-monorepo codebase.

## Read Before Any Work

1. **CLAUDE.md** — Working memory with immediate next work, tech decisions, and naming rules
2. **This file** — Agent-specific conventions
3. **Relevant wiki pages** — Deep context at `wiki/02-deep-dive/`

## Repository Identity

- **Type:** Turborepo monorepo (pnpm workspaces)
- **Package Manager:** pnpm 9.15.4
- **Node:** >= 20
- **Default Branch:** main
- **No git remote** — local-only

## Workspace Structure

```
apps/         — Deployable services (router, membrane, oracle, librarian, contracts, telos)
packages/     — Shared libraries (agent-core, surreal, honcho, mem-brain, design-tokens, vault-tools, tsconfig)
agents/       — Agent identity manifests (agent.yaml pointing to aigency-vault/)
wiki/         — This documentation
```

## Critical Naming Rules

- **ZENITH** = Core Exec Squad orchestrator. `agents/zenith/`
- **NEXUS** = Agile Squad orchestrator. **NOT** in this repo's agents/.
- They are identical twins. DO NOT conflate them.

## Key Commands

```bash
pnpm install          # install all workspace deps
pnpm dev              # start all apps in dev mode
pnpm build            # build all packages + apps
pnpm test             # run all tests
pnpm router           # dev just the router (port 8402)
pnpm oracle           # dev just ORACLE
pnpm membrane         # dev just the Membrane UI
```

## Agent Registry

All 11 identities are in `packages/agent-core/src/index.ts` → `AGENT_REGISTRY`. This is the canonical source. Any new agent must be added there first.

## Tech Decisions (Do Not Change Without Discussion)

| Decision | Choice |
|----------|--------|
| DB | SurrealDB 3.0 |
| Peer identity | Honcho ^0.2.0 |
| LLM router | apps/router |
| Chain | Base L2 (8453) |
| Contracts | Foundry |
| Frontend | React + Three.js + @react-three/fiber |
| Build | tsup (packages), vite (membrane), forge (contracts) |

## Adding New Code

- TypeScript strict mode is enforced (`packages/tsconfig/base.json`)
- ESM modules only (`"type": "module"`)
- Use `workspace:*` for internal dependencies
- Add source citations to wiki if changing architecture

## Immediate Next Work (Priority Order)

1. **apps/router** — audit + test, wire QuotaTracker, fix z.ai base URL, add local SLM endpoints, add Portkey gateway, add Claude provider
2. **apps/oracle** — SurrealDB seed + Honcho workspace bootstrap
3. **apps/contracts** — finish AigencyGraft.sol (ERC-721) + AigencyGraftAccess.sol (ERC-20)
4. **apps/membrane** — SynapTree initial render

## Vault Reference

The aigency-vault (markdown knowledge store) lives at `../aigency-vault/` relative to this repo. Agents' SOUL.md + RULES.md are there. The `agent.yaml` in each `agents/<callsign>/` **points to** those files.

## Honcho Note

`honcho-ai@0.2.0` is marked deprecated on npm. Verify current package name before implementing full peer/session layer.
