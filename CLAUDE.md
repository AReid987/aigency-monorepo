# CLAUDE.md — Aigency Monorepo Working Memory

> This file is Claude's working memory for the aigency-monorepo codebase.
> Read this before doing ANY work in this repo.

---

## What This Repo Is

Turborepo monorepo for the Aigency AI operating system.  
**Not** the LLM wiki (that's a separate standalone project).  
**Not** the aigency-vault markdown knowledge store (that lives at `../aigency-vault` or the Mem_Brain folder).

This is the **runtime codebase** — TypeScript services, smart contracts, and the Membraned Interface.

---

## Workspace Structure

```
aigency-monorepo/
├── apps/
│   ├── router/      @aigency/router     — LLM router (migrated from aigency-router v1)
│   ├── membrane/    @aigency/membrane   — Membraned Interface (Three.js + React + SurrealDB)
│   ├── oracle/      @aigency/oracle     — ORACLE memory service (SurrealDB bootstrap + Honcho)
│   ├── librarian/   @aigency/librarian  — LIBRARIAN vault curator (lint + compile + flush)
│   └── contracts/   @aigency/contracts  — Solidity (HarvestMoon.sol, ERC-721/ERC-20)
├── packages/
│   ├── tsconfig/         @aigency/tsconfig      — shared TypeScript base configs
│   ├── agent-core/       @aigency/agent-core    — AGENT_REGISTRY, types, AgentCallsign enum
│   ├── surreal/          @aigency/surreal        — SurrealDB client, LIVE queries, record types
│   ├── honcho/           @aigency/honcho         — Honcho peer/identity client
│   ├── vault-tools/      @aigency/vault-tools    — lint.ts, compile.ts, flush.ts (port of Python scripts)
│   ├── design-tokens/    @aigency/design-tokens  — SynapTree W3C DTCG tokens (atoms/molecules/organisms)
│   └── mem-brain/        @aigency/mem-brain      — MemBrain unified memory layer (SurrealDB + Honcho)
└── agents/
    ├── zenith/ vector/ cipher/ echo/ atlas/ compass/ iris/ herald/
    │   └── agent.yaml    — identity, color, substrate, vault pointer
```

---

## Key Commands

```bash
pnpm install          # install all workspace deps
pnpm dev              # start all apps in dev mode (turbo)
pnpm build            # build all packages + apps
pnpm test             # run all tests
pnpm router           # dev just the router (port 8402)
pnpm oracle           # dev just ORACLE
pnpm membrane         # dev just the Membrane UI

# Per-package
pnpm --filter @aigency/router dev
pnpm --filter @aigency/librarian lint     # run LIBRARIAN lint pass
pnpm --filter @aigency/oracle seed        # bootstrap SurrealDB agent records
```

---

## Critical Naming Rules

- **ZENITH** (Newton Hughes) = Core Exec Squad orchestrator. `agents/zenith/`
- **NEXUS** (Marcus Hale) = Agile Squad orchestrator. NOT in this monorepo's agents/ — separate squad.
- They are identical twins. DO NOT conflate them.
- All 10 exec agents + THE ARCHITECT are in `packages/agent-core/src/index.ts` → `AGENT_REGISTRY`.

---

## Tech Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| DB | SurrealDB 3.0 | Multi-model: graph + vector + document + LIVE queries |
| Peer identity | Honcho ^0.2.0 | Cross-session reasoning, "dreaming" inference |
| LLM inference | MLX (M1 Pro) + Llama.cpp (Intel ×3 on Tailnet) | Local-first, no Ollama |
| LLM router | apps/router (aigency-router v1 migrated) | OpenAI-compat proxy, quota-aware |
| Chain | Base L2 (chain ID 8453) | EVM, low gas, Coinbase alignment |
| Contracts | Foundry | forge + cast + anvil; deploy target Base + Base Sepolia |
| Frontend | React + Three.js + @react-three/fiber | SynapTree 3D graph in browser |
| Package manager | pnpm workspaces | Fast, disk-efficient, strict |
| Build system | Turborepo | Task pipelines with caching |

---

## Immediate Next Work (Priority Order)

1. **apps/router** — audit + test existing source from aigency-router v1
   - Run `pnpm --filter @aigency/router test` (may have failures)
   - Fix: wire QuotaTracker into routing decisions
   - Fix: z.ai broken base URL (remove or fix)
   - Add: local SLM endpoints (MLX M1 Pro port 8080 + Tailnet Intel nodes)
   - Add: Portkey gateway layer (replace raw fetch())
   - Add: Claude/Anthropic provider
   - Add: agent-identity-aware routing context (uses @aigency/agent-core)

2. **apps/oracle** — SurrealDB seed + Honcho workspace bootstrap
   - Requires: SurrealDB running locally (`surreal start --user root --pass root`)
   - Run: `pnpm --filter @aigency/oracle seed`

3. **apps/contracts** — finish AigencyGraft.sol (ERC-721) + AigencyGraftAccess.sol (ERC-20)
   - HarvestMoon.sol is scaffolded at `apps/contracts/src/HarvestMoon.sol`
   - Needs: forge install OpenZeppelin, write AigencyGraft.sol, wire mint() into harvestGraft()

4. **apps/membrane** — SynapTree initial render
   - CIPHER owns implementation
   - Design tokens in `packages/design-tokens/src/synapttree-design-tokens.json`
   - Full spec at `../../aigency-vault/agents/iris/wiki/membraned-interface-spec.md`

---

## Vault Reference

The aigency-vault (markdown knowledge store) lives separately:
- **Local path:** `../aigency-vault/` (relative to this repo)  
- **Mem_Brain folder:** synced via Cowork / iCloud

Agents' SOUL.md + RULES.md are in the vault. The `agent.yaml` in each `agents/<callsign>/` here **points to** those files — it doesn't duplicate them.

---

## honcho-ai Note

`honcho-ai@0.2.0` is marked deprecated on npm. Verify whether the Honcho team has moved to a new package name before implementing the full peer/session layer. Check: https://github.com/plastic-labs/honcho

---

*Maintained by THE ARCHITECT. Last updated: 2026-05-01.*
