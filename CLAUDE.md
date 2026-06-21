# CLAUDE.md — Aigency Monorepo Working Memory

> This file is Claude's working memory for the aigency-monorepo codebase.
> Read this before doing ANY work in this repo.

---

## What This Repo Is

Turborepo monorepo for the Aigency AI operating system.

This is the **runtime codebase** — TypeScript services, smart contracts, the Membraned Interface, **and** the LLM-Wiki persistent knowledge base.

The aigency-vault markdown knowledge store lives separately at `../aigency-vault`.

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
│   └── mem-brain/        @aigency/mem-brain      — MemBrain unified memory layer (SurrealDB + Honcho + LLM-Wiki)
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
pnpm format                               # format all code with Biome
pnpm lint:fix                             # lint and auto-fix with Biome
pnpm autofix                              # run all auto-fixers (biome + imports + sort)
pnpm autofix:check                        # verify without applying fixes
pnpm review                               # CodeRabbit AI review (uncommitted)
pnpm review:agent                         # CodeRabbit review (agent-optimized output)
pnpm commit                               # interactive commit with cz-git
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
| LLM inference | MLX (M1 Pro) + Llama.cpp (Intel ×3 on Tailnet) | Local-first, zero external deps |
| Commit message AI | MLX (macOS arm64) → llama-cpp-python → llamafile → heuristic | Cross-platform, auto-install, zero manual setup |
| LLM router | apps/router (aigency-router v1 migrated) | OpenAI-compat proxy, quota-aware |
| Chain | Base L2 (chain ID 8453) | EVM, low gas, Coinbase alignment |
| Contracts | Foundry | forge + cast + anvil; deploy target Base + Base Sepolia |
| Frontend | React + Three.js + @react-three/fiber | SynapTree 3D graph in browser |
| Package manager | pnpm workspaces | Fast, disk-efficient, strict |
| Build system | Turborepo | Task pipelines with caching |

---

## LLM-Wiki

Persistent knowledge base at `packages/mem-brain/llm-wiki/`:
- **Human docs:** `packages/mem-brain/llm-wiki/README.md`
- **Agent schema:** `packages/mem-brain/llm-wiki/AGENTS.md`
- **Key knowledge:** Constitution, org charts, memory architecture, squad details
- **Ingest sources:** Drop files into `llm-wiki/raw/`, tell the LLM to process
- **Query:** Ask the LLM questions against the wiki

---

## Local SLM for Commit Messages

The `prepare-commit-msg` hook auto-generates conventional commit messages using a local SLM. No manual setup required — the first run auto-installs the best backend for your platform.

```bash
# Priority order (auto-detected):
# 1. MLX          → macOS arm64 (native Metal, fastest)
# 2. llama.cpp    → All platforms (pip wheel, auto-optimizes Metal/AVX2)
# 3. llamafile    → Universal single-binary fallback (no Python)
# 4. Heuristic    → Pattern-based message from diff stats (always works)
```

**Manual setup** (if you want a specific backend):
```bash
# Auto-detect and install best backend for your platform
./scripts/automation/setup-slm.sh

# Force specific backend
./scripts/automation/setup-slm.sh --backend mlx        # macOS arm64 only
./scripts/automation/setup-slm.sh --backend llamacpp   # any platform
./scripts/automation/setup-slm.sh --backend llamafile  # universal binary

# Force reinstall
./scripts/automation/setup-slm.sh --force
```

**Backend metadata:** `scripts/automation/.slm/backend.json`
**Default model:** Qwen3.5-0.8B (~450MB)

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

*Maintained by THE ARCHITECT. Last updated: 2026-05-03.*

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **aigency-monorepo** (2994 symbols, 4904 relationships, 153 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/aigency-monorepo/context` | Codebase overview, check index freshness |
| `gitnexus://repo/aigency-monorepo/clusters` | All functional areas |
| `gitnexus://repo/aigency-monorepo/processes` | All execution flows |
| `gitnexus://repo/aigency-monorepo/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
