# System Architecture

> **Confidence:** 0.95
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/architecture.md`
> **Supersedes:** `wiki/architecture/memory-tiers.md`, `wiki/architecture/integrations.md`
> **Related:** [data-layer.md](./data-layer.md), [../services/router.md](../services/router.md), [../agents/registry.md](../agents/registry.md)

---

## Summary

Aigency is a **multi-agent AI operating system** structured as a Turborepo monorepo. It separates deployable services (`apps/`), shared libraries (`packages/`), and agent identity manifests (`agents/`). All components communicate through a unified memory layer combining SurrealDB (graph + document + vector) with Honcho (peer identity + cross-session reasoning).

## Layer Structure

| Layer | Components | Purpose |
|-------|-----------|---------|
| **Agents** | ZENITH, CIPHER, VECTOR, ECHO, ATLAS, COMPASS, IRIS, HERALD | 11 registered identities with distinct callsigns, roles, colors, substrates |
| **Services** | Router (8402), Membrane, ORACLE, LIBRARIAN, TELOS | Deployable apps with specific responsibilities |
| **Memory** | MemBrain, SurrealDB 3.0, Honcho | Unified dual-store memory architecture |
| **On-Chain** | HarvestMoon.sol (Base L2) | Quality-gated NFT minting |

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Agent-native** | Every service exposes capabilities consumed by agents; routing context includes `AgentCallsign` |
| **Memory as infrastructure** | SurrealDB handles graph/document/vector; Honcho handles peer sessions; MemBrain unifies both |
| **Local-first inference** | MLX (M1 Pro) + Llama.cpp (Tailnet Intel nodes) preferred over cloud APIs |
| **Quota preservation** | Router classifies requests by complexity and routes to models with largest remaining quotas |
| **Quality-gated minting** | `HarvestMoon.sol` requires lint health >= 85, wiki density >= 0.70, vault age >= 90 days |

## Workspace Dependency Graph

```
Packages (shared libraries):
  @aigency/agent-core  →  used by all apps and packages
  @aigency/surreal     →  depends on agent-core
  @aigency/honcho      →  depends on agent-core
  @aigency/mem-brain   →  depends on agent-core, surreal, honcho
  @aigency/vault-tools →  depends on agent-core
  @aigency/design-tokens → depends on tsconfig

Apps (deployable services):
  @aigency/router      →  depends on agent-core
  @aigency/membrane    →  depends on agent-core, surreal, design-tokens
  @aigency/oracle      →  depends on agent-core, surreal, honcho, mem-brain, vault-tools
  @aigency/librarian   →  depends on agent-core, vault-tools, surreal
  @aigency/telos       →  depends on agent-core
```

## Turborepo Pipeline

Tasks defined in `turbo.json`:

- **`build`**: depends on `^build`, outputs to `dist/**`
- **`dev`**: `cache: false`, `persistent: true`
- **`test`**: depends on `^build`, outputs `coverage/**`
- **`lint`**: inputs `$TURBO_DEFAULT$`
- **`typecheck`**: depends on `^build`

## Request Lifecycle

1. Client sends `POST /v1/chat/completions` to Router
2. Router classifies request across 8 dimensions → tier (SIMPLE/MEDIUM/COMPLEX/REASONING)
3. Router checks rate-limit state, selects optimal model + fallback chain
4. Router forwards to provider, streams response back
5. On 429, marks model rate-limited and tries fallback
6. If all fail, returns 502 `provider_error`

## Memory Architecture

SurrealDB tables: `agent`, `directive`, `pattern`, `timeline`
Graph edges: `decided_by`, `informed_by`, `supersedes`
Honcho primitives: Workspace → Peer → Session → Message

MemBrain (`@aigency/mem-brain`) is the single entry point for all agent memory operations.

## On-Chain Integration

`HarvestMoon.sol` acts as a quality gate. LIBRARIAN runs lint → ORACLE submits metrics → contract validates thresholds before allowing `harvestGraft()` to mint an ERC-721 Crystal Graft.
