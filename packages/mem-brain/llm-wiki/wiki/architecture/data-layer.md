# Data Layer

> **Confidence:** 0.95
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/data-layer.md`, `packages/surreal/src/types.ts`, `packages/honcho/src/client.ts`, `packages/mem-brain/src/mem-brain.ts`
> **Supersedes:** N/A
> **Related:** [overview.md](./overview.md), [../services/oracle.md](../services/oracle.md), [../services/librarian.md](../services/librarian.md)

---

## Summary

Aigency's data layer is a **dual-store memory architecture**: SurrealDB handles structured data, graph relationships, and vector search; Honcho handles peer identity, sessions, and cross-session reasoning. The `MemBrain` class in `@aigency/mem-brain` unifies both behind a single API.

## SurrealDB Schema

### Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `agent` | `callsign`, `status`, `soul_hash` | Runtime agent state |
| `directive` | `status`, `priority`, `owner` | Active work items |
| `pattern` | `embedding`, `confidence`, `category` | Learned behaviors |
| `timeline` | `event_type`, `agent`, `metadata` | Audit log |

### Graph Edges

| Edge | `in` | `out` | Meaning |
|------|------|-------|---------|
| `decided_by` | directive | agent | Who decided this |
| `informed_by` | directive | pattern | What patterns informed it |
| `supersedes` | new directive | old directive | Replacement chain |

### Agent Record

```typescript
interface AgentRecord {
  id: string;              // "agent:<callsign>"
  callsign: AgentCallsign;
  name: string;
  role: string;
  color: string;
  substrate: string;
  status: "active" | "standby" | "offline" | "dreaming";
  current_focus?: string;
  soul_hash: string;       // SHA-256 of SOUL.md
  created_at: string;
  updated_at: string;
}
```

### Directive Record

```typescript
interface DirectiveRecord {
  id: string;              // "directive:<ulid>"
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
```

### Pattern Record

```typescript
interface PatternRecord {
  id: string;              // "pattern:<ulid>"
  title: string;
  body: string;
  category: "decision" | "behavior" | "anti-pattern" | "process";
  confidence: number;      // 0.0 – 1.0
  source_agent: AgentCallsign;
  embedding: number[];     // 1536-dim for text-embedding-3-small
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
}
```

## SurrealClient Singleton

Connection management via singleton class:
- `connect(config)` — establish WebSocket connection
- `get db()` — access Surreal instance
- `disconnect()` — clean shutdown
- `reconnect()` — useful after network drops

Only one WebSocket connection exists per process.

## LIVE Queries

SurrealDB `LIVE SELECT` enables real-time subscriptions. The `@aigency/surreal` package provides helpers:
- `subscribe(table, callback, where?)` — returns unsubscribe function
- `onEvent(eventType, callback)` — typed event filtering
- `onAgentStatus(callback)` — shorthand for agent status changes

## Honcho Peer Identity

Honcho models identity as: **Workspace → Peer → Session → Message**

### HonchoClient API

```typescript
class HonchoClient {
  async getPeer(callsign: AgentCallsign): Promise<Peer>;
  async startSession(callsign: AgentCallsign, metadata?): Promise<Session>;
  async addMessage(callsign, sessionId, content, isUser, metadata?): Promise<Message>;
  async dream(callsign: AgentCallsign, query: string): Promise<string>;
}
```

The `dream()` method triggers **async background inference** — Honcho's cross-session reasoning capability. ORACLE uses this for persistent memory operations.

## MemBrain Unified Interface

MemBrain is the single entry point for all agent memory operations.

### Directive Operations
- `getActiveDirectives()` — queries `SELECT * FROM directive WHERE status = 'active' ORDER BY priority`
- `createDirective(data)` — insert new directive

### Pattern Search (Vector Similarity)
- `searchPatterns(embedding, limit = 5)` — uses `vector::similarity::cosine` with 0.75 threshold

### Timeline Logging
- `logEvent(eventType, agent, summary, metadata?)` — creates audit record with ISO 8601 timestamps

### LIVE Subscriptions
- `subscribeToDirectives(callback)` — pre-built `WHERE status = 'active'`
- `subscribeToTimeline(callback)` — all timeline events

### Honcho Bridge
- `startAgentSession(callsign, metadata?)`
- `addAgentMessage(callsign, sessionId, content, isUser?)`
- `oracleDream(query)` — Honcho dream wrapper

## Timeline Event Types

| Event Type | Emitted By | Meaning |
|------------|-----------|---------|
| `session_start` | MemBrain | Agent session began |
| `session_end` | MemBrain | Agent session ended |
| `directive_created` | MemBrain | New directive inserted |
| `directive_completed` | MemBrain | Directive status changed |
| `pattern_detected` | MemBrain | New pattern learned |
| `lint_run` | Librarian | Vault lint completed |
| `compile_run` | Librarian | Wiki compilation done |
| `graft_harvested` | HarvestMoon | NFT minted |
| `agent_status_change` | MemBrain | Agent went active/offline |
