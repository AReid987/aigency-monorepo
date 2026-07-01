# Agent Core

# Agent Core Module Documentation

## Overview
The **Agent Core** package (`@aigency/agent-core`) is the shared source of truth for Aigency agent identities, routing context, and event primitives. It is a pure TypeScript types/constants package with no runtime dependencies, consumed by every app and package that needs to reason about agents.

## Agent Identities

`AgentCallsign` is the canonical union of all executive agent callsigns:

| Callsign | Name | Role | Substrate | Color |
|----------|------|------|-----------|-------|
| `THE_ARCHITECT` | Antonio Reid | Founder & Chief Architect | human | `#FFD700` |
| `ZENITH` | Newton Hughes | Chief of Staff & Orchestrator | OpenClaw | `#00E5CC` |
| `VECTOR` | Dominique Osei | Strategy & Intelligence | NullClaw | `#7B2FFF` |
| `CIPHER` | Roman Voss | Engineering & DevOps | GitClaw | `#39FF14` |
| `ECHO` | Selene Navarro | Marketing & Content | DenchClaw | `#FF2D78` |
| `ATLAS` | Jordan Mercer | Revenue & Sales Ops | Paperclip | `#FFB300` |
| `COMPASS` | Imara Adeyemi | Finance & Operations | IronClaw | `#00BFA5` |
| `IRIS` | Vivienne Calloway | Design & Brand Systems | OpenFang | `#C77DFF` |
| `HERALD` | Dax Okafor | Communications | Hermes | `#FFFFFF` |
| `ORACLE` | Sable Quinn | Persistent Memory Agent | Letta/MemGPT | `#1A237E` |
| `LIBRARIAN` | Ren Nakamura | Knowledge Graph Curator | ZeroClaw | `#FF6D00` |

`AGENT_REGISTRY` maps each callsign to an `AgentIdentity` object containing `callsign`, `name`, `role`, `color`, and `substrate`. The `substrate` field records the runtime platform the agent executes on (e.g., TypeScript, Rust, Python, human).

## Public Types

| Type | Description |
|------|-------------|
| `AgentIdentity` | Full identity record for an agent. |
| `AgentCallsign` | Union type of all 11 callsigns. |
| `TaskComplexity` | `"SIMPLE" \| "MEDIUM" \| "COMPLEX" \| "REASONING"` — used to inform model selection. |
| `AgentRoutingContext` | Context for routing a request: `agent`, optional `targetAgent`, `complexity`, optional `preferLocal`, optional `sessionId`. |
| `MemoryBlockType` | Union of memory block categories: `"agent"`, `"peer"`, `"directive"`, `"pattern"`, `"timeline"`, `"graph_edge"`. |
| `AigencyEvent` | Generic event shape with `type`, `agent`, ISO `timestamp`, and `payload`. |

## Usage

```ts
import { AGENT_REGISTRY, type AgentCallsign } from "@aigency/agent-core";

const caller: AgentCallsign = "VECTOR";
const identity = AGENT_REGISTRY[caller];
console.log(identity.name, identity.substrate);
```

## Integration Points

* Imported by `@aigency/router` to tag routing context.
* Used by `@aigency/mem-brain` for agent memory blocks and ORACLE substrate.
* Referenced by `apps/telos` TELOS files and agent personas.
* Consumed by UI apps (Nexus, Membrane) to render agent colors and names.

## Maintenance Notes

* Adding a new agent requires updating `AgentCallsign`, `AGENT_REGISTRY`, and any dependent TELOS/persona files.
* Keep this package dependency-free to avoid circular imports across the monorepo.
