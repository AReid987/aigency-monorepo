<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **aigency-monorepo** (1321 symbols, 1567 relationships, 16 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

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

---

## Aigency LLM-Wiki — Persistent Knowledge

This repo includes an **LLM-Wiki v2** at `packages/mem-brain/llm-wiki/`. It is a persistent, compounding knowledge base maintained by AI agents — not a RAG system. Knowledge is compiled once and kept current.

### Architecture

```
raw/      — Immutable sources (aigency-specs, articles, transcripts)
wiki/     — LLM-maintained pages (entity pages, concepts, synthesis)
AGENTS.md — Schema for how the LLM maintains the wiki
```

### Key Pages

| Page | What It Contains |
|------|-----------------|
| `packages/mem-brain/llm-wiki/wiki/constitution.md` | AI Coder Constitution — five pillars, Quality Gates |
| `packages/mem-brain/llm-wiki/wiki/org/human-layer.md` | Human executive org chart |
| `packages/mem-brain/llm-wiki/wiki/org/agent-network.md` | Full AI agent network (8 squads, 25+ agents) |
| `packages/mem-brain/llm-wiki/wiki/architecture/memory-tiers.md` | 3-tier memory architecture |
| `packages/mem-brain/llm-wiki/wiki/architecture/integrations.md` | External service integration specs |
| `packages/mem-brain/llm-wiki/wiki/squads/*.md` | Detailed squad breakdowns |

### When to Use the Wiki

- Answering questions about Aigency organization, architecture, or processes
- Onboarding new agents to the system
- Resolving contradictions between sources
- Crystallizing completed work into reusable knowledge

### Agent Schema

When maintaining the wiki, read `packages/mem-brain/llm-wiki/AGENTS.md` FIRST. It defines ingest/query/lint/crystallize operations, knowledge graph conventions, confidence scoring, and golden rules.

<!-- gitnexus:end -->