# Aigency LLM-Wiki Index

> **Last updated:** 2026-05-03
> **Total pages:** 11
> **Raw sources:** `apps/docs/`
> **Schema version:** 2.0

---

## Quick Navigation

| Category | Pages | Description |
|----------|-------|-------------|
| **Architecture** | [architecture/overview.md](./architecture/overview.md), [architecture/data-layer.md](./architecture/data-layer.md) | System architecture, monorepo structure, dual-store memory |
| **Agents** | [agents/registry.md](./agents/registry.md) | 11 registered agent identities, substrates, routing |
| **Services** | [services/router.md](./services/router.md), [services/membrane.md](./services/membrane.md), [services/oracle.md](./services/oracle.md), [services/librarian.md](./services/librarian.md), [services/contracts.md](./services/contracts.md), [services/telos.md](./services/telos.md) | All deployable apps and their responsibilities |
| **Frontend** | [frontend/design-tokens.md](./frontend/design-tokens.md) | Membrane 3D UI, design tokens, SynapTree |
| **Chronology** | [log.md](./log.md) | Append-only activity log |

---

## Entity Catalog

### People

| Entity | Role | Page |
|--------|------|------|
| Antonio Reid | Founder & Chief Architect (THE_ARCHITECT) | [agents/registry.md](./agents/registry.md) |

### Agents

| Callsign | Name | Role | Substrate | Page |
|----------|------|------|-----------|------|
| ZENITH | Newton Hughes | Chief of Staff & Orchestrator | OpenClaw | [agents/registry.md](./agents/registry.md) |
| VECTOR | Dominique Osei | Strategy & Intelligence | gptme | [agents/registry.md](./agents/registry.md) |
| CIPHER | Roman Voss | Engineering & DevOps | gptme | [agents/registry.md](./agents/registry.md) |
| ECHO | Selene Navarro | Marketing & Content | TBD | [agents/registry.md](./agents/registry.md) |
| ATLAS | Jordan Mercer | Revenue & Sales Ops | TBD | [agents/registry.md](./agents/registry.md) |
| COMPASS | Imara Adeyemi | Finance & Operations | TBD | [agents/registry.md](./agents/registry.md) |
| IRIS | Vivienne Calloway | Design & Brand Systems | TBD | [agents/registry.md](./agents/registry.md) |
| HERALD | Dax Okafor | Communications | Motia | [agents/registry.md](./agents/registry.md) |
| ORACLE | Sable Quinn | Persistent Memory Agent | Letta/MemGPT | [agents/registry.md](./agents/registry.md) |
| LIBRARIAN | Ren Nakamura | Knowledge Graph Curator | ZeroClaw | [agents/registry.md](./agents/registry.md) |

### Services

| Service | Package | Purpose | Page |
|---------|---------|---------|------|
| LLM Router | `@aigency/router` | OpenAI-compatible proxy with classification + fallback | [services/router.md](./services/router.md) |
| Membrane | `@aigency/membrane` | 3D spatial knowledge graph (Three.js + React) | [services/membrane.md](./services/membrane.md) |
| ORACLE | `@aigency/oracle` | SurrealDB bootstrap + persistent memory | [services/oracle.md](./services/oracle.md) |
| LIBRARIAN | `@aigency/librarian` | Vault lint + wiki compilation | [services/librarian.md](./services/librarian.md) |
| Contracts | `@aigency/contracts` | Base L2 quality gates (HarvestMoon.sol) | [services/contracts.md](./services/contracts.md) |
| TELOS | `@aigency/telos` | Deep Context Framework | [services/telos.md](./services/telos.md) |

### Systems

| System | Purpose | Integration |
|--------|---------|-------------|
| SurrealDB 3.0 | Graph + document + vector store | `packages/surreal` |
| Honcho | Peer identity + cross-session reasoning | `packages/honcho` |
| MemBrain | Unified memory API | `packages/mem-brain` |
| HarvestMoon.sol | On-chain quality gate | Base L2 |

---

## Source Inventory

| Source | Date Added | Pages Derived |
|--------|------------|---------------|
| `apps/docs/02-deep-dive/architecture.md` | 2026-05-03 | architecture/overview.md |
| `apps/docs/02-deep-dive/data-layer.md` | 2026-05-03 | architecture/data-layer.md |
| `apps/docs/02-deep-dive/agent-system.md` | 2026-05-03 | agents/registry.md |
| `apps/docs/02-deep-dive/apps/router.md` | 2026-05-03 | services/router.md |
| `apps/docs/02-deep-dive/apps/membrane.md` | 2026-05-03 | services/membrane.md |
| `apps/docs/02-deep-dive/apps/oracle.md` | 2026-05-03 | services/oracle.md |
| `apps/docs/02-deep-dive/apps/librarian.md` | 2026-05-03 | services/librarian.md |
| `apps/docs/02-deep-dive/apps/contracts.md` | 2026-05-03 | services/contracts.md |
| `apps/docs/02-deep-dive/apps/telos.md` | 2026-05-03 | services/telos.md |
| `apps/docs/02-deep-dive/frontend.md` | 2026-05-03 | frontend/design-tokens.md |

---

## Cross-References

```
architecture/overview.md
    └─> architecture/data-layer.md (Memory architecture details)
    └─> agents/registry.md (Agent identities)
    └─> services/router.md (Request routing)
    └─> services/contracts.md (On-chain integration)

architecture/data-layer.md
    └─> services/oracle.md (Bootstrap flow)
    └─> services/librarian.md (Timeline events)
    └─> agents/registry.md (Agent lifecycle)

agents/registry.md
    └─> services/oracle.md (Agent seeding)
    └─> services/telos.md (TELOS identity docs)
    └─> frontend/design-tokens.md (Visual identity)

services/router.md
    └─> architecture/overview.md (Architecture context)
    └─> agents/registry.md (Routing context)

services/membrane.md
    └─> frontend/design-tokens.md (Token integration)
    └─> architecture/data-layer.md (LIVE queries)

services/oracle.md
    └─> architecture/data-layer.md (SurrealDB schema)
    └─> services/librarian.md (Harvest Moon flow)
    └─> services/contracts.md (On-chain submission)

services/librarian.md
    └─> services/oracle.md (Timeline notification)
    └─> services/contracts.md (Harvest thresholds)

services/contracts.md
    └─> services/librarian.md (Lint results)
    └─> services/oracle.md (Metric submission)

services/telos.md
    └─> agents/registry.md (Agent TELOS files)

frontend/design-tokens.md
    └─> services/membrane.md (Membrane usage)
    └─> agents/registry.md (Agent color mapping)
```
