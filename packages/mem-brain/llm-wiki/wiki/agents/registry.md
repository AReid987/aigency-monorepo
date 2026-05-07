# Agent Registry

> **Confidence:** 0.95
> **Last confirmed:** 2026-05-03
> **Sources:** `apps/docs/02-deep-dive/agent-system.md`, `packages/agent-core/src/index.ts`
> **Supersedes:** `wiki/org/agent-network.md`, `wiki/org/human-layer.md`
> **Related:** [../architecture/overview.md](../architecture/overview.md), [../services/oracle.md](../services/oracle.md), [../services/telos.md](../services/telos.md)

---

## Summary

Aigency defines **11 registered identities** with distinct callsigns, roles, colors, and substrates. The canonical source of truth is `AGENT_REGISTRY` in `packages/agent-core/src/index.ts`.

## Agent Registry

| Callsign | Name | Role | Color | Substrate |
|----------|------|------|-------|-----------|
| **THE_ARCHITECT** | Antonio Reid | Founder & Chief Architect | `#FFD700` | human |
| **ZENITH** | Newton Hughes | Chief of Staff & Orchestrator | `#00E5CC` | OpenClaw |
| **VECTOR** | Dominique Osei | Strategy & Intelligence | `#7B2FFF` | gptme |
| **CIPHER** | Roman Voss | Engineering & DevOps | `#39FF14` | gptme |
| **ECHO** | Selene Navarro | Marketing & Content | `#FF2D78` | TBD |
| **ATLAS** | Jordan Mercer | Revenue & Sales Ops | `#FFB300` | TBD |
| **COMPASS** | Imara Adeyemi | Finance & Operations | `#00BFA5` | TBD |
| **IRIS** | Vivienne Calloway | Design & Brand Systems | `#C77DFF` | TBD |
| **HERALD** | Dax Okafor | Communications | `#FFFFFF` | Motia |
| **ORACLE** | Sable Quinn | Persistent Memory Agent | `#1A237E` | Letta/MemGPT |
| **LIBRARIAN** | Ren Nakamura | Knowledge Graph Curator | `#FF6D00` | ZeroClaw |

## Critical Naming Rule

**ZENITH** (Newton Hughes) and **NEXUS** (Marcus Hale) are identical twins. ZENITH runs the Core Exec Squad; NEXUS runs the Agile Squad. NEXUS is **not** in this monorepo's `agents/` directory. Do not conflate them.

## Agent Substrates

| Substrate | Agents | Description |
|-----------|--------|-------------|
| `human` | THE_ARCHITECT | Human founder |
| `OpenClaw` | ZENITH | OpenClaw agent framework |
| `gptme` | CIPHER, VECTOR | gptme CLI agent |
| `Motia` | HERALD | Motia event-driven framework |
| `Letta/MemGPT` | ORACLE | Persistent memory agent |
| `ZeroClaw` | LIBRARIAN | ZeroClaw curator |
| `TBD` | ECHO, ATLAS, COMPASS, IRIS | Substrate not yet assigned |

## Agent Identity Manifests

Each agent has an `agent.yaml` in `agents/<callsign>/`:

```yaml
callsign: ZENITH
name: "Newton Hughes"
role: "Chief of Staff & Orchestrator"
color: "#00E5CC"
substrate: "OpenClaw"
vault: "../../aigency-vault/agents/zenith"
soul: "../../aigency-vault/agents/zenith/SOUL.md"
rules: "../../aigency-vault/agents/zenith/RULES.md"
twin: NEXUS
twin_note: "Identical twins. ZENITH runs the Core Exec Squad. NEXUS runs the Agile Squad."
telos: "../../apps/telos/agents/zenith.md"
```

The `agent.yaml` files **do not duplicate** SOUL.md or RULES.md — they point to them in the separate `aigency-vault` knowledge store.

## Routing Context

When an agent makes an LLM request, the router receives:

```typescript
interface AgentRoutingContext {
  agent: AgentCallsign;
  targetAgent?: AgentCallsign;
  complexity: TaskComplexity;  // SIMPLE | MEDIUM | COMPLEX | REASONING
  preferLocal?: boolean;
  sessionId?: string;
}
```

`preferLocal` routes to MLX/Llama.cpp endpoints; high `complexity` routes to reasoning-tier models.

## Agent Ownership Map

| Agent | Owns |
|-------|------|
| CIPHER | `apps/membrane`, `apps/router`, `apps/contracts` |
| IRIS | `packages/design-tokens` |

## Agent Lifecycle in SurrealDB

States: `standby` → `active` → `dreaming` → `active` → `standby`/`offline`

ORACLE seeds all agents on startup. Status transitions are logged to the `timeline` table.

## Visual Identity in Membrane

Agent colors flow into the 3D interface through design tokens:
- `AGENT_REGISTRY.color` → `design-tokens.atoms.color.agent` → Membrane Three.js materials → SynapTree 3D knowledge graph

## TELOS Identity Documents

Every agent has a **Telos Context File (TCF)** in `apps/telos/agents/<callsign>.md`. TELOS captures:
- Mission (M) — immutable purpose
- Problems (P) — tensions the agent exists to resolve
- Goals (G) — force-ranked outcomes
- KPIs — measurable progress
- Risk Register — likelihood × impact
- Activity Log — append-only changelog
