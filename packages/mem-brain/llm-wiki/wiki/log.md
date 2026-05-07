# Aigency LLM-Wiki Activity Log

> Append-only chronological record of all wiki operations.
> Parseable with: `grep "^## \[" log.md | tail -5`

---

## [2026-05-03] rewrite | Wiki v2 → v3 Migration
**Agent:** Claude Code (Aigency)
**Sources:** `apps/docs/` (10 documentation files)
**Pages affected:** 11 created, 12 removed
**Operation:** Complete rewrite of LLM-Wiki to reflect the actual Aigency system architecture. Removed all outdated bmad/Meta Code Squad content (constitution, human-layer, agent-network, memory-tiers, integrations, 4 squad pages). Created new pages from `apps/docs/` canonical documentation: architecture/overview, architecture/data-layer, agents/registry, services/router, services/membrane, services/oracle, services/librarian, services/contracts, services/telos, frontend/design-tokens. Updated index.md catalog and cross-references.

---

## [2026-05-03] init | Wiki Bootstrap (v2)
**Agent:** Claude Code (Aigency)
**Sources:** 6 files from aigency-specs repo
**Pages created:** 12
**Operation:** Initial seeding of Aigency LLM-Wiki v2. Ingested raw sources from aigency-specs repository (constitution, CLAUDE.md, org charts, memory architecture, integrations spec). Created wiki pages: constitution, human-layer, agent-network, memory-tiers, integrations, and 4 squad pages. Index and log initialized.

---

## [2026-05-03] ingest | aigency-specs/AI-CODER-CONSTITUTION.md
**Source:** `raw/aigency-specs/AI-CODER-CONSTITUTION.md`
**Derived pages:** [constitution.md](./constitution.md) *(removed in v3 rewrite)*
**Key extractions:**
- Five pillars: Autonomy, Context, Verification, Atomicity, Constraints
- Decide-Act-Verify loop with Mermaid diagram
- Four functional roles: Orchestrator, Engineer, Critic, Librarian
- Four Quality Gates: Syntax, Logic, Security, Consensus
- Three memory tiers: Volatile, Long-Term, On-Demand

---

## [2026-05-03] ingest | aigency-specs/org-core.md + org-agents.md
**Sources:** `raw/aigency-specs/org-core.md`, `raw/aigency-specs/org-agents.md`
**Derived pages:** [org/human-layer.md](./org/human-layer.md), [org/agent-network.md](./org/agent-network.md), [squads/meta-code-squad.md](./squads/meta-code-squad.md), [squads/agile-squad.md](./squads/agile-squad.md), [squads/landing-page-squad.md](./squads/landing-page-squad.md), [squads/nexus-trading.md](./squads/nexus-trading.md) *(all removed in v3 rewrite)*
**Key extractions:**
- Human exec layer: Antonio Reid as final authority
- Agent hierarchy: Nebula AI -> Meta Code Squad + Specialized Agents
- 4 specialized squads identified with full role tables
- Routing rules: Gemini=arch, Kimi=code, Ruflo=coordination
- Cross-agent handoff protocol defined

---

## [2026-05-03] ingest | aigency-specs/memory-architecture.md
**Source:** `raw/aigency-specs/memory-architecture.md`
**Derived pages:** [architecture/memory-tiers.md](./architecture/memory-tiers.md) *(removed in v3 rewrite)*
**Key extractions:**
- Tier 1 (Volatile): continuity.md, handoffs, Ruflo compaction
- Tier 2 (Long-Term): ledger.md, Letta memory blocks, Letta server
- Tier 3 (On-Demand): skills registry, skill files, skill loader
- Memory flow diagram: 8-step session lifecycle
- Agent responsibilities matrix

---

## [2026-05-03] ingest | aigency-specs/integrations-spec.md
**Source:** `raw/aigency-specs/integrations-spec.md`
**Derived pages:** [architecture/integrations.md](./architecture/integrations.md) *(removed in v3 rewrite)*
**Key extractions:**
- 4 integration categories: AI/LLM, Dev Tooling, Communication, Data
- 6 LLM providers routed through SimpleLLMRouter
- GitHub, Linear, Notion for dev tooling
- Telegram, Discord, Gmail for communication
- Supabase, Google Workspace for data
