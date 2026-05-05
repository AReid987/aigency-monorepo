# Meta Code Squad — Core Development Harness

> **Confidence:** 1.0 (canonical source)  
> **Last confirmed:** 2026-05-03  
> **Sources:** `raw/aigency-specs/org-agents.md`, `raw/aigency-specs/CLAUDE.md`  
> **Related:** [../constitution.md](../constitution.md), [../org/agent-network.md](../org/agent-network.md), [../architecture/memory-tiers.md](../architecture/memory-tiers.md)

---

## Mission

The Meta Code Squad is the primary development harness for all Aigency platform products. It operates under the AI Coder Constitution and applies the Decide-Act-Verify loop to all engineering tasks.

---

## Squad Members

| Agent | Constitutional Role | Actual Tool | Strengths | Context |
|-------|-------------------|-------------|-----------|---------|
| **Ruflo** | Orchestrator | claude-flow (Ruflo CLI) | Wave coordination, memory, MCP tools, agent-to-agent handoff | 200K |
| **Gemini CLI** | Architect | Google Gemini 2.5 Pro | 1M context, architecture reasoning, large-doc synthesis | 1M |
| **Kimi Code CLI** | Engineer | Moonshot Kimi | Active coding, multi-step execution, error recovery | 128K |
| **iFlow** | Planner | iFlow CLI | Interactive planning, Mermaid diagrams, flow mode | varies |
| **Letta Code** | Librarian | Letta stateful agent | Persistent memory, cross-session state, codebase knowledge | stateful |

---

## Responsibilities by Role

| Role | Responsibilities |
|------|------------------|
| **Orchestrator (Ruflo)** | Manages task list, remembers project state, assigns jobs to agents, coordinates waves, does NOT do implementation work |
| **Architect (Gemini)** | Designs systems, synthesizes large docs, produces architecture artifacts, does NOT write production code |
| **Engineer (Kimi)** | Executes coding tasks, follows the plan, runs quality gates, reports results |
| **Planner (iFlow)** | Produces visual plans, diagrams, and flow artifacts for human review |
| **Librarian (Letta)** | Manages documentation state, cross-session memory, ensures context remains accurate |

---

## Routing Rules

```
New feature / architecture question  -->  Gemini CLI
Active coding / multi-step task      -->  Kimi Code CLI
Wave coordination / memory           -->  Ruflo
Interactive planning / diagrams      -->  iFlow
Cross-session memory recall          -->  Letta Code
Blocker / escalation                 -->  Ruflo --> Antonio
```

---

## Quality Gates

| Agent | Gate 1 (Syntax) | Gate 2 (Logic) | Gate 3 (Security) | Gate 4 (Consensus) |
|-------|----------------|----------------|-------------------|--------------------|
| Ruflo | Validates task completeness | Checks against wave plan | Reviews for scope creep | Signs off on wave completion |
| Gemini | Validates artifact structure | Checks citation coverage | Reviews for spec conflicts | Checks against PRD |
| Kimi | Runs lint/typecheck | Checks acceptance criteria | Runs security scan | Requests Ruflo sign-off |
| Letta | Validates memory blocks | Checks state accuracy | No credentials in memory | Ruflo confirms sync |

---

## Memory Responsibilities

| Agent | Tier 1 (Volatile) | Tier 2 (Long-Term) | Tier 3 (Skills) |
|-------|------------------|-------------------|----------------|
| **Ruflo** | Owns compaction | Coordinates Letta syncs | Owns registry, loads on request |
| **Gemini** | Updates after synthesis tasks | Logs architecture decisions | Loads architecture skill docs |
| **Kimi** | Updates after each code task | Logs implementation decisions | Loads coding skill docs |
| **iFlow** | Updates after planning tasks | Logs planning decisions | Loads diagram skill docs |
| **Letta** | N/A (IS the long-term store) | Primary owner | Responds to skill queries |

---

## Active Stack

```
:8080  SimpleLLMRouter v2  — all LLM calls proxy through here
:8283  Letta Server        — stateful codebase memory
       Sugar AI            — persistent task queue (Ralph loop, 24/7)
       Loki Mode           — RARV kanban execution cycle
       Ruflo               — 12 daemon workers, context autopilot, MCP tools
```

---

## Handoff Protocol

1. Complete task, write artifact to `.planning/`
2. Write handoff note to `.planning/handoffs/<timestamp>-<from>-to-<to>.md`
3. Handoff note includes: what was produced, decisions made, open questions, recommended next action
4. Notify Ruflo

---

## Related Pages

- [agile-squad.md](./agile-squad.md) — Product-oriented squad
- [landing-page-squad.md](./landing-page-squad.md) — Marketing-oriented squad
- [nexus-trading.md](./nexus-trading.md) — Trading intelligence squad
- [../constitution.md](../constitution.md) — Governance principles
- [../architecture/integrations.md](../architecture/integrations.md) — Tools used by this squad
