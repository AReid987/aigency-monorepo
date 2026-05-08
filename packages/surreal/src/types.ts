// SurrealDB record types — mirrors the schema in agents/oracle/wiki/surreal-schema.md

import type { AgentCallsign } from "@aigency/agent-core";

export interface AgentRecord {
  id: string; // format: "agent:<callsign>"
  callsign: AgentCallsign;
  name: string;
  role: string;
  color: string;
  substrate: string;
  status: "active" | "standby" | "offline" | "dreaming";
  current_focus?: string;
  soul_hash: string; // SHA-256 of SOUL.md content
  created_at: string;
  updated_at: string;
}

export interface DirectiveRecord {
  id: string; // format: "directive:<ulid>"
  title: string;
  body: string;
  status: "active" | "pending" | "completed" | "superseded";
  priority: "critical" | "high" | "medium" | "low";
  owner: AgentCallsign;
  created_at: string;
  due_at?: string;
  completed_at?: string;
  tags: string[];
}

export interface PatternRecord {
  id: string; // format: "pattern:<ulid>"
  title: string;
  body: string;
  category: "decision" | "behavior" | "anti-pattern" | "process";
  confidence: number; // 0.0 – 1.0
  source_agent: AgentCallsign;
  embedding: number[]; // float[] — 1536-dim for text-embedding-3-small
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
}

export interface TimelineRecord {
  id: string; // format: "timeline:<ulid>"
  event_type:
    | "session_start"
    | "session_end"
    | "directive_created"
    | "directive_completed"
    | "pattern_detected"
    | "lint_run"
    | "compile_run"
    | "graft_harvested"
    | "agent_status_change"
    | "memory_created"
    | "memory_recall";
  agent: AgentCallsign;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Wiki Record Types (LLM-Wiki v2) ──────────────────────────────────────────

export interface WikiPageRecord {
  id: string; // format: "wiki_page:<slug>"
  slug: string; // unique canonical slug
  source: string; // source repo within brain (e.g., "aigency-wiki")
  type: "person" | "agent" | "service" | "package" | "system" | "concept" | "document" | "meeting" | "project" | "idea";
  title: string;
  compiled_truth: string; // current best understanding (above the line)
  timeline: string; // append-only evidence trail (below the line)
  frontmatter: Record<string, unknown>; // structured metadata
  confidence: number; // 0.0 – 1.0
  last_confirmed: string; // ISO date
  sources: string[]; // source file paths
  supersedes?: string; // slug of superseded page
  status: "active" | "dormant" | "archived";
  search_vector?: string; // SurrealDB full-text search vector
  created_at: string;
  updated_at: string;
}

export interface WikiChunkRecord {
  id: string; // format: "wiki_chunk:<ulid>"
  page_id: string; // FK to wiki_page
  chunk_index: number;
  chunk_text: string;
  chunk_source: "compiled_truth" | "timeline"; // which section
  embedding: number[]; // float[] — 1536-dim
  token_count: number;
  embedded_at: string;
}

export interface WikiLinkRecord {
  id: string; // format: "wiki_link:<ulid>"
  from_page_id: string;
  to_page_id: string;
  link_type: "uses" | "depends_on" | "owns" | "reports_to" | "supersedes" | "contradicts" | "emits" | "subscribes_to" | "references" | "informed_by" | "involves";
  context?: string;
  created_at: string;
}

export interface WikiTimelineEntryRecord {
  id: string; // format: "wiki_timeline:<ulid>"
  page_id: string;
  date: string;
  source: string;
  summary: string;
  detail?: string; // markdown
}

export interface WikiIngestLogRecord {
  id: string;
  source_type: string;
  source_ref: string;
  pages_updated: string[];
  summary: string;
  created_at: string;
}

// ─── Peer Record ──────────────────────────────────────────────────────────────

export interface PeerRecord {
  id: string; // format: "peer:<handle>"
  handle: string;
  name: string;
  relationship: "colleague" | "client" | "advisor" | "stakeholder" | "contractor";
  interaction_count: number;
  tags: string[];
  last_interaction: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Graph Edge Types ─────────────────────────────────────────────────────────

export interface DecidedByEdge {
  in: string; // directive ID
  out: string; // agent ID
  context?: string;
  decided_at: string;
}

export interface InformedByEdge {
  in: string; // directive ID
  out: string; // pattern ID
  confidence?: number;
}

export interface InvolvesEdge {
  in: string; // directive or pattern ID
  out: string; // peer or agent ID
  role?: string;
}

export interface ReferencesEdge {
  in: string; // any record
  out: string; // any record
  context?: string;
  weight?: number;
}

export interface SupersedesEdge {
  in: string; // new directive ID
  out: string; // old directive ID
  reason?: string;
  superseded_at: string;
}

export interface GeneratedEdge {
  in: string; // artifact/timeline ID
  out: string; // agent ID
  tool?: string;
}

// ─── Agent Memory Sidecar (OB1-style governance) ──────────────────────────────

export interface AgentMemoryRecord {
  id: string; // format: "agent_memory:<ulid>"
  agent: AgentCallsign;
  content: string;
  provenance: "observed" | "inferred" | "user_confirmed" | "imported" | "generated";
  lifecycle: "active" | "stale" | "superseded" | "disputed" | "rejected";
  review_status: "pending" | "confirmed" | "evidence_only" | "restricted" | "rejected";
  confidence: number; // 0.00 – 1.00
  can_use_as_instruction: boolean;
  can_use_as_evidence: boolean;
  requires_user_confirmation: boolean;
  embedding?: number[];
  source_refs: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgentMemoryRelationRecord {
  id: string;
  from_memory_id: string;
  to_memory_id: string;
  relation_type: "supersedes" | "conflicts" | "merges" | "supports" | "contradicts";
  context?: string;
  created_at: string;
}

export interface AgentMemoryRecallTraceRecord {
  id: string;
  query_embedding: number[];
  query_text: string;
  agent: AgentCallsign;
  results_returned: string[];
  results_used: string[];
  results_ignored: string[];
  latency_ms: number;
  created_at: string;
}

// ─── Job Queue Record (Minions-style) ─────────────────────────────────────────

export interface JobRecord {
  id: string;
  job_type: string;
  payload: Record<string, unknown>;
  status: "pending" | "running" | "complete" | "failed" | "cancelled";
  priority: number;
  parent_id?: string;
  child_ids: string[];
  attempt_count: number;
  max_attempts: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
