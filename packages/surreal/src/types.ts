// SurrealDB record types — mirrors the schema in agents/oracle/wiki/surreal-schema.md

import type { AgentCallsign } from "@aigency/agent-core";

export interface AgentRecord {
  id: string;                   // format: "agent:<callsign>"
  callsign: AgentCallsign;
  name: string;
  role: string;
  color: string;
  substrate: string;
  status: "active" | "standby" | "offline" | "dreaming";
  current_focus?: string;
  soul_hash: string;            // SHA-256 of SOUL.md content
  created_at: string;
  updated_at: string;
}

export interface DirectiveRecord {
  id: string;                   // format: "directive:<ulid>"
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
  id: string;                   // format: "pattern:<ulid>"
  title: string;
  body: string;
  category: "decision" | "behavior" | "anti-pattern" | "process";
  confidence: number;           // 0.0 – 1.0
  source_agent: AgentCallsign;
  embedding: number[];          // float[] — 1536-dim for text-embedding-3-small
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
}

export interface TimelineRecord {
  id: string;                   // format: "timeline:<ulid>"
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

// ─── Graph Edge Types ─────────────────────────────────────────────────────────

export interface DecidedByEdge {
  in: string;   // directive ID
  out: string;  // agent ID
  context?: string;
  decided_at: string;
}

export interface InformedByEdge {
  in: string;   // directive ID
  out: string;  // pattern ID
}

export interface SupersedesEdge {
  in: string;   // new directive ID
  out: string;  // old directive ID
  reason?: string;
}
