# Aigency LLM-Wiki v2

> **Human-facing documentation.** For agent instructions, see [`AGENTS.md`](./AGENTS.md).

---

## What is this?

The Aigency LLM-Wiki is a **persistent, compounding knowledge base** maintained by AI agents. It is an implementation of [Karpathy's LLM-Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), extended with v2 enhancements from production experience: confidence scoring, knowledge graphs, memory lifecycle management, and event-driven automation.

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
│  Layer 1: RAW SOURCES (raw/)            │
│  Immutable source documents             │
│  — articles, specs, transcripts, data   │
└─────────────────────────────────────────┘
```

### Layer 1: Raw Sources

Your curated collection of source documents. Articles, specs, meeting transcripts, data files. These are **immutable** — the LLM reads from them but never modifies them. This is your source of truth.

Current sources: [raw/aigency-specs/](./raw/aigency-specs/) — ingested from the [aigency-specs](https://github.com/AReid987/aigency-specs) repository.

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
| [wiki/constitution.md](./wiki/constitution.md) | AI Coder Constitution (prominent) |
| [wiki/org/human-layer.md](./wiki/org/human-layer.md) | Human executive org chart |
| [wiki/org/agent-network.md](./wiki/org/agent-network.md) | AI agent network hierarchy |
| [wiki/architecture/memory-tiers.md](./wiki/architecture/memory-tiers.md) | 3-tier memory architecture |
| [wiki/architecture/integrations.md](./wiki/architecture/integrations.md) | External service integrations |
| [wiki/squads/meta-code-squad.md](./wiki/squads/meta-code-squad.md) | Core development squad |
| [wiki/squads/agile-squad.md](./wiki/squads/agile-squad.md) | Product & agile squad |
| [wiki/squads/landing-page-squad.md](./wiki/squads/landing-page-squad.md) | LP generation squad |
| [wiki/squads/nexus-trading.md](./wiki/squads/nexus-trading.md) | Trading intelligence squad |

---

## Operations

### Ingest

Drop a new source into `raw/` and tell the LLM to process it. The LLM will:
1. Read the source
2. Discuss key takeaways
3. Write a summary page
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

## Memory Lifecycle (v2 Enhancements)

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
- **Git** — Version history, branching, collaboration (the wiki is just a git repo of markdown)
- **qmd** — Optional local search engine when pages grow past ~100

---

## Philosophy

> *The tedious part of maintaining a knowledge base is not the reading or the thinking — it's the bookkeeping. Updating cross-references, keeping summaries current, noting when new data contradicts old claims. Humans abandon wikis because the maintenance burden grows faster than the value. LLMs don't get bored, don't forget to update a cross-reference, and can touch 15 files in one pass.*
>
> *The human's job is to curate sources, direct the analysis, ask good questions, and think about what it all means. The LLM's job is everything else.*

The Memex is finally buildable. Not because we have better documents or better search, but because we have **librarians that actually do the work**.
