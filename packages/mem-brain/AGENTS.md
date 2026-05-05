# @aigency/mem-brain — Agent Entry Point

> **Read this when working with memory systems in the Aigency monorepo.**

---

## What is Mem-Brain?

Mem-Brain is the unified memory layer for all Aigency agents. It has two halves:

1. **Runtime Memory** — `MemBrain` class for live operations (SurrealDB + Honcho)
2. **Persistent Knowledge** — LLM-Wiki for compounding organizational knowledge

---

## Runtime Memory

Use the `MemBrain` class for:
- Directive CRUD (active directives, priorities)
- Pattern search (vector similarity over embeddings)
- Timeline logging (events, milestones, agent actions)
- Honcho sessions (peer identity, cross-session reasoning)
- ORACLE dreams (async cross-session queries)

```typescript
import { MemBrain } from "@aigency/mem-brain";
```

See [`src/mem-brain.ts`](./src/mem-brain.ts) for API.

---

## Persistent Knowledge (LLM-Wiki)

The [`llm-wiki/`](./llm-wiki/) directory is a living knowledge base maintained by AI agents. It follows the Karpathy LLM-Wiki pattern with v2 enhancements.

### When to Use the Wiki

- Answering questions about Aigency organization, architecture, or processes
- Onboarding new agents to the system
- Resolving contradictions between sources
- Crystallizing completed work into reusable knowledge

### When to Use Runtime Memory

- Live directive tracking
- Real-time pattern matching
- Session management
- Timeline event logging

### Agent Schema

When maintaining the wiki, read [`llm-wiki/AGENTS.md`](./llm-wiki/AGENTS.md) FIRST. It defines:
- Page format (confidence scoring, frontmatter)
- Ingest/query/lint/crystallize operations
- Knowledge graph conventions
- Quality standards
- Golden rules

---

## Memory Architecture

Aigency implements a 3-tier memory system:

```
Tier 1: Volatile (CONTINUITY)     — Session state, continuity.md
Tier 2: Long-Term (LEDGERS)       — Decision logs, Letta memory
Tier 3: On-Demand (SKILLS)        — Skill registry, loaded per task
```

See [`llm-wiki/wiki/architecture/memory-tiers.md`](./llm-wiki/wiki/architecture/memory-tiers.md) for full details.

---

## Key Conventions

- **Never call LLM APIs directly** — Route through SimpleLLMRouter (:8080)
- **Log architectural decisions** to `.planning/ledger.md` (Tier 2)
- **Update continuity.md** after every action (Tier 1)
- **Maintain the wiki** — Update index.md and log.md on every operation
- **Follow the AI Coder Constitution** — Five pillars, Decide-Act-Verify loop

---

## Quick Reference

| Need | Where |
|------|-------|
| Org chart (human) | [`llm-wiki/wiki/org/human-layer.md`](./llm-wiki/wiki/org/human-layer.md) |
| Org chart (agents) | [`llm-wiki/wiki/org/agent-network.md`](./llm-wiki/wiki/org/agent-network.md) |
| AI Constitution | [`llm-wiki/wiki/constitution.md`](./llm-wiki/wiki/constitution.md) |
| Memory architecture | [`llm-wiki/wiki/architecture/memory-tiers.md`](./llm-wiki/wiki/architecture/memory-tiers.md) |
| Integrations | [`llm-wiki/wiki/architecture/integrations.md`](./llm-wiki/wiki/architecture/integrations.md) |
| Squad details | [`llm-wiki/wiki/squads/`](./llm-wiki/wiki/squads/) |
| Wiki maintenance rules | [`llm-wiki/AGENTS.md`](./llm-wiki/AGENTS.md) |
| Runtime API | [`src/mem-brain.ts`](./src/mem-brain.ts) |
