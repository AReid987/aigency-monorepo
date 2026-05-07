# Aigency LLM-Wiki v3

> **Human-facing documentation.** For agent instructions, see [`AGENTS.md`](./AGENTS.md).

---

## What is this?

The Aigency LLM-Wiki is a **persistent, compounding knowledge base** maintained by AI agents. It is an implementation of [Karpathy's LLM-Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), extended with v2/v3 enhancements from production experience: confidence scoring, knowledge graphs, memory lifecycle management, and event-driven automation.

This is **not** a RAG system. RAG retrieves and forgets. The LLM-Wiki accumulates and compounds. Knowledge is compiled once and kept current — not re-derived on every query.

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│  Layer 3: SCHEMA (AGENTS.md)            │
│  Rules for how the LLM maintains wiki   │
├─────────────────────────────────────────┤
│  Layer 2: WIKI (wiki/)                  │
│  LLM-generated markdown pages           │
│  — summaries, entity pages, concepts    │
├─────────────────────────────────────────┤
│  Layer 1: RAW SOURCES (apps/docs/)      │
│  Canonical system documentation         │
│  — architecture, agents, services       │
└─────────────────────────────────────────┘
```

### Layer 1: Raw Sources

The canonical source documents live in `apps/docs/` — the documentation app for the Aigency system. These include:

- `01-getting-started/` — Overview, setup, quick reference
- `02-deep-dive/` — Architecture, agent system, data layer, frontend
- `02-deep-dive/apps/` — Router, Membrane, ORACLE, Librarian, Contracts, TELOS
- `03-agents/` — Per-agent deep dives
- `onboarding/` — Role-specific onboarding guides

These are **immutable** from the wiki's perspective — the LLM reads from them but does not modify them.

### Layer 2: The Wiki

A directory of LLM-generated markdown files. Summaries, entity pages, concept pages, comparisons. The LLM **owns this layer entirely**. It creates pages, updates them when new sources arrive, maintains cross-references, and keeps everything consistent.

You read it; the LLM writes it.

### Layer 3: The Schema

[`AGENTS.md`](./AGENTS.md) tells the LLM how the wiki is structured, what the conventions are, and what workflows to follow. This is the key configuration file — it's what turns the LLM from a generic chatbot into a **disciplined wiki maintainer**.

---

## Wiki Pages

| Page | Description |
|------|-------------|
| [wiki/index.md](./wiki/index.md) | Content catalog of all wiki pages |
| [wiki/log.md](./wiki/log.md) | Chronological activity log |
| [wiki/architecture/overview.md](./wiki/architecture/overview.md) | High-level system architecture |
| [wiki/architecture/data-layer.md](./wiki/architecture/data-layer.md) | SurrealDB + Honcho + MemBrain |
| [wiki/agents/registry.md](./wiki/agents/registry.md) | 11 registered agent identities |
| [wiki/services/router.md](./wiki/services/router.md) | LLM Router (OpenAI-compatible proxy) |
| [wiki/services/membrane.md](./wiki/services/membrane.md) | 3D spatial frontend |
| [wiki/services/oracle.md](./wiki/services/oracle.md) | Persistent memory agent service |
| [wiki/services/librarian.md](./wiki/services/librarian.md) | Knowledge graph curator |
| [wiki/services/contracts.md](./wiki/services/contracts.md) | On-chain quality gates |
| [wiki/services/telos.md](./wiki/services/telos.md) | Deep Context Framework |
| [wiki/frontend/design-tokens.md](./wiki/frontend/design-tokens.md) | Design system & Membrane UI |

---

## Operations

### Ingest

When `apps/docs/` is updated, tell the LLM to process the changes. The LLM will:
1. Read the updated sources
2. Discuss key takeaways
3. Write or update summary pages
4. Update relevant entity and concept pages
5. Append an entry to `log.md`

### Query

Ask questions against the wiki. The LLM searches `index.md`, reads relevant pages, and synthesizes an answer with citations. Good answers can be filed back into the wiki as new pages.

### Lint

Periodically ask the LLM to health-check the wiki:
- Contradictions between pages
- Stale claims superseded by newer sources
- Orphan pages with no inbound links
- Missing cross-references
- Data gaps

---

## Memory Lifecycle (v2/v3 Enhancements)

Beyond Karpathy's original pattern, Aigency LLM-Wiki implements:

| Feature | Description |
|---------|-------------|
| **Confidence scoring** | Every fact carries a score: source count, recency, contradictions |
| **Supersession** | New info explicitly supersedes old, with links and timestamps |
| **Forgetting curve** | Unaccessed facts gradually fade (Ebbinghaus decay) |
| **Consolidation tiers** | Working → Episodic → Semantic → Procedural memory pipeline |
| **Knowledge graph** | Typed entities and relationships layered on top of pages |
| **Event-driven hooks** | Auto-ingest, auto-lint, context injection on session start/end |
| **Crystallization** | Completed work threads distilled into structured digests |

---

## Tooling

- **Obsidian** — Recommended viewer for the wiki (graph view, wikilinks)
- **Git** — Version history, branching, collaboration
- **qmd** — Optional local search engine when pages grow past ~100

---

## Philosophy

> *The tedious part of maintaining a knowledge base is not the reading or the thinking — it's the bookkeeping. Updating cross-references, keeping summaries current, noting when new data contradicts old claims. Humans abandon wikis because the maintenance burden grows faster than the value. LLMs don't get bored, don't forget to update a cross-reference, and can touch 15 files in one pass.*
>
> *The human's job is to curate sources, direct the analysis, ask good questions, and think about what it all means. The LLM's job is everything else.*

The Memex is finally buildable. Not because we have better documents or better search, but because we have **librarians that actually do the work**.
