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
| LLM inference | MLX (M1 Pro) + Llama.cpp (Intel ×3 on Tailnet) | Local-first, no Ollama |
| Commit message AI | Ollama (primary) → mlx-lm / llama-cpp (auto-install fallback) | Cross-platform, zero manual setup |
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

The `prepare-commit-msg` hook auto-generates conventional commit messages using a local SLM with automatic backend selection:

```bash
# Priority order (auto-detected):
# 1. Ollama — if installed and model available (qwen2.5:0.5b)
# 2. Python backend — auto-installed on first run:
#    - macOS arm64 (Apple Silicon) → mlx-lm (Metal GPU)
#    - Intel Mac / Linux / Windows → llama-cpp-python (CPU)
# 3. Heuristic fallback — pattern-based message from diff stats
```

**Manual setup** (if you want a specific backend):
```bash
# Install Python backend explicitly (auto-detects platform)
./scripts/automation/setup-slm.sh

# Or force reinstall
./scripts/automation/setup-slm.sh --force
```

**Backend metadata:** `scripts/automation/.slm/backend.json`
**Model:** Qwen2.5-0.5B-Instruct GGUF (~350MB)

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

This project is indexed by GitNexus as **aigency-monorepo** (1465 symbols, 1766 relationships, 16 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/aigency-monorepo/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/aigency-monorepo/context` | Codebase overview, check index freshness |
| `gitnexus://repo/aigency-monorepo/clusters` | All functional areas |
| `gitnexus://repo/aigency-monorepo/processes` | All execution flows |
| `gitnexus://repo/aigency-monorepo/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

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
