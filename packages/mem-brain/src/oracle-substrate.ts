// OracleSubstrate — Letta/MemGPT integration for persistent cross-session memory
// ORACLE is the memory agent that dreams, compacts, and maintains long-term state.
// Ports: Letta architecture (https://github.com/letta-ai/letta) to Aigency stack.

import type { AgentCallsign } from "@aigency/agent-core";
import { SurrealClient } from "@aigency/surreal";
import type { AgentMemoryRecord, PatternRecord, TimelineRecord } from "@aigency/surreal";

export interface LettaConfig {
  baseUrl: string;
  agentId: string;
  apiKey?: string;
}

export interface DreamRequest {
  query: string;
  context?: {
    recentDirectives?: string[];
    activePatterns?: string[];
    peerHandles?: string[];
    sessionHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  };
}

export interface DreamResponse {
  insight: string;
  confidence: number;
  suggestedActions: Array<{
    type: "create_directive" | "update_memory" | "flag_pattern" | "notify_agent";
    target: string;
    payload: Record<string, unknown>;
  }>;
  sources: string[]; // memory IDs used
}

export interface CompactRequest {
  sessionId: string;
  agent: AgentCallsign;
  decisions: string[];
  blockers: string[];
  lessons: string[];
  nextSteps: string[];
}

export class OracleSubstrate {
  constructor(
    private lettaConfig: LettaConfig,
    private db = SurrealClient.db
  ) {}

  // ─── Dream — Cross-Session Reasoning ────────────────────────────────────────

  async dream(request: DreamRequest): Promise<DreamResponse> {
    // Gather context from SurrealDB
    const context = await this.gatherContext(request.context);

    // Call Letta API
    const response = await this.callLetta(`/v1/agents/${this.lettaConfig.agentId}/messages`, {
      messages: [
        {
          role: "user",
          content: this.buildDreamPrompt(request.query, context),
        },
      ],
    });

    // Parse and validate response
    const insight = this.extractInsight(response);
    const suggestedActions = this.parseSuggestedActions(insight);

    // Persist to agent_memory
    await this.persistDream(request.query, insight, suggestedActions);

    return {
      insight,
      confidence: this.estimateConfidence(insight, context),
      suggestedActions,
      sources: context.memoryIds,
    };
  }

  // ─── Compact — End-of-Session Memory Compression ────────────────────────────

  async compact(request: CompactRequest): Promise<{
    archivedDecisions: string[];
    newPatterns: PatternRecord[];
    timelineEvents: TimelineRecord[];
  }> {
    // Archive decisions to agent_memory
    const archivedDecisions: string[] = [];
    for (const decision of request.decisions) {
      const memory = await this.db.create("agent_memory", {
        agent: request.agent,
        content: decision,
        provenance: "observed",
        lifecycle: "active",
        review_status: "pending",
        confidence: 0.7,
        can_use_as_evidence: true,
        can_use_as_instruction: false,
        requires_user_confirmation: true,
        source_refs: [request.sessionId],
        metadata: { compacted_from: request.sessionId },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>);
      archivedDecisions.push((memory as unknown as AgentMemoryRecord).id);
    }

    // Extract patterns from lessons
    const newPatterns: PatternRecord[] = [];
    for (const lesson of request.lessons) {
      const embedding = await this.embedText(lesson);
      const [record] = await this.db.create("pattern", {
        title: lesson.slice(0, 100),
        body: lesson,
        category: "behavior",
        confidence: 0.6,
        source_agent: request.agent,
        embedding,
        occurrence_count: 1,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      } as Record<string, unknown>);
      newPatterns.push(record as unknown as PatternRecord);
    }

    // Log timeline events
    const timelineEvents: TimelineRecord[] = [];
    for (const blocker of request.blockers) {
      const [record] = await this.db.create("timeline", {
        event_type: "pattern_detected",
        agent: request.agent,
        summary: `Blocker: ${blocker}`,
        metadata: { session_id: request.sessionId, type: "blocker" },
        created_at: new Date().toISOString(),
      } as Record<string, unknown>);
      timelineEvents.push(record as unknown as TimelineRecord);
    }

    return { archivedDecisions, newPatterns, timelineEvents };
  }

  // ─── Context Gathering ──────────────────────────────────────────────────────

  private async gatherContext(overrides?: DreamRequest["context"]): Promise<{
    directives: string[];
    patterns: string[];
    peers: string[];
    memories: AgentMemoryRecord[];
    memoryIds: string[];
  }> {
    // Active directives
    const [directives] = await this.db.query<[{ title: string }[]]>(
      "SELECT title FROM directive WHERE status = 'active' ORDER BY priority LIMIT 10"
    );

    // Recent patterns
    const [patterns] = await this.db.query<[{ title: string }[]]>(
      "SELECT title FROM pattern ORDER BY last_seen DESC LIMIT 10"
    );

    // Active peers
    const [peers] = await this.db.query<[{ handle: string }[]]>(
      "SELECT handle FROM peer ORDER BY last_interaction DESC LIMIT 10"
    );

    // Relevant memories (if embedding provided in context)
    let memories: AgentMemoryRecord[] = [];
    if (overrides?.sessionHistory && overrides.sessionHistory.length > 0) {
      const lastMessage = overrides.sessionHistory[overrides.sessionHistory.length - 1].content;
      const embedding = await this.embedText(lastMessage);
      const [rows] = await this.db.query<[AgentMemoryRecord[]]>(
        `SELECT *, vector::similarity::cosine(embedding, $vec) AS similarity
         FROM agent_memory
         WHERE lifecycle = 'active' AND can_use_as_evidence = true
         AND vector::similarity::cosine(embedding, $vec) > 0.7
         ORDER BY similarity DESC
         LIMIT 10`,
        { vec: embedding }
      );
      memories = rows ?? [];
    }

    return {
      directives: overrides?.recentDirectives ?? (directives ?? []).map((d) => d.title),
      patterns: overrides?.activePatterns ?? (patterns ?? []).map((p) => p.title),
      peers: overrides?.peerHandles ?? (peers ?? []).map((p) => p.handle),
      memories,
      memoryIds: memories.map((m) => m.id),
    };
  }

  // ─── Letta API Client ───────────────────────────────────────────────────────

  private async callLetta(path: string, body: Record<string, unknown>): Promise<unknown> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.lettaConfig.apiKey) {
      headers.Authorization = `Bearer ${this.lettaConfig.apiKey}`;
    }

