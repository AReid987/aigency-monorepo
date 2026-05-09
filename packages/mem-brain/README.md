# @aigency/mem-brain

> Unified memory layer combining SurrealDB (knowledge graph) and Honcho (peer identity).

## Overview

MemBrain is the central memory system for Aigency agents. It provides:

- **LLM-Wiki v2** — Hybrid search (BM25 + vector + RRF), auto-linking, lint, crystallization
- **ORACLE Runtime** — Agents, directives, patterns, timeline
- **OB1 Governance** — Agent memory with provenance, lifecycle, and review status
- **Job Queue** — Minions-style Postgres-native queue with DAG support
- **MCP Server** — OAuth 2.1 scoped remote access (15 methods)
- **Crystal Graft** — Cryptographically-signed knowledge graph snapshots

## Usage

```typescript
import { MemBrain } from "@aigency/mem-brain";

const brain = new MemBrain({
  surreal: { url: "ws://localhost:8000/rpc", namespace: "aigency", database: "mem_brain", username: "root", password: "root" },
  honcho: { apiKey: "...", workspaceId: "aigency-dev" },
});

await brain.connect();

// Wiki operations
const page = await brain.wiki.createPage({ slug: "atlas", type: "agent", title: "ATLAS", compiled_truth: "...", ... });
const results = await brain.wiki.hybridSearch("routing logic", embedding);

// Agent memory (OB1 governance)
await brain.createAgentMemory("vector", { content: "New insight...", agent: "atlas", provenance: "observed" });
```

## Commands

```bash
pnpm test          # run tests
pnpm test:coverage # run tests with coverage
pnpm typecheck     # TypeScript check
pnpm build         # build with tsup
```

## Schema

See [`src/schema.surql`](./src/schema.surql) for the full SurrealDB schema including ORACLE tables, wiki tables, graph edges, agent memory sidecar, and job queue.
