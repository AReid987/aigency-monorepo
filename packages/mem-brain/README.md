# @aigency/mem-brain

> **Aigency Mem_Brain — Unified Memory Layer**
>
> Combines SurrealDB (knowledge graph + temporal state) and Honcho (peer identity + cross-session reasoning) with an LLM-Wiki for persistent, compounding organizational knowledge.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MEM-BRAIN UNIFIED LAYER                   │
├─────────────────────────┬───────────────────────────────────┤
│  Runtime Memory (DB)    │  Persistent Knowledge (Files)     │
│  ─────────────────────  │  ─────────────────────────────    │
│  SurrealDB              │  LLM-Wiki (Karpathy pattern v2)   │
│  ├── directives         │  ├── raw/ (immutable sources)     │
│  ├── patterns           │  ├── wiki/ (LLM-maintained)       │
│  └── timeline           │  └── AGENTS.md (schema)           │
│                         │                                   │
│  Honcho                 │  GitNexus (knowledge graph)       │
│  ├── peer sessions      │  └── .gitnexus/                   │
│  ├── cross-session chat │                                   │
│  └── ORACLE dreams      │                                   │
└─────────────────────────┴───────────────────────────────────┘
```

---

## Runtime API

The `MemBrain` class provides the runtime interface for agent memory operations:

```typescript
import { MemBrain } from "@aigency/mem-brain";

const mb = new MemBrain(config);
await mb.connect();

// Directives
const directives = await mb.getActiveDirectives();
await mb.createDirective({ title: "...", owner: "ATLAS", priority: 1 });

// Pattern search (vector similarity)
const patterns = await mb.searchPatterns(embedding, 5);

// Timeline events
await mb.logEvent("milestone", "RUFLO", "Phase 1 complete", { gate: 4 });

// Honcho sessions
const session = await mb.startAgentSession("CIPHER");
await mb.addAgentMessage("CIPHER", session.id, "Analysis complete");

// ORACLE dream
const insight = await mb.oracleDream("What patterns exist in recent failures?");
```

See [`src/mem-brain.ts`](./src/mem-brain.ts) for full API.

---

## LLM-Wiki

The [`llm-wiki/`](./llm-wiki/) directory implements the [Karpathy LLM-Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) extended with v2 production enhancements (confidence scoring, knowledge graphs, memory lifecycle, event-driven automation).

### Quick Start

```bash
# Ingest a new source
cp my-source.md packages/mem-brain/llm-wiki/raw/
# Then tell the LLM: "ingest raw/my-source.md"

# Query the wiki
# Ask the LLM: "what does the wiki say about memory tiers?"

# Run lint
# Ask the LLM: "lint the wiki for contradictions and orphans"
```

### Structure

| Path | Purpose |
|------|---------|
| [`llm-wiki/raw/`](./llm-wiki/raw/) | Immutable source documents |
| [`llm-wiki/wiki/`](./llm-wiki/wiki/) | LLM-maintained knowledge pages |
| [`llm-wiki/AGENTS.md`](./llm-wiki/AGENTS.md) | Agent schema for wiki maintenance |
| [`llm-wiki/README.md`](./llm-wiki/README.md) | Human documentation |

### Current Knowledge

- **AI Coder Constitution** — Five pillars, Decide-Act-Verify loop, Quality Gates
- **Organization** — Human exec chart + AI agent network (8 squads, 25+ agents)
- **Architecture** — 3-tier memory (Volatile/Long-Term/On-Demand), integration specs
- **Squads** — Meta Code, Agile, Landing Page, NEXUS Trading

---

## GitNexus Integration

The monorepo is indexed by GitNexus (`.gitnexus/` at repo root). The knowledge graph provides:
- Semantic code search across 144 files
- 1,321 nodes, 1,567 edges, 19 clusters
- Cross-reference detection between code and wiki

Sync: `pnpm turbo run gitnexus:sync`

---

## Development

```bash
# Build
pnpm --filter @aigency/mem-brain build

# Dev (watch)
pnpm --filter @aigency/mem-brain dev

# Type check
pnpm --filter @aigency/mem-brain typecheck
```

---

## Package Structure

```
packages/mem-brain/
├── src/
│   ├── index.ts          # Public exports
│   └── mem-brain.ts      # MemBrain class
├── llm-wiki/             # Persistent knowledge base
│   ├── raw/              # Immutable sources
│   ├── wiki/             # LLM-maintained pages
│   ├── AGENTS.md         # Agent maintenance schema
│   └── README.md         # Human documentation
├── package.json
├── tsconfig.json
└── README.md             # This file
```
