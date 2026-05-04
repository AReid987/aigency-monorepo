# Agent Core

`@aigency/agent-core` is the foundational package shared by every app and package in the monorepo. It defines agent identities, routing context, memory block types, and event shapes — the semantic primitives that make Aigency agent-native.

## Overview

| Property | Value |
|----------|-------|
| Package | `@aigency/agent-core` |
| Consumers | All apps and packages |
| Exports | Types, enums, constants |
| Build | `tsup` (ESM + CJS + DTS) |

## Exports

```typescript
// Agent identities
export type AgentCallsign;
export interface AgentIdentity;
export const AGENT_REGISTRY: Record<AgentCallsign, AgentIdentity>;

// Task complexity
export type TaskComplexity = "SIMPLE" | "MEDIUM" | "COMPLEX" | "REASONING";

// Routing context
export interface AgentRoutingContext;

// Memory blocks
export type MemoryBlockType;

// Events
export interface AigencyEvent;
```

(`packages/agent-core/src/index.ts:1-76`)

## AgentCallsign

A string-literal union type providing compile-time safety:

```typescript
export type AgentCallsign =
  | "THE_ARCHITECT"
  | "ZENITH"
  | "VECTOR"
  | "CIPHER"
  | "ECHO"
  | "ATLAS"
  | "COMPASS"
  | "IRIS"
  | "HERALD"
  | "ORACLE"
  | "LIBRARIAN";
```

(`packages/agent-core/src/index.ts:5-16`)

This type is used throughout the monorepo — in SurrealDB record types, Honcho peer lookups, MemBrain operations, and router context.

## AgentIdentity

```typescript
export interface AgentIdentity {
  callsign: AgentCallsign;
  name: string;
  role: string;
  color: string;       // hex — used in SynapTree + Membraned Interface
  substrate: string;   // runtime platform
}
```

(`packages/agent-core/src/index.ts:18-24`)

## AGENT_REGISTRY

The canonical registry of all 11 Aigency identities:

| Callsign | Name | Role | Color | Substrate |
|----------|------|------|-------|-----------|
| THE_ARCHITECT | Antonio Reid | Founder & Chief Architect | `#FFD700` | human |
| ZENITH | Newton Hughes | Chief of Staff & Orchestrator | `#00E5CC` | OpenClaw |
| VECTOR | Dominique Osei | Strategy & Intelligence | `#7B2FFF` | gptme |
| CIPHER | Roman Voss | Engineering & DevOps | `#39FF14` | gptme |
| ECHO | Selene Navarro | Marketing & Content | `#FF2D78` | TBD |
| ATLAS | Jordan Mercer | Revenue & Sales Ops | `#FFB300` | TBD |
| COMPASS | Imara Adeyemi | Finance & Operations | `#00BFA5` | TBD |
| IRIS | Vivienne Calloway | Design & Brand Systems | `#C77DFF` | TBD |
| HERALD | Dax Okafor | Communications | `#FFFFFF` | Motia |
| ORACLE | Sable Quinn | Persistent Memory Agent | `#1A237E` | Letta/MemGPT |
| LIBRARIAN | Ren Nakamura | Knowledge Graph Curator | `#FF6D00` | ZeroClaw |

(`packages/agent-core/src/index.ts:26-38`)

## TaskComplexity

Four-tier classification used by the router and routing context:

```typescript
export type TaskComplexity = "SIMPLE" | "MEDIUM" | "COMPLEX" | "REASONING";
```

(`packages/agent-core/src/index.ts:42`)

The router maps this to model tiers: `simple` models for SIMPLE tasks, `reasoning` models for REASONING tasks (`apps/router/src/router.ts:248-252`).

## AgentRoutingContext

Every LLM request from an agent carries this context:

```typescript
export interface AgentRoutingContext {
  agent: AgentCallsign;
  targetAgent?: AgentCallsign;
  complexity: TaskComplexity;
  preferLocal?: boolean;
  sessionId?: string;
}
```

(`packages/agent-core/src/index.ts:46-57`)

| Field | Purpose |
|-------|---------|
| `agent` | Who is making the request |
| `targetAgent` | Intended recipient (if any) |
| `complexity` | Informs model selection |
| `preferLocal` | Routes to MLX/Llama.cpp instead of cloud |
| `sessionId` | ORACLE memory threading |

## MemoryBlockType

```typescript
export type MemoryBlockType =
  | "agent"
  | "peer"
  | "directive"
  | "pattern"
  | "timeline"
  | "graph_edge";
```

(`packages/agent-core/src/index.ts:61-67`)

These types categorize memory entries in the unified memory layer.

## AigencyEvent

```typescript
export interface AigencyEvent {
  type: string;
  agent: AgentCallsign;
  timestamp: string; // ISO 8601
  payload: Record<string, unknown>;
}
```

(`packages/agent-core/src/index.ts:71-76`)

## Dependency Graph

```mermaid
graph BT
    AC[@aigency/agent-core]
    SR[@aigency/surreal]
    HO[@aigency/honcho]
    MB[@aigency/mem-brain]
    VT[@aigency/vault-tools]
    RO[@aigency/router]
    ME[@aigency/membrane]
    OR[@aigency/oracle]
    LI[@aigency/librarian]
    TE[@aigency/telos]

    SR --> AC
    HO --> AC
    MB --> AC
    VT --> AC
    RO --> AC
    ME --> AC
    OR --> AC
    LI --> AC
    TE --> AC
```

## Source Citations

- Full source: `packages/agent-core/src/index.ts:1-76`
- Package config: `packages/agent-core/package.json:1-29`
