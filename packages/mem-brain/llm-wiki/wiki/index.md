# Aigency LLM-Wiki Index

> **Last updated:** 2026-05-03  
> **Total pages:** 12  
> **Raw sources:** 6  
> **Schema version:** 1.0

---

## Quick Navigation

| Category | Pages | Description |
|----------|-------|-------------|
| **Constitution** | [constitution.md](./constitution.md) | The AI Coder Constitution — five pillars, Decide-Act-Verify loop, Quality Gates |
| **Organization** | [org/human-layer.md](./org/human-layer.md), [org/agent-network.md](./org/agent-network.md) | Human exec chart + AI agent network hierarchy |
| **Architecture** | [architecture/memory-tiers.md](./architecture/memory-tiers.md), [architecture/integrations.md](./architecture/integrations.md) | 3-tier memory + external service integrations |
| **Squads** | [squads/meta-code-squad.md](./squads/meta-code-squad.md), [squads/agile-squad.md](./squads/agile-squad.md), [squads/landing-page-squad.md](./squads/landing-page-squad.md), [squads/nexus-trading.md](./squads/nexus-trading.md) | All Aigency agent squads and their roles |
| **Chronology** | [log.md](./log.md) | Append-only activity log |

---

## Entity Catalog

### People

| Entity | Role | Page |
|--------|------|------|
| Antonio Reid | Founder & CEO | [org/human-layer.md](./org/human-layer.md) |

### Agents (Meta Code Squad)

| Agent | Role | Tool | Context |
|-------|------|------|---------|
| Ruflo | Orchestrator | claude-flow | 200K |
| Gemini CLI | Architect | Google Gemini 2.5 Pro | 1M |
| Kimi Code CLI | Engineer | Moonshot Kimi | 128K |
| iFlow | Planner | iFlow CLI | varies |
| Letta Code | Librarian | Letta stateful agent | stateful |

### Squads

| Squad | Domain | Lead Agent |
|-------|--------|------------|
| Meta Code Squad | Core development harness | Ruflo |
| Agile Squad | Product & agile ceremonies | Newton "Nexus" Chen |
| Landing Page Squad | LP generation pipeline | Strategy Director |
| NEXUS Trading | Trading intelligence | Meme Coin Intel Orchestrator |

### Systems

| System | Purpose | Integration |
|--------|---------|-------------|
| SimpleLLMRouter v2 | Multi-provider LLM routing | :8080 |
| Letta Server | Stateful codebase memory | :8283 |
| Sugar AI | Persistent task queue | Ralph loop |
| Ruflo | 12 daemon workers, context autopilot | MCP tools |

---

## Source Inventory

| Source | Date Added | Pages Derived |
|--------|------------|---------------|
| `aigency-specs/AI-CODER-CONSTITUTION.md` | 2026-05-03 | constitution.md |
| `aigency-specs/CLAUDE.md` | 2026-05-03 | squads/meta-code-squad.md |
| `aigency-specs/org-core.md` | 2026-05-03 | org/human-layer.md |
| `aigency-specs/org-agents.md` | 2026-05-03 | org/agent-network.md, squads/* |
| `aigency-specs/memory-architecture.md` | 2026-05-03 | architecture/memory-tiers.md |
| `aigency-specs/integrations-spec.md` | 2026-05-03 | architecture/integrations.md |

---

## Cross-References

```
constitution.md
    └─> org/human-layer.md (Decision Authority Matrix references Quality Gates)
    └─> org/agent-network.md (Agent roles reference pillars)
    └─> architecture/memory-tiers.md (Tier 2 LEDGERS reference ledger schema)

org/human-layer.md
    └─> org/agent-network.md (Complementary org layers)
    └─> squads/* (Product domains map to squads)

org/agent-network.md
    └─> squads/* (Detailed squad breakdowns)
    └─> architecture/integrations.md (Tool routing rules)

architecture/memory-tiers.md
    └─> squads/meta-code-squad.md (Agent memory responsibilities)
    └─> constitution.md (Memory management pillar)

architecture/integrations.md
    └─> squads/* (Squad-specific integrations)
```
