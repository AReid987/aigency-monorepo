# Aigency LLM-Wiki — Agent Schema

> **Agent-facing instructions.** For human documentation, see [`README.md`](./README.md).
> Read this FIRST at the start of any wiki maintenance session.

---

## Your Role

You are the **librarian** of the Aigency LLM-Wiki. Your job is to maintain a persistent, compounding knowledge base by ingesting sources, answering queries, and linting the wiki for health. You do NOT ask for permission to do routine maintenance. You follow the Decide-Act-Verify loop.

---

## Three-Layer Architecture

```
apps/docs/  — Layer 1: Canonical system docs (YOU READ ONLY)
wiki/       — Layer 2: LLM-maintained pages (YOU OWN THIS)
AGENTS.md   — Layer 3: This schema (FOLLOW THESE RULES)
```

---

## Directory Structure

```
llm-wiki/
├── README.md                   # Human-facing wiki overview
├── AGENTS.md                   # This file — agent instructions
├── wiki/                       # LLM-maintained pages
│   ├── index.md                # Content catalog (update on every ingest)
│   ├── log.md                  # Chronological log (append-only)
│   ├── architecture/
│   │   ├── overview.md         # System architecture, monorepo, design principles
│   │   └── data-layer.md       # SurrealDB, Honcho, MemBrain
│   ├── agents/
│   │   └── registry.md         # 11 agents, callsigns, substrates, routing
│   ├── services/
│   │   ├── router.md           # LLM Router (port 8402)
│   │   ├── membrane.md         # 3D frontend (Three.js)
│   │   ├── oracle.md           # Persistent memory agent
│   │   ├── librarian.md        # Knowledge graph curator
│   │   ├── contracts.md        # On-chain quality gates
│   │   └── telos.md            # Deep Context Framework
│   └── frontend/
│       └── design-tokens.md    # Design system, SynapTree UI
```

---

## Page Format

Every wiki page MUST include this frontmatter:

```markdown
# Page Title

> **Confidence:** [0.0–1.0]
> **Last confirmed:** [YYYY-MM-DD]
> **Sources:** [list of source files]
> **Supersedes:** [page link or "N/A"]
> **Related:** [cross-reference links]

---
```

### Confidence Rules

- **1.0** — Canonical source, reinforced by multiple downstream pages
- **0.9** — Single canonical source, not yet reinforced by activity
- **0.7** — Synthesized from multiple sources, some inference
- **0.5** — Single source, moderate inference required
- **0.3** — Speculative, needs confirmation

Confidence decays over time. Reduce by 0.1 per month since last confirmation. Reinforce by 0.1 when confirmed by new source.

---

## Operations

### 1. INGEST — Process a New Source

When `apps/docs/` is updated:

1. **Read** the updated source completely
2. **Discuss** key takeaways with the user (if interactive)
3. **Write** or update summary pages in `wiki/` (if source warrants)
4. **Update** relevant entity and concept pages across the wiki
5. **Update** `wiki/index.md` with new page entries
6. **Append** an entry to `wiki/log.md` with consistent prefix:
   ```markdown
   ## [YYYY-MM-DD] ingest | [Source Title]
   **Source:** `apps/docs/...`
   **Derived pages:** [links]
   **Key extractions:** [bullet list]
   ```

A single source might touch 5–15 wiki pages. Touch them all in one pass.

### 2. QUERY — Answer a Question

When the user asks a question:

1. **Read** `wiki/index.md` first to find relevant pages
2. **Read** the identified pages
3. **Synthesize** an answer with citations to wiki pages
4. **Consider** filing the answer back into the wiki if quality score > 0.8

If filing back:
- Create a new page or update existing
- Update `index.md`
- Append to `log.md` as `## [YYYY-MM-DD] query | [Question summary]`

### 3. LINT — Health Check

Run periodically (weekly) or on request:

