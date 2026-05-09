// @aigency/mem-brain — Aigency Mem_Brain unified memory layer
// Combines SurrealDB (knowledge graph + temporal state) and Honcho (peer identity + cross-session reasoning)
// This is the runtime memory OS for Aigency's 10 executive agents.

export { MemBrain } from "./mem-brain.js";
export type { MemBrainConfig } from "./mem-brain.js";

// LLM-Wiki v2 runtime
export { WikiEngine } from "./wiki-engine.js";
export type {
  WikiEngineConfig,
  HybridSearchResult,
  IntentClassification,
  DedupConfig,
  LintReport,
  ContradictionFinding,
  StalePageFinding,
  OrphanFinding,
  MissingPageFinding,
  BrokenLinkFinding,
  LowConfidenceFinding,
  EntityMention,
} from "./wiki-engine.js";

// Job queue (Minions-style)
export { JobQueue } from "./job-queue.js";
export type { JobRecord, JobQueueConfig, JobHandler } from "./job-queue.js";

// MCP server
export { MCPServer } from "./mcp-server.js";
export type { MCPRequest, MCPResponse, MCPScope } from "./mcp-server.js";

// ORACLE / Letta substrate
export { OracleSubstrate } from "./oracle-substrate.js";
export type {
  LettaConfig,
  DreamRequest,
  DreamResponse,
  CompactRequest,
} from "./oracle-substrate.js";

// Automation jobs
export { registerAllAutomationJobs } from "./automation-jobs.js";
export type {
  CompileJobPayload,
  LintJobPayload,
  FlushJobPayload,
  CompactJobPayload,
} from "./automation-jobs.js";

// Crystal Graft
export { CrystalGraft, DEFAULT_THRESHOLDS } from "./crystal-graft.js";
export type { GraftMetrics, GraftManifest, HarvestThresholds } from "./crystal-graft.js";
