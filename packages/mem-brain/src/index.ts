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
  LintReport,
  ContradictionFinding,
  StalePageFinding,
  OrphanFinding,
  MissingPageFinding,
  BrokenLinkFinding,
  LowConfidenceFinding,
  EntityMention,
} from "./wiki-engine.js";
