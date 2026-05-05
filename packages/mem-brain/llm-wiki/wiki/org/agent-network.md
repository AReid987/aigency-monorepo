# Agent Network — Aigency AI Agent Org Chart

> **Confidence:** 1.0 (canonical source)  
> **Last confirmed:** 2026-05-03  
> **Sources:** `raw/aigency-specs/org-agents.md`

---

## Hierarchy Overview

```
Antonio Reid (Human — Final Authority)
        |
   Nebula AI (Master Orchestrator — nebula.gg)
        |
        |-- Meta Code Squad (Development Harness)
        |       |-- Ruflo (Orchestrator)
        |       |-- Gemini CLI (Architect)
        |       |-- Kimi Code CLI (Engineer)
        |       |-- iFlow (Planner)
        |       |-- Letta Code (Librarian / Memory)
        |
        |-- Aigency Specialized Agents
                |-- Landing Page Squad
                |-- Forge Learning Squad
                |-- NEXUS Trading Network
                |-- Telegram Scout Agents
```

---

## Meta Code Squad — Core Development Harness

| Agent | Constitutional Role | Actual Tool | Strengths | Context |
|-------|-------------------|-------------|-----------|---------|
| **Ruflo** | Orchestrator | claude-flow (Ruflo CLI) | Wave coordination, memory, MCP tools, agent-to-agent handoff | 200K |
| **Gemini CLI** | Architect | Google Gemini 2.5 Pro | 1M context, architecture reasoning, large-doc synthesis | 1M |
| **Kimi Code CLI** | Engineer | Moonshot Kimi | Active coding, multi-step execution, error recovery | 128K |
| **iFlow** | Planner | iFlow CLI | Interactive planning, Mermaid diagrams, flow mode | varies |
| **Letta Code** | Librarian | Letta stateful agent | Persistent memory, cross-session state, codebase knowledge | stateful |

### Routing Rules

```
New feature / architecture question  -->  Gemini CLI
Active coding / multi-step task      -->  Kimi Code CLI
Wave coordination / memory           -->  Ruflo
Interactive planning / diagrams      -->  iFlow
Cross-session memory recall          -->  Letta Code
Blocker / escalation                 -->  Ruflo --> Antonio
```

### Memory Responsibilities

| Agent | Tier 1 (Volatile) | Tier 2 (Long-Term) | Tier 3 (Skills) |
|-------|------------------|-------------------|----------------|
| **Ruflo** | Owns compaction | Coordinates Letta syncs | Owns registry, loads on request |
| **Gemini** | Updates after synthesis tasks | Logs architecture decisions | Loads architecture skill docs |
| **Kimi** | Updates after each code task | Logs implementation decisions | Loads coding skill docs |
| **iFlow** | Updates after planning tasks | Logs planning decisions | Loads diagram skill docs |
| **Letta** | N/A (IS the long-term store) | Primary owner | Responds to skill queries |

See also: [../architecture/memory-tiers.md](../architecture/memory-tiers.md) for full memory architecture.

---

## Specialized Squads

| Squad | Domain | Detail Page |
|-------|--------|-------------|
| **Landing Page Squad** | LP generation pipeline | [../squads/landing-page-squad.md](../squads/landing-page-squad.md) |
| **Agile Squad** | Product & agile ceremonies | [../squads/agile-squad.md](../squads/agile-squad.md) |
| **NEXUS Trading** | Trading intelligence | [../squads/nexus-trading.md](../squads/nexus-trading.md) |
| **Forge Squad** | AI-powered learning | (TBD) |

---

## Cross-Agent Communication Protocol

1. Complete task, write artifact to `.planning/`
2. Write handoff note to `.planning/handoffs/<timestamp>-<from>-to-<to>.md`
3. Handoff note includes: what was produced, decisions made, open questions, recommended next action
4. Notify Ruflo (or Nebula for specialized squads)

---

## Quality Gate Enforcement by Agent

| Agent | Gate 1 (Syntax) | Gate 2 (Logic) | Gate 3 (Security) | Gate 4 (Consensus) |
|-------|----------------|----------------|-------------------|--------------------|
| Ruflo | Validates task completeness | Checks against wave plan | Reviews for scope creep | Signs off on wave completion |
| Gemini | Validates artifact structure | Checks citation coverage | Reviews for spec conflicts | Checks against PRD |
| Kimi | Runs lint/typecheck | Checks acceptance criteria | Runs security scan | Requests Ruflo sign-off |
| Letta | Validates memory blocks | Checks state accuracy | No credentials in memory | Ruflo confirms sync |

---

## Related Pages

- [human-layer.md](./human-layer.md) — Human command counterpart
- [../constitution.md](../constitution.md) — Governance principles
- [../squads/meta-code-squad.md](../squads/meta-code-squad.md) — Detailed Meta Code Squad
- [../architecture/integrations.md](../architecture/integrations.md) — Tools each agent uses
