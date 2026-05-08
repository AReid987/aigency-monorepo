// @aigency/surreal — SurrealDB 3.0 client and utilities
// Wraps surrealdb.js with Aigency-specific connection management and helpers.

export { SurrealClient } from "./client.js";
export { LIVE } from "./live.js";
export type {
  AgentRecord,
  DirectiveRecord,
  PatternRecord,
  TimelineRecord,
  PeerRecord,
  AgentMemoryRecord,
  AgentMemoryRelationRecord,
  AgentMemoryRecallTraceRecord,
  JobRecord,
  WikiPageRecord,
  WikiChunkRecord,
  WikiLinkRecord,
  WikiTimelineEntryRecord,
  WikiIngestLogRecord,
  DecidedByEdge,
  InformedByEdge,
  InvolvesEdge,
  ReferencesEdge,
  SupersedesEdge,
  GeneratedEdge,
} from "./types.js";
