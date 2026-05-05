# Memory Tiers — Aigency Platform

> **Confidence:** 1.0 (canonical source)  
> **Last confirmed:** 2026-05-03  
> **Sources:** `raw/aigency-specs/memory-architecture.md`  
> **Related:** [../constitution.md](../constitution.md) §5, [../org/agent-network.md](../org/agent-network.md)

---

## Overview

AI agents have a Context Window — a hard limit on working memory. To build a large, coherent system across multiple agents and sessions, memory is managed across three tiers analogous to CPU registers, RAM, and a hard drive.

```
Tier 1: Volatile (CONTINUITY)     — What am I doing right now?
Tier 2: Long-Term (LEDGERS)       — What decisions have been made?
Tier 3: On-Demand (SKILLS)        — What do I need to know for this specific task?
```

---

## Tier 1: Volatile Memory (CONTINUITY)

**Analogy:** CPU registers / RAM  
**Lifespan:** Current session only  
**Owner:** All agents (write); Ruflo (compaction)

### Implementation

| File | Contents | Updated By |
|------|----------|------------|
| `.planning/continuity.md` | Current task, last action, last error, next step | Every agent after each action |
| `.planning/handoffs/<timestamp>.md` | Inter-agent state transfer | Sending agent |
| Ruflo context compaction | Automatic summarization when context approaches limit | Ruflo daemon |

### continuity.md Schema

```markdown
## Current Task
[What the agent is currently executing]

## Last Action
[What was just done — file written, command run, etc.]

## Last Output / Error
[Result or error from last action]

## Next Step
[What to do next]

## Blockers
[Anything blocking progress — empty if none]
```

### Rules
- Every agent MUST update `continuity.md` after each action
- On session start, read `continuity.md` before reading anything else
- Ruflo fires compaction automatically when context exceeds 80% of window

---

## Tier 2: Long-Term Memory (LEDGERS)

**Analogy:** Hard drive / database  
**Lifespan:** Permanent (git-tracked)  
**Owner:** Letta Code (primary); all agents (append)

### Implementation

| Store | Technology | Contents |
|-------|-----------|----------|
| `.planning/ledger.md` | Markdown (git-tracked) | Chronological decision log |
| `.letta/memory/` | Letta memory blocks | Semantic codebase knowledge |
| Letta server (:8283) | Letta stateful agent | Cross-session queryable memory |

### ledger.md Entry Schema

```markdown
## [YYYY-MM-DD HH:MM] Decision: [Short title]
**Agent:** [Who made the decision]
**Context:** [What problem was being solved]
**Decision:** [What was decided]
**Rationale:** [Why this approach over alternatives]
**Source Doc:** [Which spec doc guided this decision]
**Impact:** [What this decision affects downstream]
```

### Rules
- Every architectural decision MUST be logged to `ledger.md` before moving to next task
- Letta `/init deep` at start of new project phase
- On commit, Letta `/remember` fires automatically via git hook
- Ledger entries are append-only — never delete or edit past entries

---

## Tier 3: On-Demand Skills (SKILL LOADING)

**Analogy:** Loading a program from disk into RAM  
**Lifespan:** Task duration only  
**Owner:** Ruflo (registry); all agents (consumers)

### Implementation

| Component | Location | Purpose |
|-----------|----------|---------|
| Skills registry | `.claude/skills-index.json` | Maps skill names to file paths |
| Skill files | `.claude/skills/<skill-name>.md` | Detailed instructions for specific capability |
| Skill loader | Ruflo daemon | Injects skill content into agent context on demand |

### Skills Registry Schema

```json
{
  "skills": [
    {
      "name": "typescript-module",
      "path": ".claude/skills/typescript-module.md",
      "description": "How to create a TypeScript module in this monorepo",
      "tags": ["typescript", "packages", "monorepo"]
    }
  ]
}
```

### Rules
- Do NOT load all skills at session start. Only load skill relevant to current task
- After skill is used, it can be evicted from context
- Ruflo manages registry; other agents request skills by name
- New skills proposed by any agent but must be reviewed and merged by Ruflo

---

## Memory Flow

```
Session Start
      |
Read continuity.md          (Tier 1)
      |
Query Letta memory          (Tier 2)
      |
Load relevant skill         (Tier 3)
      |
Execute task
      |
Write artifact to .planning/
      |
Update continuity.md        (Tier 1)
      |
Log decision to ledger.md   (Tier 2 — if architectural)
      |
Ruflo compaction            (Tier 1 — if context > 80%)
      |
Git commit -> Letta /remember hook  (Tier 2 — sync)
```

---

## Related Pages

- [../constitution.md](../constitution.md) — Memory management as one of five pillars
- [../org/agent-network.md](../org/agent-network.md) — Agent memory responsibilities
- [integrations.md](./integrations.md) — SimpleLLMRouter integration for Letta queries
