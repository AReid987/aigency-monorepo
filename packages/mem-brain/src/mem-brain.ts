// MemBrain — the unified memory interface
// Single entry point for all agent memory operations.
// Abstracts over SurrealDB (graph) + Honcho (peer identity).

import type { AgentCallsign } from "@aigency/agent-core";
import { HonchoClient } from "@aigency/honcho";
import { LIVE, SurrealClient } from "@aigency/surreal";
import type { DirectiveRecord, PatternRecord, TimelineRecord } from "@aigency/surreal";

export interface MemBrainConfig {
  surreal: {
    url: string;
    namespace: string;
    database: string;
    username: string;
    password: string;
  };
  honcho: {
    apiKey: string;
    workspaceId: string;
    baseUrl?: string;
  };
}

export class MemBrain {
  private honcho: HonchoClient;

  constructor(private config: MemBrainConfig) {
    this.honcho = new HonchoClient(config.honcho);
  }

  async connect(): Promise<void> {
    await SurrealClient.connect(config.surreal);
  }

  // ─── Directive Operations ──────────────────────────────────────────────────

  async getActiveDirectives(): Promise<DirectiveRecord[]> {
    const db = SurrealClient.db;
    const [rows] = await db.query<[DirectiveRecord[]]>(
      "SELECT * FROM directive WHERE status = 'active' ORDER BY priority"
    );
    return rows;
  }

  async createDirective(
    data: Omit<DirectiveRecord, "id" | "created_at">
  ): Promise<DirectiveRecord> {
    const db = SurrealClient.db;
    const [record] = await db.create<DirectiveRecord>("directive", {
      ...data,
      created_at: new Date().toISOString(),
    });
    await this.logEvent("directive_created", data.owner, `Directive created: ${data.title}`);
    return record;
  }

  // ─── Pattern Operations ────────────────────────────────────────────────────

  async searchPatterns(embedding: number[], limit = 5): Promise<PatternRecord[]> {
    const db = SurrealClient.db;
    const [rows] = await db.query<[PatternRecord[]]>(
      `SELECT *, vector::similarity::cosine(embedding, $vec) AS score
       FROM pattern
       WHERE vector::similarity::cosine(embedding, $vec) > 0.75
       ORDER BY score DESC
       LIMIT $limit`,
      { vec: embedding, limit }
    );
    return rows;
  }

  // ─── Timeline & Events ────────────────────────────────────────────────────

  async logEvent(
    eventType: TimelineRecord["event_type"],
    agent: AgentCallsign,
    summary: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const db = SurrealClient.db;
    await db.create("timeline", {
      event_type: eventType,
      agent,
      summary,
      metadata,
      created_at: new Date().toISOString(),
    });
  }

  // ─── LIVE Subscriptions ───────────────────────────────────────────────────

  subscribeToDirectives(
    callback: (action: "CREATE" | "UPDATE" | "DELETE", directive: DirectiveRecord) => void
  ) {
    return LIVE.subscribe<DirectiveRecord>("directive", callback, "status = 'active'");
  }

  subscribeToTimeline(
    callback: (action: "CREATE" | "UPDATE" | "DELETE", event: TimelineRecord) => void
  ) {
    return LIVE.subscribe<TimelineRecord>("timeline", callback);
  }

  // ─── Peer / Session (Honcho) ──────────────────────────────────────────────

  async startAgentSession(callsign: AgentCallsign, metadata?: Record<string, unknown>) {
    const session = await this.honcho.startSession(callsign, metadata);
    await this.logEvent("session_start", callsign, `Session started: ${session.id}`);
    return session;
  }

  async addAgentMessage(
    callsign: AgentCallsign,
    sessionId: string,
    content: string,
    isUser = false
  ) {
    return this.honcho.addMessage(callsign, sessionId, content, isUser);
  }

  /** Ask ORACLE to dream — async cross-session reasoning via Honcho. */
  async oracleDream(query: string): Promise<string> {
    return this.honcho.dream("ORACLE", query);
  }
}
