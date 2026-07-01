# Other — packages/mem-brain

# MemBrain Package (`@aigency/mem-brain`)

## Overview
**MemBrain** is the central memory system for Aigency agents. It unifies SurrealDB (knowledge graph + temporal state) and Honcho (peer identity + cross-session reasoning) into a single runtime memory OS for the 10 executive agents.

## Major Subsystems

| Subsystem | Description |
|-----------|-------------|
| **LLM-Wiki v2** | Hybrid search (BM25 + vector + RRF), auto-linking, lint, crystallization. |
| **ORACLE Runtime** | Agents, directives, patterns, and timeline memory. |
| **OB1 Governance** | Agent memory with provenance, lifecycle, and review status. |
| **Job Queue** | Minions-style Postgres-native queue with DAG support. |
| **MCP Server** | OAuth 2.1 scoped remote access (15 methods). |
| **Crystal Graft** | Cryptographically-signed knowledge graph snapshots. |

## Public Exports

```ts
export { MemBrain, type MemBrainConfig } from "./mem-brain.js";
export { WikiEngine, type WikiEngineConfig, type HybridSearchResult } from "./wiki-engine.js";
export { JobQueue, type JobRecord, type JobQueueConfig } from "./job-queue.js";
export { MCPServer, type MCPRequest, type MCPResponse, type MCPScope } from "./mcp-server.js";
export { OracleSubstrate, type LettaConfig } from "./oracle-substrate.js";
export { CrystalGraft, DEFAULT_THRESHOLDS, type GraftMetrics } from "./crystal-graft.js";
export { registerAllAutomationJobs } from "./automation-jobs.js";
```

## Usage

```ts
import { MemBrain } from "@aigency/mem-brain";

const brain = new MemBrain({
  surreal: { url: "ws://localhost:8000/rpc", namespace: "aigency", database: "mem_brain", username: "root", password: "root" },
  honcho: { apiKey: "...", workspaceId: "aigency-dev" },
});

await brain.connect();

// Wiki operations
const page = await brain.wiki.createPage({ slug: "atlas", type: "agent", title: "ATLAS", compiled_truth: "..." });
const results = await brain.wiki.hybridSearch("routing logic", embedding);

// Agent memory
await brain.createAgentMemory("vector", { content: "New insight...", agent: "atlas", provenance: "observed" });
```

## Public Scripts

```bash
pnpm test          # run tests
pnpm test:coverage # run tests with coverage
pnpm typecheck     # tsc --noEmit
pnpm build         # tsup
```

## Schema

See `packages/mem-brain/src/schema.surql` for the full SurrealDB schema covering ORACLE tables, wiki tables, graph edges, agent memory sidecar, and job queue.

## Integration Points

* Imported by any app/package needing persistent agent memory.
* ORACLE substrate connects to Letta/MemGPT for persistent memory.
* MCP server exposes scoped remote access for external clients.
* Wiki content is referenced by Nexus and other agent UIs.
