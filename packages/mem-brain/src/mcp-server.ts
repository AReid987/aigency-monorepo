// MCPServer — Model Context Protocol server for remote agent access
// Enables any AI client (Claude Desktop, ChatGPT, Cursor) to access MemBrain.
// Remote HTTP with OAuth 2.1 scoped access. No local stdio.

import type { WikiPageRecord } from "@aigency/surreal";
import type { MemBrain } from "./mem-brain.js";

export interface MCPRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface MCPResponse {
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
}

export interface MCPScope {
  operations: ("read" | "write" | "admin")[];
  agents?: string[]; // Restrict to specific agents
  tables?: string[]; // Restrict to specific tables
}

export class MCPServer {
  private scopes = new Map<string, MCPScope>(); // token -> scope

  constructor(private memBrain: MemBrain) {}

  // ─── Auth ────────────────────────────────────────────────────────────────────

  registerToken(token: string, scope: MCPScope): void {
    this.scopes.set(token, scope);
  }

  revokeToken(token: string): void {
    this.scopes.delete(token);
  }

  private verifyToken(token: string, operation: string): MCPScope {
    const scope = this.scopes.get(token);
    if (!scope) {
      throw new Error("Invalid token");
    }

    const opType = this.classifyOperation(operation);
    if (!scope.operations.includes(opType)) {
      throw new Error(`Operation ${operation} not permitted`);
    }

    return scope;
  }

  private classifyOperation(method: string): "read" | "write" | "admin" {
    const readOps = [
      "wiki/search",
      "wiki/get",
      "wiki/stats",
      "directive/list",
      "pattern/search",
      "memory/search",
      "timeline/get",
      "peer/get",
    ];
    const adminOps = ["admin/revoke", "admin/scope", "job/cancel"];

    if (readOps.includes(method)) {
      return "read";
    }
    if (adminOps.includes(method)) {
      return "admin";
    }
    return "write";
  }

  // ─── Request Handling ────────────────────────────────────────────────────────

  async handleRequest(token: string, request: MCPRequest): Promise<MCPResponse> {
    try {
      this.verifyToken(token, request.method);
      const result = await this.dispatch(request.method, request.params);
      return { id: request.id, result };
    } catch (error) {
      return {
        id: request.id,
        error: {
          code: 500,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private async dispatch(method: string, params: Record<string, unknown>): Promise<unknown> {
    switch (method) {
      // Wiki operations
      case "wiki/search": {
        const queryText = String(params.queryText ?? "");
        const queryEmbedding = params.queryEmbedding as number[];
        const limit = Number(params.limit ?? 5);
        return this.memBrain.searchWiki(queryText, queryEmbedding, limit);
      }

      case "wiki/get": {
        const slug = String(params.slug ?? "");
        return this.memBrain.wiki.getPage(slug);
      }

      case "wiki/ingest": {
        const sourceType = String(params.sourceType ?? "");
        const sourceRef = String(params.sourceRef ?? "");
        const pages = params.pages as Array<{
          slug: string;
          type: WikiPageRecord["type"];
          title: string;
          compiled_truth: string;
          confidence: number;
          sources: string[];
        }>;
        return this.memBrain.wiki.ingest(sourceType, sourceRef, pages);
      }

      case "wiki/lint": {
        return this.memBrain.lintWiki();
      }

      case "wiki/stats": {
        return this.memBrain.getWikiStats();
      }

      case "wiki/crystallize": {
        const slug = String(params.slug ?? "");
        const digest = params.digest as {
          question: string;
          findings: string;
          filesInvolved: string[];
          lessons: string[];
        };
        return this.memBrain.crystallizeSession(slug, digest);
      }

      // Directive operations
      case "directive/list": {
        return this.memBrain.getActiveDirectives();
      }

      case "directive/create": {
        const data = params.data as Omit<
          import("@aigency/surreal").DirectiveRecord,
          "id" | "created_at"
        >;
        return this.memBrain.createDirective(data);
      }

      // Pattern operations
      case "pattern/search": {
        const embedding = params.embedding as number[];
        const limit = Number(params.limit ?? 5);
        return this.memBrain.searchPatterns(embedding, limit);
      }

      // Memory operations
      case "memory/search": {
        const agent = String(params.agent ?? "");
        const embedding = params.embedding as number[];
        const limit = Number(params.limit ?? 5);
        return this.memBrain.searchAgentMemory(
          agent as import("@aigency/agent-core").AgentCallsign,
          embedding,
          limit
        );
      }

      case "memory/create": {
        const data = params.data as Omit<
          import("@aigency/surreal").AgentMemoryRecord,
          "id" | "created_at" | "updated_at"
        >;
        return this.memBrain.createAgentMemory(data);
      }

      // Timeline operations
      case "timeline/get": {
        const agent = String(params.agent ?? "");
        const limit = Number(params.limit ?? 50);
        return this.memBrain.getTimelineForAgent(
          agent as import("@aigency/agent-core").AgentCallsign,
          limit
        );
      }

      // Peer operations
      case "peer/get": {
        const handle = String(params.handle ?? "");
        return this.memBrain.getPeer(handle);
      }

      case "peer/upsert": {
        const data = params.data as Omit<
          import("@aigency/surreal").PeerRecord,
          "id" | "created_at" | "updated_at" | "interaction_count"
        >;
        return this.memBrain.upsertPeer(data);
      }

      // ORACLE operations
      case "oracle/dream": {
        const query = String(params.query ?? "");
        return this.memBrain.oracleDream(query);
      }

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }
}