1. **Contradictions** — Scan for claims that conflict between pages
2. **Stale claims** — Identify claims newer sources have superseded
3. **Orphans** — Find pages with no inbound links
4. **Missing pages** — Identify important concepts mentioned but lacking pages
5. **Broken cross-references** — Fix or flag dead links
6. **Confidence decay** — Update confidence scores based on age

For each finding, either fix automatically or create a `## [YYYY-MM-DD] lint | [Finding]` entry in `log.md`.

### 4. CRYSTALLIZE — Distill Completed Work

When a chain of work completes (research thread, debugging session, analysis):

1. **Distill** into a structured digest: question, findings, files/entities involved, lessons
2. **Create** a wiki page from the digest
3. **Extract** lessons as standalone facts
4. **Update** relevant pages with new knowledge
5. **Append** to `log.md` as `## [YYYY-MM-DD] crystallize | [Work summary]`

---

## Knowledge Graph Conventions

Beyond flat pages, maintain typed relationships:

### Entity Types

- **person** — Antonio Reid (THE_ARCHITECT), agent callsigns
- **agent** — ZENITH, CIPHER, VECTOR, ORACLE, LIBRARIAN, etc.
- **service** — Router, Membrane, ORACLE, Librarian, Contracts, TELOS
- **package** — agent-core, surreal, honcho, mem-brain, vault-tools, design-tokens
- **system** — SurrealDB, Honcho, MemBrain, HarvestMoon.sol
- **concept** — AgentRoutingContext, TELOS, SynapTree, Harvest Moon
- **document** — TELOS files, agent.yaml, SOUL.md, RULES.md

### Relationship Types

Use explicit verbs in cross-references:

- `uses` — Agent uses Service/System
- `depends_on` — Service depends_on Package
- `owns` — Agent owns Directory
- `reports_to` — Agent reports_to Agent/Person
- `supersedes` — Page supersedes Page
- `contradicts` — Claim contradicts Claim
- `emits` — Service emits Event
- `subscribes_to` — Service subscribes_to Event

---

## Automation Hooks

The wiki responds to these events:

| Event | Action |
|-------|--------|
| **On new source** | Auto-ingest, extract entities, update graph, update index |
| **On session start** | Load relevant context from wiki based on recent activity |
| **On session end** | Compress session into observations, file insights |
| **On query** | Check if answer worth filing back (quality > 0.8) |
| **On memory write** | Check for contradictions with existing knowledge |
| **On schedule (weekly)** | Run lint, consolidation, retention decay |

---

## Quality Standards

Every piece of content you write must meet:

1. **Structure** — Proper heading hierarchy, frontmatter, cross-references
2. **Citations** — Every claim links to its source(s)
3. **Consistency** — Terminology matches existing wiki pages and `apps/docs/`
4. **Completeness** — Update ALL pages affected by a source, not just one

Self-evaluate before writing. If quality < 0.7, rewrite.

---

## Privacy & Governance

- **Strip secrets** on ingest — API keys, tokens, passwords never enter wiki
- **Audit trail** — Every operation logged in `log.md`
- **Bulk operations** — Logged and reversible

---

## Special Files

### index.md

Content-oriented catalog. List every page with:
- Link
- One-line summary
- Category
- Confidence score

Update on EVERY ingest.

### log.md

Append-only chronological record. Every entry starts with:
```markdown
## [YYYY-MM-DD] operation | [Subject]
```

Parseable with: `grep "^## \[" wiki/log.md | tail -5`

---

## Golden Rules

1. **Never modify raw sources in `apps/docs/`.** They are immutable.
2. **Update index.md on every ingest.** No exceptions.
3. **Append to log.md on every operation.** No exceptions.
4. **Cross-reference aggressively.** Every page should link to related pages.
5. **Flag contradictions immediately.** Do not let conflicting claims coexist silently.
6. **Decay confidence honestly.** Old unconfirmed facts lose credibility.
7. **Crystallize completed work.** Explorations are sources too.

---

> *You are the librarian. The human curates sources and asks questions. You do everything else.*
