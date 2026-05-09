// MemBrain — the unified memory interface
// Single entry point for all agent memory operations.
// Abstracts over SurrealDB (graph) + Honcho (peer identity) + WikiEngine (knowledge).
// Ports: Aigency Core Mem_Brain v1 + GBrain patterns + OB1 governance

import type { AgentCallsign } from "@aigency/agent-core";
import { HonchoClient } from "@aigency/honcho";
import { LIVE, SurrealClient } from "@aigency/surreal";
import type {
  AgentMemoryRecord,
  AgentMemoryRelationRecord,
  DirectiveRecord,
  PatternRecord,
  PeerRecord,
  TimelineRecord,
  WikiPageRecord,
} from "@aigency/surreal";
import { WikiEngine, type WikiEngineConfig } from "./wiki-engine.js";

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
  wiki?: Partial<WikiEngineConfig>;
}

export class MemBrain {
  private honcho: HonchoClient;
  public wiki: WikiEngine;

  constructor(private config: MemBrainConfig) {
    this.honcho = new HonchoClient(config.honcho);
    this.wiki = new WikiEngine({
      source: "aigency-wiki",
      embeddingDim: 1536,
      confidenceDecayRate: 0.1,
      similarityThreshold: 0.7,
      rrfK: 60,
      ...config.wiki,
    });
  }

  async connect(): Promise<void> {
    await SurrealClient.connect(this.config.surreal);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Directive Operations
  // ═══════════════════════════════════════════════════════════════════════════════

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
    const [record] = await db.create("directive", {
      ...data,
      created_at: new Date().toISOString(),
    } as Record<string, unknown>);
    await this.logEvent("directive_created", data.owner, `Directive created: ${data.title}`);
    return record as unknown as DirectiveRecord;
  }

