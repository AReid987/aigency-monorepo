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
    | "agent_status_change";
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
}

export interface SupersedesEdge {
  in: string; // new directive ID
  out: string; // old directive ID
  reason?: string;
}