    const response = await fetch(`${this.lettaConfig.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Letta API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ─── Prompt Engineering ─────────────────────────────────────────────────────

  private buildDreamPrompt(
    query: string,
    context: ReturnType<typeof this.gatherContext> extends Promise<infer T> ? T : never
  ): string {
    return `You are ORACLE, the persistent memory agent for Aigency. Review the current state and answer the query.

## Active Directives
${context.directives.map((d) => `- ${d}`).join("\n") || "None"}

## Recent Patterns
${context.patterns.map((p) => `- ${p}`).join("\n") || "None"}

## Relevant Memories
${context.memories.map((m) => `- ${m.content.slice(0, 200)} (confidence: ${m.confidence})`).join("\n") || "None"}

## Query
${query}

Respond with a structured insight and suggested actions.`;
  }

  private extractInsight(response: unknown): string {
    if (typeof response === "string") {
      return response;
    }
    if (response && typeof response === "object") {
      const r = response as Record<string, unknown>;
      if (typeof r.content === "string") {
        return r.content;
      }
      if (typeof r.insight === "string") {
        return r.insight;
      }
      if (Array.isArray(r.messages) && r.messages.length > 0) {
        const last = r.messages[r.messages.length - 1] as Record<string, unknown>;
        return String(last.content ?? last.message ?? "");
      }
    }
    return JSON.stringify(response);
  }

  private parseSuggestedActions(insight: string): DreamResponse["suggestedActions"] {
    // Simple regex-based extraction for suggested actions
    const actions: DreamResponse["suggestedActions"] = [];
    const actionPattern = /(?:SUGGESTED ACTION|ACTION):?\s*(\w+)\s*→\s*([^\n]+)/gi;
    let match: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
    while ((match = actionPattern.exec(insight)) !== null) {
      const type = match[1].toLowerCase();
      const target = match[2].trim();
      if (["create_directive", "update_memory", "flag_pattern", "notify_agent"].includes(type)) {
        actions.push({
          type: type as DreamResponse["suggestedActions"][0]["type"],
          target,
          payload: {},
        });
      }
    }
    return actions;
  }

  private estimateConfidence(insight: string, context: { memories: AgentMemoryRecord[] }): number {
    // Base confidence on number of supporting memories
    const memoryBoost = Math.min(0.3, context.memories.length * 0.05);
    const lengthBoost = insight.length > 200 ? 0.1 : 0;
    return Math.min(0.95, 0.5 + memoryBoost + lengthBoost);
  }

  private async persistDream(
    query: string,
    insight: string,
    actions: DreamResponse["suggestedActions"]
  ): Promise<AgentMemoryRecord> {
    const [record] = await this.db.create("agent_memory", {
      agent: "ORACLE",
      content: `Query: ${query}\nInsight: ${insight}`,
      provenance: "generated",
      lifecycle: "active",
      review_status: "pending",
      confidence: 0.6,
      can_use_as_evidence: true,
      can_use_as_instruction: false,
      requires_user_confirmation: true,
      metadata: { suggested_actions: actions },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>);
    return record as unknown as AgentMemoryRecord;
  }

  private async embedText(_text: string): Promise<number[]> {
    // Placeholder: In production, call OpenAI/Voyage/embedding service
    // For now, return a zero vector of correct dimension
    return new Array(1536).fill(0);
  }
}