  async completeDirective(id: string, agent: AgentCallsign): Promise<void> {
    const db = SurrealClient.db;
    await db.merge(id, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    await this.logEvent("directive_completed", agent, `Directive completed: ${id}`);
  }

  async supersedeDirective(
    oldId: string,
    newId: string,
    reason: string,
    agent: AgentCallsign
  ): Promise<void> {
    const db = SurrealClient.db;
    await db.merge(oldId, { status: "superseded" });
    await db.create("supersedes", {
      in: newId,
      out: oldId,
      reason,
      superseded_at: new Date().toISOString(),
    } as Record<string, unknown>);
    await this.logEvent("directive_completed", agent, `Directive ${oldId} superseded by ${newId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Pattern Operations
  // ═══════════════════════════════════════════════════════════════════════════════

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

  async recordPattern(
    data: Omit<PatternRecord, "id" | "first_seen" | "last_seen" | "occurrence_count">
  ): Promise<PatternRecord> {
    const db = SurrealClient.db;
    const [record] = await db.create("pattern", {
      ...data,
      occurrence_count: 1,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    } as Record<string, unknown>);
    return record as unknown as PatternRecord;
  }

  async incrementPatternOccurrence(id: string): Promise<void> {
    const db = SurrealClient.db;
    await db.query(
      "UPDATE pattern SET occurrence_count += 1, last_seen = time::now() WHERE id = $id",
      { id }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Peer Operations (Honcho sync layer)
  // ═══════════════════════════════════════════════════════════════════════════════

  async getPeer(handle: string): Promise<PeerRecord | null> {
    const db = SurrealClient.db;
    const [[peer]] = await db.query<[[PeerRecord]]>("SELECT * FROM peer WHERE handle = $handle", {
      handle,
    });
    return peer ?? null;
  }

  async upsertPeer(
    data: Omit<PeerRecord, "id" | "created_at" | "updated_at" | "interaction_count">
  ): Promise<PeerRecord> {
    const db = SurrealClient.db;
    const existing = await this.getPeer(data.handle);

    if (existing) {
      await db.merge(existing.id, {
        ...data,
        interaction_count: (existing.interaction_count ?? 0) + 1,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      // biome-ignore lint/style/noNonNullAssertion: existing code, safe assumption
      return (await this.getPeer(data.handle))!;
    }

    const [record] = await db.create("peer", {
      ...data,
      interaction_count: 1,
      last_interaction: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>);
    return record as unknown as PeerRecord;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Agent Memory Governance (OB1-style)
  // ═══════════════════════════════════════════════════════════════════════════════

  async createAgentMemory(
    data: Omit<AgentMemoryRecord, "id" | "created_at" | "updated_at">
  ): Promise<AgentMemoryRecord> {
    const db = SurrealClient.db;
    const [record] = await db.create("agent_memory", {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>);
    await this.logEvent(
      "memory_created",
      data.agent,
      `Memory created: ${data.content.slice(0, 100)}`
    );
    return record as unknown as AgentMemoryRecord;
  }

  async searchAgentMemory(
    agent: AgentCallsign,
    embedding: number[],
    limit = 5
  ): Promise<(AgentMemoryRecord & { similarity: number })[]> {
    const db = SurrealClient.db;
    const [rows] = await db.query<[(AgentMemoryRecord & { similarity: number })[]]>(
      `SELECT *, vector::similarity::cosine(embedding, $vec) AS similarity
       FROM agent_memory
       WHERE agent = $agent
         AND lifecycle = 'active'
         AND can_use_as_evidence = true
         AND vector::similarity::cosine(embedding, $vec) > 0.7
       ORDER BY similarity DESC
       LIMIT $limit`,
      { agent, vec: embedding, limit }
    );

    // Log recall trace
    await db.create("agent_memory_recall_trace", {
      query_embedding: embedding,
      query_text: "[vector search]",
      agent,
      results_returned: (rows ?? []).map((r) => r.id),
      results_used: (rows ?? []).map((r) => r.id),
      results_ignored: [],
      latency_ms: 0,
      created_at: new Date().toISOString(),
    } as Record<string, unknown>);

    return rows ?? [];
  }

  async relateMemories(
    fromId: string,
    toId: string,
    relationType: AgentMemoryRelationRecord["relation_type"],
    context?: string
  ): Promise<AgentMemoryRelationRecord> {
    const db = SurrealClient.db;
    const [record] = await db.create("agent_memory_relation", {
      in: fromId,
      out: toId,
      relation_type: relationType,
      context,
      created_at: new Date().toISOString(),
    } as Record<string, unknown>);
    return record as unknown as AgentMemoryRelationRecord;
  }

  async reviewMemory(
    id: string,
    reviewStatus: AgentMemoryRecord["review_status"],
    canUseAsInstruction: boolean
  ): Promise<void> {
    const db = SurrealClient.db;
    await db.merge(id, {
      review_status: reviewStatus,
      can_use_as_instruction: canUseAsInstruction,
      updated_at: new Date().toISOString(),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Timeline & Events
  // ═══════════════════════════════════════════════════════════════════════════════

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
    } as Record<string, unknown>);
  }

  async getTimelineForAgent(agent: AgentCallsign, limit = 50): Promise<TimelineRecord[]> {
    const db = SurrealClient.db;
    const [rows] = await db.query<[TimelineRecord[]]>(
      "SELECT * FROM timeline WHERE agent = $agent ORDER BY created_at DESC LIMIT $limit",
      { agent, limit }
    );
    return rows ?? [];
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LIVE Subscriptions
  // ═══════════════════════════════════════════════════════════════════════════════

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

  subscribeToAgentStatus(
    callback: (action: "CREATE" | "UPDATE" | "DELETE", agent: Record<string, unknown>) => void
  ) {
    return LIVE.subscribe<Record<string, unknown>>("agent", callback);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Peer / Session (Honcho)
  // ═══════════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════════
  // Wiki Integration
  // ═══════════════════════════════════════════════════════════════════════════════

  async searchWiki(
    queryText: string,
    queryEmbedding: number[],
    limit = 5
  ): Promise<WikiPageRecord[]> {
    const results = await this.wiki.search(queryText, queryEmbedding, limit);
    return results.map((r) => r.page);
  }

  async crystallizeSession(
    slug: string,
    digest: {
      question: string;
      findings: string;
      filesInvolved: string[];
      lessons: string[];
    }
  ): Promise<WikiPageRecord | null> {
    return this.wiki.crystallize(slug, digest);
  }

  async lintWiki() {
    return this.wiki.lint();
  }

  async getWikiStats() {
    return this.wiki.stats();
  }
}
