# HERMES GALAXY: Refined Architecture v2

## Container-First Deployment with Galaxy Canvas

This document refines the HERMES GALAXY architecture to address two specific requirements:

1. **An open-source spatial canvas** replacing the excluded Agor.live, with SDLC lanes mapped to gstack's sprint phases.
2. **A container-based deployment model** where the control plane (Hermes + Workspace + Paperclip + Canvas) runs continuously, and ephemeral **venture worker containers** (Claude Code + gstack) are spun up per venture under Hermes' orchestration.

---

## 1. Galaxy Canvas: The Open-Source Spatial Workbench

### 1.1 Design Philosophy

Galaxy Canvas is a **spatial, real-time collaborative workbench** that visualizes the entire HERMES GALAXY as a living board. It is not a kanban board — it is an **infinite canvas** where ventures, agents, sessions, artifacts, and knowledge exist as spatial entities that can be arranged, grouped, and connected.

**Key Principles:**
- **Open Source:** MIT license. No BSL restrictions. Built entirely on permissive open-source libraries.
- **Integrate, don't replace:** It does not replace Hermes Workspace or Paperclip — it visualizes them.
- **SDLC-native:** The canvas is structured around gstack's 7-phase sprint model, not generic lanes.
- **Agent-visible:** Agents can read the canvas state (via API) and place their own artifacts on it.
- **Multi-venture:** Multiple ventures can coexist on the canvas, each in its own spatial region.

### 1.2 Technology Stack

| Component | Technology | License | Rationale |
|-----------|------------|---------|-----------|
| Canvas Engine | **React Flow** v12 + `@xyflow/react` | MIT | Battle-tested infinite canvas. 30k+ stars. Handles 1000+ nodes, pan/zoom, minimap, custom nodes. Agor uses this too — we use the same library, not their product. |
| Real-time Sync | **Socket.io** + Redis pub/sub | MIT | Industry standard for real-time collaboration. WebSocket fallback supported. |
| Backend | **Fastify** + **Drizzle ORM** + **LibSQL** (Turso) | MIT | Lightweight, type-safe, edge-compatible. Paperclip also uses similar stack. |
| Frontend | **React 18** + **TypeScript** + **Tailwind CSS** | MIT | Matches Hermes Workspace stack. Consistent UI. |
| State Management | **Zustand** (client) + **TanStack Query** (server) | MIT | Lightweight, no Redux boilerplate. |
| Spatial DB | **PostgreSQL** (shared with Paperclip) + PostGIS | PostgreSQL License | Stores node positions, edges, and spatial queries. |
| Agent Bridge | **gRPC** + **REST** | N/A | Bidirectional communication with Hermes and venture containers. |

> **Why React Flow?** React Flow is the open-source library that powers both Agor's canvas and many other diagramming tools. It is MIT-licensed, actively maintained, and handles spatial layouts natively. We build the SDLC-specific node types and real-time sync layer on top of it.

### 1.3 SDLC Lane Architecture

The canvas is organized into **7 primary SDLC lanes**, each spanning the full width of the canvas. Within each lane, **swimlanes** represent different agent roles or workstreams. Cards (nodes) represent work items, sessions, artifacts, or decisions.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            GALAXY CANVAS                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LANE 1: THINK (IDEATION)                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ Idea     │ │ Office   │ │ User     │ │ Market   │                   │   │
│  │  │ Capture  │ │ Hours    │ │ Research │ │ Analysis │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LANE 2: PLAN (ARCHITECTURE & DESIGN)                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ CEO      │ │ Eng      │ │ Design   │ │ DX       │                   │   │
│  │  │ Review   │ │ Review   │ │ Review   │ │ Review   │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LANE 3: BUILD (IMPLEMENTATION)                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ Active   │ │ Paused   │ │ Code     │ │ Test     │                   │   │
│  │  │ Session  │ │ Session  │ │ Branches │ │ Writing  │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LANE 4: REVIEW (QUALITY GATES)                                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ Staff    │ │ Security │ │ Design   │ │ Cross-   │                   │   │
│  │  │ Review   │ │ Audit    │ │ Review   │ │ Model    │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LANE 5: TEST (QA & VERIFICATION)                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ Browser  │ │ Unit     │ │ E2E      │ │ Performance│                  │   │
│  │  │ QA       │ │ Tests    │ │ Tests    │ │ Benchmark  │                  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LANE 6: SHIP (RELEASE & DEPLOY)                                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ PR       │ │ CI/CD    │ │ Canary   │ │ Production│                   │   │
│  │  │ Opened   │ │ Pipeline │ │ Deploy   │ │ Verify    │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LANE 7: REFLECT (RETROSPECTIVE & LEARNING)                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ Retro    │ │ Learnings│ │ GBrain   │ │ Coverage │                   │   │
│  │  │ Summary  │ │ Captured │ │ Synced   │ │ Audit    │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Lane Details

**LANE 1: THINK** (Blue-tinted zone)
- **Purpose:** Capture, interrogate, and reframe ideas before code is written.
- **Agent Cards:** `Office Hours Session`, `User Interview Notes`, `Market Research`, `Competitive Analysis`, `Idea Capture` (from GBrain signals)
- **gstack Skills:** `/office-hours`, `/investigate`, `/learn`
- **Triggers:** New venture idea, user pain report, market signal from GBrain
- **Exit Criteria:** Approved design doc with 3 implementation approaches and a recommendation

**LANE 2: PLAN** (Purple-tinted zone)
- **Purpose:** Lock architecture, catch hidden assumptions, produce executable specs.
- **Agent Cards:** `CEO Review Plan`, `Eng Review Plan`, `Design Review Plan`, `DX Review Plan`, `Security Threat Model`, `Spec Document`
- **gstack Skills:** `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`, `/cso`, `/spec`
- **Kahler Skills:** `seed:incubate` (generates PLANNING.md), `plan:autopilot` (runs all reviews automatically)
- **Exit Criteria:** All review plans approved, architecture documented, test matrix defined, acceptance criteria written (A.D.D. format)

**LANE 3: BUILD** (Green-tinted zone)
- **Purpose:** Active coding. The most dynamic lane — sessions live and die here.
- **Agent Cards:** `Live Session` (Claude Code + gstack), `Code Branch`, `Worktree`, `Commit Checkpoint`, `WIP Artifact`, `Paused Session` (context-restorable)
- **Container:** Each card = one `galaxy-worker` container (Claude Code + gstack)
- **Status Indicators:** 🟢 Active (code being written), 🟡 Paused (checkpoint saved), 🔴 Blocked (needs human), ⚪ Archived (session ended)
- **gstack Skills:** `/autoplan`, `/browse`, `/design-html`, `/design-shotgun`, `/pair-agent`, `/freeze`, `/guard`
- **Kahler Skills:** `paul:execute` (Plan-Apply-Unify loop inside the container)
- **Exit Criteria:** All tasks in plan implemented, tests passing, coverage acceptable

**LANE 4: REVIEW** (Yellow-tinted zone)
- **Purpose:** Catch bugs that pass CI but blow up in production. AI slop detection.
- **Agent Cards:** `Staff Engineer Review`, `Security Audit`, `Design Audit`, `Cross-Model Review` (Claude + Codex comparison), `AEGIS Multi-Agent Audit`
- **gstack Skills:** `/review`, `/codex`, `/design-review`, `/cso`
- **Kahler Skills:** `quality:staff-review`, `quality:second-opinion`, `quality:audit` (AEGIS 12-persona, 14-domain audit)
- **Exit Criteria:** All findings addressed or explicitly accepted, risk matrix signed off

**LANE 5: TEST** (Orange-tinted zone)
- **Purpose:** The agent has eyes. Real browser, real clicks, real screenshots.
- **Agent Cards:** `Browser QA Session`, `Unit Test Run`, `E2E Test Run`, `Performance Benchmark`, `iOS QA Session` (if applicable)
- **gstack Skills:** `/qa`, `/qa-only`, `/benchmark`, `/ios-qa`, `/devex-review`
- **Exit Criteria:** All tests pass, regression tests generated for every bug fix, performance baselined

**LANE 6: SHIP** (Red-tinted zone)
- **Purpose:** Move from "approved" to "verified in production."
- **Agent Cards:** `PR Created`, `CI/CD Pipeline`, `Canary Deployment`, `Production Verification`, `Document Release`
- **gstack Skills:** `/ship`, `/land-and-deploy`, `/canary`, `/document-release`, `/document-generate`
- **Kahler Skills:** `deploy:ship`, `deploy:canary`, `deploy:full-pipeline`, `docs:release-writer`, `docs:generate`
- **Exit Criteria:** PR merged, CI green, canary healthy, docs updated, production verified

**LANE 7: REFLECT** (Indigo-tinted zone)
- **Purpose:** Learning compounds. The system gets smarter.
- **Agent Cards:** `Retro Summary`, `Learning Captured`, `GBrain Sync Complete`, `Coverage Audit`, `Taste Profile Updated`
- **gstack Skills:** `/retro`, `/learn`, `/sync-gbrain`, `/gstack-taste-update`
- **Kahler Skills:** `process:retro`, `memory:learn`, `memory:sync-brain`
- **Exit Criteria:** Learnings written to GBrain, taste profile updated, retro published, next venture informed

### 1.4 Node Types

The canvas supports rich, interactive node types:

| Node Type | Visual | Data | Interactions |
|-----------|--------|------|--------------|
| **Session Card** | Live agent avatar + status dot | Container ID, agent type, model, cost, start time, branch | Click to open terminal stream, pause/resume, archive |
| **Artifact Card** | File icon + preview | File path, git commit, diff stats, preview URL | Click to view diff, open in editor, link to GBrain |
| **Decision Card** | Diamond shape | Decision text, approver, timestamp, linked plan | Hover to see rationale, click to see full context |
| **Review Card** | Checklist with progress bars | Review type, findings (fixed/open/waived), confidence scores | Expand to see findings, click to open review report |
| **Test Result Card** | Test tube icon + pass/fail count | Test suite, pass rate, duration, coverage % | Click to see failures, rerun, link to benchmark |
| **PR Card** | GitHub PR icon + status | PR number, branch, commits, CI status, deploy status | Click to open PR, merge, deploy, verify |
| **Venture Zone** | Bounded region with title | Paperclip company ID, budget, goal, hired agents | Drag to reposition, expand/collapse, multi-select |
| **Knowledge Pin** | 📍 Pin on the canvas | GBrain page slug, relevance score, entity type | Click to read in GBrain, auto-link to nearby cards |

### 1.5 Real-Time Collaboration Features

- **Cursors:** Live cursor positions for all humans and agents (agents shown as robot icons)
- **Comments:** Threaded comments on any node (like Figma)
- **Activity Stream:** Right sidebar showing all canvas events ("Hermes moved 'Build Session #3' from BUILD to REVIEW", "AEGIS audit found 2 issues")
- **Zoom Levels:**
  - 🔭 **Galaxy View** (0.1x): All ventures visible, just lane headers and status dots
  - 🏢 **Venture View** (0.5x): One venture's full SDLC visible, all cards shown
  - 🔍 **Lane View** (1.0x): One lane's swimlanes visible, card details readable
  - 🔬 **Card View** (2.0x): Single card expanded, full terminal stream / diff / review report

### 1.6 API for Agents

Agents interact with the canvas via a structured API (gRPC + REST):

```protobuf
service GalaxyCanvas {
  // Node lifecycle
  rpc CreateNode(CreateNodeRequest) returns (Node);
  rpc UpdateNode(UpdateNodeRequest) returns (Node);
  rpc MoveNode(MoveNodeRequest) returns (Node);       // Between lanes or within lane
  rpc ArchiveNode(ArchiveNodeRequest) returns (Empty);
  
  // Lane operations
  rpc GetLaneState(GetLaneStateRequest) returns (LaneState);
  rpc GetVentureState(GetVentureStateRequest) returns (VentureState);
  
  // Streaming
  rpc SubscribeToVenture(SubscribeRequest) returns (stream CanvasEvent);
  rpc SubscribeToLane(SubscribeRequest) returns (stream CanvasEvent);
  
  // Knowledge linking
  rpc LinkToKnowledge(LinkRequest) returns (Link);
  rpc QueryNearbyNodes(QueryRequest) returns (NodeList);  // Spatial queries
}
```

### 1.7 Integration with Paperclip

- **Venture Zones:** When Paperclip creates a new company, a Venture Zone is automatically created on the canvas.
- **Agent Hiring:** When Paperclip hires an agent (e.g., "CTO: Oh My Pi"), an agent card appears in the venture zone.
- **Budget Indicators:** Each venture zone shows a budget bar (spent / total). When 80% reached, zone turns yellow. At 100%, red + pause icon.
- **Ticket System:** Paperclip tickets appear as cards on the canvas. Assigning a ticket to an agent moves it to that agent's swimlane.
- **Heartbeat Visualization:** Agent heartbeats from Paperclip pulse as subtle animations on agent cards. Missed heartbeats show a broken-heart icon.
- **Org Chart:** Paperclip's org chart is visualized as a nested graph within the venture zone (using React Flow's sub-flow feature).

### 1.8 Integration with GBrain

- **Knowledge Pins:** GBrain entities (people, companies, projects, meetings) can be "pinned" to the canvas as 📍 pins. They auto-link to nearby cards.
- **Auto-suggest:** When a card is created (e.g., "Office Hours Session"), GBrain suggests related knowledge pins to attach.
- **Context On-Demand:** Right-click any card → "Load Context from GBrain" → retrieves L0/L1/L2 context (from OpenViking adaptation) and displays in sidebar.
- **Dream Cycle Visualization:** A special "Dream Cycle" indicator in the REFLECT lane shows when GBrain's overnight enrichment is running. Completed cycles add new knowledge pins.

### 1.9 Integration with Hermes Workspace

- The Galaxy Canvas is a **plugin/module** within the Hermes Workspace web UI.
- It appears as a tab: **"Canvas"** alongside Chat, Files, Terminal, Operations, Swarm.
- Clicking a session card on the canvas opens the terminal stream in the Terminal tab.
- Clicking an artifact card opens the file in the Files tab.
- The Conductor dashboard in Hermes Workspace can dispatch missions directly from the canvas (right-click venture zone → "Dispatch Mission").

---

## 2. Container Architecture: Galaxy Planes

The system is deployed as **Docker containers** orchestrated by Docker Compose (local) or Kubernetes (production). Two plane types exist: **Core Plane** (always on) and **Worker Planes** (ephemeral, per venture).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GALAXY CORE PLANE                              │
│  (Always On — The Persistent Control Plane)                              │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   Hermes Agent  │  │ Hermes Workspace│  │  Galaxy Canvas  │           │
│  │   (Python)      │  │   (React +      │  │   (React +      │           │
│  │                 │  │    Fastify)     │  │    React Flow)  │           │
│  │  • 60+ tools    │  │                 │  │                 │           │
│  │  • Memory       │  │  • Chat UI      │  │  • Spatial      │           │
│  │  • Skills       │  │  • File Browser │  │    Canvas       │           │
│  │  • MCP server   │  │  • Terminal     │  │  • Real-time    │           │
│  │  • Cron jobs    │  │  • Conductor    │  │    Sync         │           │
│  │  • Sub-agents   │  │  • Swarm Mode   │  │  • SDLC Lanes   │           │
│  │  • Voice mode   │  │  • Kanban Board │  │  • Knowledge    │           │
│  │                 │  │  • Agent View     │  │    Pins         │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   Paperclip     │  │     GBrain      │  │   DenchClaw     │           │
│  │   (Node.js)     │  │   (TypeScript/  │  │   (Node.js +    │           │
│  │                 │  │     Bun)        │  │    OpenClaw gw) │           │
│  │  • Org Chart    │  │                 │  │                 │           │
│  │  • Budgets      │  │  • PGLite/      │  │  • CRM Data     │           │
│  │  • Goals        │  │     Postgres    │  │  • Deals        │           │
│  │  • Heartbeats   │  │  • Hybrid       │  │  • Contacts     │           │
│  │  • Tickets      │  │     Search      │  │  • Pipelines    │           │
│  │  • Governance   │  │  • Knowledge    │  │  • Tasks        │           │
│  │                 │  │     Graph       │  │                 │           │
│  │                 │  │  • Dream Cycle  │  │                 │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
│                                                                         │
│  Shared Volumes:                                                        │
│  • /shared/gbrain-repo     ←→  GBrain's git-backed markdown repo        │
│  • /shared/paperclip-data  ←→  Paperclip's embedded Postgres            │
│  • /shared/denchclaw-data  ←→  DenchClaw's OpenClaw workspace          │
│  • /shared/canvas-state    ←→  Galaxy Canvas spatial DB                  │
│  • /shared/ventures        ←→  Venture worker plane definitions          │
│                                                                         │
│  Networks:                                                              │
│  • galaxy-internal (isolated, container-to-container)                   │
│  • galaxy-external (for web UIs, APIs, Tailscale)                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ Docker Network / Tailscale
                              │ gRPC + REST + WebSocket
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      GALAXY WORKER PLANES                                │
│  (Ephemeral — Spawned Per Venture, Archived When Done)                   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  WORKER PLANE: Venture "NoteTaker"                             │     │
│  │  Spawned by: Hermes Core                                       │     │
│  │  Trigger: SEED generates PLANNING.md, Paperclip approves goal  │     │
│  │                                                                 │     │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │     │
│  │  │  Claude Code    │  │    GStack       │  │  Oh My Pi       │   │     │
│  │  │  (CLI Agent)    │  │  (Skills Pack)  │  │  (Optional)     │   │     │
│  │  │                 │  │                 │  │  (Rust Core)    │   │     │
│  │  │  • Interactive  │  │  • 23+ skills   │  │  • LSP/DAP      │   │     │
│  │  │    shell        │  │  • /office-hours│  │  • 53 servers   │   │     │
│  │  │  • File edits   │  │  • /review      │  │  • 14 adapters  │   │     │
│  │  │  • Tool calls   │  │  • /qa          │  │  • Eval kernel  │   │     │
│  │  │  • Git ops      │  │  • /ship        │  │  • TTSR         │   │     │
│  │  │  • Subprocess   │  │  • /browse      │  │                 │   │     │
│  │  │    spawn        │  │  • /design-*    │  │                 │   │     │
│  │  │                 │  │  • /cso         │  │                 │   │     │
│  │  │  Configured     │  │  • /autoplan    │  │  Fallback if    │   │     │
│  │  │  to use:        │  │  • /learn       │  │  Claude Code    │   │     │
│  │  │  - gbrain MCP   │  │  • /retro       │  │  unavailable    │   │     │
│  │  │  - gstack       │  │  • /codex       │  │                 │   │     │
│  │  │    skills       │  │  • /pair-agent  │  │                 │   │     │
│  │  │  - Hermes       │  │  • /make-pdf    │  │                 │   │     │
│  │  │    as parent    │  │  • /diagram     │  │                 │   │     │
│  │  │    orchestrator │  │  • /benchmark   │  │                 │   │     │
│  │  │                 │  │  • /ios-*       │  │                 │   │     │
│  │  │                 │  │  • /document-*  │  │                 │   │     │
│  │  │                 │  │  • /careful     │  │                 │   │     │
│  │  │                 │  │  • /freeze      │  │                 │   │     │
│  │  │                 │  │  • /guard       │  │                 │   │     │
│  │  │                 │  │  • /spec        │  │                 │   │     │
│  │  │                 │  │  • /setup-*     │  │                 │   │     │
│  │  │                 │  │  • /gstack-*    │  │                 │   │     │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │     │
│  │                                                                 │     │
│  │  ┌─────────────────────────────────────────────────────────┐    │     │
│  │  │  PAUL Execution Loop (Inside Claude Code Session)       │    │     │
│  │  │  Plan → Apply → Unify                                   │    │     │
│  │  │  • .paul/ directory with state machine                  │    │     │
│  │  │  • paul.toml manifest                                   │    │     │
│  │  │  • ledger.toml for cost tracking                        │    │     │
│  │  │  • XML task formatting                                  │    │     │
│  │  │  • Escalation: DONE / DONE_WITH_CONCERNS /              │    │     │
│  │  │    NEEDS_CONTEXT / BLOCKED                              │    │     │
│  │  │  • Diagnostic routing: intent / spec / code             │    │     │
│  │  └─────────────────────────────────────────────────────────┘    │     │
│  │                                                                 │     │
│  │  Shared Volumes (Mounted from Core):                            │     │
│  │  • /shared/gbrain-repo     ←→  Read GBrain context             │     │
│  │  • /shared/venture-output    ←→  Write code, docs, artifacts   │     │
│  │                                                                 │     │
│  │  Network: galaxy-internal (can reach Core Plane services)     │     │
│  │                                                                 │     │
│  │  Lifecycle:                                                     │     │
│  │  1. Hermes spawns container with venture config                 │     │
│  │  2. Claude Code initializes with gstack + PAUL + CARL           │     │
│  │  3. Hermes delegates tasks via gRPC stream                      │     │
│  │  4. Claude Code writes code, commits, runs tests                │     │
│  │  5. Results stream back to Core via gRPC                        │     │
│  │  6. Galaxy Canvas shows live session card in BUILD lane        │     │
│  │  7. When done, container is archived (not destroyed)           │     │
│  │     → Snapshot saved to /shared/ventures/{id}/archive/          │     │
│  │  8. GBrain indexes all outputs                                  │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  WORKER PLANE: Venture "MarketAnalyzer"                        │     │
│  │  (Another worker, running in parallel)                         │     │
│  │                                                                 │     │
│  │  Same structure as above. Multiple workers can run in parallel. │     │
│  │  Hermes Conductor manages up to 15 parallel sprints (per       │     │
│  │  gstack's documented practical limit).                          │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Core Plane Container Spec

```yaml
# docker-compose.galaxy-core.yml
version: '3.8'

services:
  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: galaxy-hermes
    volumes:
      - /shared/gbrain-repo:/gbrain:rw
      - /shared/paperclip-data:/paperclip:rw
      - /shared/ventures:/ventures:rw
      - /shared/secrets:/secrets:ro
    environment:
      - HERMES_MEMORY_BACKEND=sqlite
      - HERMES_GBRAIN_MCP=grpc://galaxy-gbrain:50051
      - HERMES_PAPERCLIP_API=http://galaxy-paperclip:3000
      - HERMES_CANVAS_API=http://galaxy-canvas:3001
      - HERMES_WORKER_REGISTRY=/ventures/workers.json
      - HERMES_MODEL=anthropic/claude-sonnet-4
      - HERMES_OPENROUTER_KEY_FILE=/secrets/openrouter.key
      - GSTACK_ANTHROPIC_API_KEY_FILE=/secrets/anthropic.key
      - GSTACK_OPENAI_API_KEY_FILE=/secrets/openai.key
    networks:
      - galaxy-internal
      - galaxy-external
    ports:
      - "8080:8080"  # Hermes API
    depends_on:
      - gbrain
      - paperclip
    restart: unless-stopped

  hermes-workspace:
    image: galaxy/hermes-workspace:latest
    container_name: galaxy-workspace
    build:
      context: ./hermes-workspace
      dockerfile: Dockerfile
    volumes:
      - /shared/gbrain-repo:/gbrain:ro
    environment:
      - HERMES_API_URL=http://galaxy-hermes:8080
      - GBRAIN_API_URL=http://galaxy-gbrain:3002
      - PAPERCLIP_API_URL=http://galaxy-paperclip:3000
      - CANVAS_API_URL=http://galaxy-canvas:3001
    networks:
      - galaxy-internal
      - galaxy-external
    ports:
      - "3000:3000"  # Workspace UI
    depends_on:
      - hermes
    restart: unless-stopped

  galaxy-canvas:
    image: galaxy/galaxy-canvas:latest
    build:
      context: ./galaxy-canvas
      dockerfile: Dockerfile
    volumes:
      - /shared/canvas-state:/data:rw
      - /shared/gbrain-repo:/gbrain:ro
    environment:
      - DATABASE_URL=postgresql://galaxy:galaxy@galaxy-postgres:5432/canvas
      - REDIS_URL=redis://galaxy-redis:6379
      - HERMES_API_URL=http://galaxy-hermes:8080
      - PAPERCLIP_API_URL=http://galaxy-paperclip:3000
      - GBRAIN_API_URL=http://galaxy-gbrain:3002
      - WEBSOCKET_PORT=3001
    networks:
      - galaxy-internal
      - galaxy-external
    ports:
      - "3001:3001"  # Canvas API + WebSocket
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  paperclip:
    image: paperclipai/paperclip:latest
    container_name: galaxy-paperclip
    volumes:
      - /shared/paperclip-data:/data:rw
    environment:
      - DATABASE_URL=postgresql://galaxy:galaxy@galaxy-postgres:5432/paperclip
      - HERMES_API_URL=http://galaxy-hermes:8080
      - DENCHCLAW_API_URL=http://galaxy-denchclaw:3100
    networks:
      - galaxy-internal
    ports:
      - "3100:3100"  # Paperclip API
    depends_on:
      - postgres
    restart: unless-stopped

  gbrain:
    image: garrytan/gbrain:latest
    container_name: galaxy-gbrain
    volumes:
      - /shared/gbrain-repo:/brain:rw
      - /shared/gbrain-cache:/cache:rw
    environment:
      - GBRAIN_ENGINE=pglite  # or postgres://... for shared
      - GBRAIN_DATA_DIR=/brain
      - MCP_SERVER_PORT=50051
      - HTTP_SERVER_PORT=3002
    networks:
      - galaxy-internal
    ports:
      - "50051:50051"  # MCP gRPC
      - "3002:3002"    # HTTP API
    restart: unless-stopped

  denchclaw:
    image: denchhq/denchclaw:latest
    container_name: galaxy-denchclaw
    volumes:
      - /shared/denchclaw-data:/data:rw
    environment:
      - OPENCLAW_PROFILE=dench
      - OPENCLAW_GATEWAY_PORT=19001
      - DENCHCLAW_WEB_PORT=3100
      - PAPERCLIP_API_URL=http://galaxy-paperclip:3000
    networks:
      - galaxy-internal
    ports:
      - "19001:19001"  # OpenClaw gateway
      - "3100:3100"    # DenchClaw web UI
    restart: unless-stopped

  postgres:
    image: pgvector/pgvector:pg16
    container_name: galaxy-postgres
    volumes:
      - /shared/postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=galaxy
      - POSTGRES_PASSWORD=galaxy
      - POSTGRES_DB=galaxy
    networks:
      - galaxy-internal
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: galaxy-redis
    networks:
      - galaxy-internal
    restart: unless-stopped

  # Optional: Tailscale for secure external access
  tailscale:
    image: tailscale/tailscale:latest
    container_name: galaxy-tailscale
    environment:
      - TS_AUTHKEY_FILE=/secrets/tailscale.key
      - TS_STATE_DIR=/var/lib/tailscale
    volumes:
      - /shared/tailscale-state:/var/lib/tailscale
      - /shared/secrets:/secrets:ro
    networks:
      - galaxy-external
    cap_add:
      - NET_ADMIN
      - NET_RAW
    restart: unless-stopped

networks:
  galaxy-internal:
    driver: bridge
    internal: true  # No external access
  galaxy-external:
    driver: bridge

volumes:
  gbrain-repo:
  paperclip-data:
  denchclaw-data:
  canvas-state:
  postgres-data:
  tailscale-state:
  secrets:
```

### 2.2 Worker Plane Container Spec

```yaml
# docker-compose.galaxy-worker.yml (template, instantiated per venture)
version: '3.8'

services:
  claude-code:
    image: galaxy/claude-code-worker:latest
    build:
      context: ./claude-code-worker
      dockerfile: Dockerfile
    # Each worker gets its own isolated project directory
    volumes:
      - /shared/ventures/${VENTURE_ID}/project:/workspace:rw
      - /shared/gbrain-repo:/gbrain:ro
      - /shared/secrets:/secrets:ro
    environment:
      - VENTURE_ID=${VENTURE_ID}
      - HERMES_PARENT_API=http://galaxy-hermes:8080
      - HERMES_PARENT_TOKEN=${HERMES_WORKER_TOKEN}
      - GBRAIN_MCP_URL=grpc://galaxy-gbrain:50051
      - CLAUDE_CODE_MODEL=claude-sonnet-4
      - ANTHROPIC_API_KEY_FILE=/secrets/anthropic.key
      - GSTACK_ENABLED=true
      - GSTACK_AUTO_UPDATE=true
      - PAUL_ENABLED=true
      - CARL_ENABLED=true
      - WORKER_MODE=venture
    networks:
      - galaxy-internal
    # No external ports — communicates via gRPC back to Core
    # Resource limits to prevent runaway costs
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
    # Auto-stop after 24h of inactivity to save costs
    # (managed by Hermes Conductor)

networks:
  galaxy-internal:
    external: true  # Connect to Core's internal network
```

### 2.3 Worker Plane Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant Hermes as Hermes Core
    participant Paperclip as Paperclip
    participant Canvas as Galaxy Canvas
    participant Docker as Docker Engine
    participant Worker as Worker Plane
    participant GBrain as GBrain
    participant CC as Claude Code
    participant GS as gstack Skills

    User->>Hermes: "Build an AI note-taking app"
    Hermes->>Hermes: SEED skill: generate PLANNING.md
    Hermes->>Paperclip: Create company "NoteTaker"
    Paperclip->>Paperclip: Set budget: $240/mo<br/>Hire CEO: Hermes, CTO: Claude Code
    Paperclip->>Hermes: Return company ID
    Hermes->>Canvas: Create Venture Zone "NoteTaker"
    Canvas->>Canvas: Add cards: THINK lane<br/>Office Hours Session, Idea Capture
    
    Hermes->>Hermes: Run /office-hours<br/>Generate design doc
    Hermes->>GBrain: Write design doc, decisions<br/>Auto-link entities
    Hermes->>Canvas: Move card to PLAN lane<br/>Status: Planning Complete
    
    Hermes->>Hermes: Run /plan-ceo-review<br/>Run /plan-eng-review
    Hermes->>Canvas: Create cards in PLAN lane<br/>CEO Review, Eng Review
    Hermes->>GBrain: Write plans, architecture
    
    Hermes->>Docker: Spawn worker plane<br/>Venture: NoteTaker
    Docker->>Worker: Create container<br/>Mount venture project dir
    Worker->>CC: Initialize Claude Code
    Worker->>GS: Install gstack skills<br/>Install PAUL, CARL, SEED
    Worker->>Hermes: Register worker<br/>Worker ID: worker-notetaker-01
    Hermes->>Canvas: Create Session Card<br/>BUILD lane: "NoteTaker Build #1"
    Canvas->>Canvas: Status: 🟢 Active<br/>Agent: Claude Code<br/>Model: claude-sonnet-4
    
    Hermes->>Worker: Delegate task: "Implement auth flow"
    Worker->>CC: Claude Code receives task<br/>with gstack context
    CC->>GS: Run /autoplan<br/>Generate implementation plan
    GS->>Worker: Write plan to .paul/
    Worker->>Hermes: Stream plan back
    Hermes->>Canvas: Update card<br/>Status: Planning
    
    CC->>CC: Execute plan (code, test, commit)
    CC->>GS: Run /review<br/>Auto-fix issues
    CC->>Worker: Push commit: "feat: auth flow"
    Worker->>Hermes: Stream results, diff, test output
    Hermes->>Canvas: Update card<br/>Commits: +3, Tests: ✅
    Hermes->>GBrain: Index code changes<br/>Extract entities, create edges
    
    Hermes->>Worker: Delegate task: "Implement notes CRUD"
    CC->>CC: Execute (PAUL loop)
    Worker->>Hermes: Stream results
    Hermes->>Canvas: Card updates<br/>Status: Building
    
    Hermes->>Worker: "Run full QA"
    CC->>GS: Run /qa https://staging...
    CC->>Worker: Browser automation results<br/>Bugs found: 2, Fixed: 2
    Worker->>Hermes: QA report
    Hermes->>Canvas: Move card to TEST lane<br/>Tests: 42, Bugs: 0
    
    Hermes->>Worker: "Run security audit"
    CC->>GS: Run /cso
    CC->>Worker: OWASP + STRIDE results<br/>Findings: 1 (low), Fixed: 1
    Worker->>Hermes: Security report
    Hermes->>Canvas: Move card to REVIEW lane<br/>Security: ✅, Staff Review: ✅
    
    Hermes->>Worker: "Ship it"
    CC->>GS: Run /ship<br/>Run tests, coverage audit, open PR
    CC->>Worker: PR #42 opened<br/>Tests: 42→51, Coverage: 87%
    Worker->>Hermes: Ship report
    Hermes->>Paperclip: Update ticket<br/>Status: Ready for Deploy
    Hermes->>Canvas: Move card to SHIP lane<br/>PR: #42, CI: 🟡 Running
    
    Paperclip->>User: "Approve PR #42 for deploy?"
    User->>Paperclip: Approve
    Paperclip->>Hermes: Approval granted
    Hermes->>Worker: "Deploy to production"
    CC->>GS: Run /land-and-deploy
    CC->>Worker: Deployed, health verified
    Worker->>Hermes: Deploy complete
    Hermes->>Canvas: Move card to SHIP lane<br/>Status: ✅ Live
    
    Hermes->>Worker: "Run retro"
    CC->>GS: Run /retro
    CC->>Worker: Retro summary, learnings
    Worker->>Hermes: Retro complete
    Hermes->>Canvas: Move card to REFLECT lane<br/>Learnings: 5, GBrain: Synced
    Hermes->>GBrain: Write retro, learnings<br/>Update taste profile
    
    Hermes->>Docker: Archive worker plane<br/>Save snapshot to /shared/ventures/
    Docker->>Worker: Stop container, save state
    Hermes->>Paperclip: Close venture<br/>Final cost: $127.43
    Paperclip->>User: "NoteTaker shipped!<br/>Cost: $127.43 / $240 budget"
```

### 2.4 Worker Plane Configuration

Each worker plane is configured via a `venture-config.json` generated by Hermes:

```json
{
  "venture_id": "notetaker-2026-001",
  "company_id": "paperclip-comp-123",
  "name": "NoteTaker",
  "goal": "Build #1 AI note-taking app to $1M ARR",
  "budget": {
    "monthly_limit": 240.00,
    "currency": "USD",
    "alert_threshold": 0.8,
    "halt_threshold": 1.0
  },
  "agents": {
    "ceo": { "type": "hermes", "model": "claude-sonnet-4" },
    "cto": { "type": "claude-code", "model": "claude-sonnet-4", "skills": ["gstack", "paul", "carl"] },
    "designer": { "type": "claude-code", "model": "claude-opus-4", "skills": ["gstack"] },
    "reviewer": { "type": "claude-code", "model": "claude-sonnet-4", "skills": ["gstack", "aegis"] }
  },
  "sdlc": {
    "phases": ["think", "plan", "build", "review", "test", "ship", "reflect"],
    "current_phase": "build",
    "auto_advance": false
  },
  "gbrain": {
    "schema_pack": "gbrain-base-v2",
    "workspace_pack": "workspace",
    "sources": ["wiki", "gstack", "venture-notetaker"]
  },
  "gstack": {
    "skills": ["office-hours", "plan-ceo-review", "plan-eng-review", "review", "qa", "ship", "cso", "browse", "autoplan", "learn", "retro"],
    "checkpoint_mode": "continuous",
    "browser": "headless"
  },
  "paul": {
    "enabled": true,
    "scope_adaptive": true,
    "acceptance_criteria_format": "bdd"
  },
  "carl": {
    "enabled": true,
    "context_brackets": true,
    "domains": ["development", "design", "security", "docs"]
  },
  "resources": {
    "cpus": 4,
    "memory": "8G",
    "timeout": "24h",
    "auto_stop_inactive": true
  },
  "network": {
    "internal_only": true,
    "tailscale_enabled": false
  }
}
```

### 2.5 Communication Between Planes

```
┌────────────────────────────────────────────────────────────┐
│                    COMMUNICATION MATRIX                    │
├────────────────────────────────────────────────────────────┤
│  Direction        Protocol        Purpose                  │
├────────────────────────────────────────────────────────────┤
│  Hermes → Worker   gRPC (bi-dir)   Task delegation,         │
│                                  stream results,           │
│                                  heartbeat, status         │
│                                                            │
│  Worker → Hermes   gRPC (bi-dir)   Progress updates,       │
│                                  artifact delivery,        │
│                                  cost reports,             │
│                                  escalation requests         │
│                                                            │
│  Hermes → Canvas   WebSocket     Real-time card updates,   │
│                                  node creation,            │
│                                  lane moves,               │
│                                  knowledge pin placement   │
│                                                            │
│  Canvas → Hermes   REST API      User actions (click,      │
│                                  drag, comment),           │
│                                  spatial queries,          │
│                                  node metadata requests    │
│                                                            │
│  Hermes → Paperclip REST API     Venture CRUD,             │
│                                  agent hiring,             │
│                                  budget updates,           │
│                                  ticket creation,        │
│                                  approval requests         │
│                                                            │
│  Paperclip → Hermes Webhook      Heartbeat events,         │
│                                  budget alerts,            │
│                                  approval responses,       │
│                                  ticket assignments        │
│                                                            │
│  Hermes → GBrain   MCP (gRPC)    Memory write,             │
│                                  knowledge read,           │
│                                  graph query,              │
│                                  sync operations           │
│                                                            │
│  Worker → GBrain   MCP (gRPC)    Code indexing,            │
│                                  artifact capture,         │
│                                  entity extraction,        │
│                                  search queries            │
│                                                            │
│  Paperclip → DenchClaw REST API  CRM data sync,            │
│                                  contact enrichment,       │
│                                  deal pipeline updates     │
│                                                            │
│  DenchClaw → Paperclip REST API  Deal status,             │
│                                  contact updates,          │
│                                  pipeline changes          │
│                                                            │
│  User → Workspace  HTTP/WebSocket Web UI, chat,            │
│                                  canvas interaction,       │
│                                  file browser,             │
│                                  terminal                  │
│                                                            │
│  User → Paperclip  HTTP          Venture dashboard,        │
│                                  org chart,                │
│                                  budget tracker,           │
│                                  ticket inbox              │
│                                                            │
│  User → DenchClaw  HTTP          CRM contacts,              │
│                                  deals,                    │
│                                  tasks,                    │
│                                  pipeline view             │
└────────────────────────────────────────────────────────────┘
```

### 2.6 Resource Management & Cost Control

**Resource Limits per Worker:**
- CPU: 4 cores (configurable per venture)
- Memory: 8GB (configurable)
- Disk: 50GB per venture project
- Network: Internal only (no external outbound except via Hermes proxy)
- Lifetime: 24h max idle timeout (auto-archive), 72h max active timeout

**Cost Attribution:**
- Every API call from Worker to GBrain is logged with venture ID
- Claude Code token usage is streamed back to Paperclip in real-time
- Paperclip accumulates costs per agent, per task, per venture
- Budget alerts at 80%, hard stop at 100% (with override capability)

**Auto-Scaling:**
- 1 worker per venture by default
- Hermes can request Paperclip to approve additional workers for parallel tasks
- Maximum 15 parallel workers (matching gstack's documented practical limit)
- Workers can be "warm" (pre-spawned, idle) for fast startup on new ventures

---

## 3. Venture Lifecycle: From Idea to Archive

### 3.1 Phase 0: Initiation (THINK Lane)

1. **User Input:** User messages Hermes (via Telegram, Discord, or Workspace): "I want to build an AI note-taking app."
2. **Signal Detection:** Hermes' signal detector (from GBrain) captures the idea. GBrain auto-links to any existing related notes.
3. **SEED Incubation:** Hermes runs `seed:incubate` skill. It asks 5 questions, determines type = Application (Deep rigor), and produces `PLANNING.md`.
4. **Canvas Visualization:** Galaxy Canvas creates a Venture Zone in the THINK lane with:
   - Idea Capture card (linked to GBrain signal)
   - Office Hours Session card (linked to the gstack skill invocation)
5. **Paperclip Company Creation:** Hermes creates a Paperclip company:
   - Name: "NoteTaker"
   - Goal: "Build #1 AI note-taking app to $1M ARR"
   - Budget: $240/month (user-configurable)
   - Agents hired: CEO (Hermes), CTO (Claude Code), Designer (Claude Code + Opus), Reviewer (Claude Code + Sonnet)
6. **Canvas Update:** Org chart appears inside the Venture Zone. Budget bar shows $0 / $240.

### 3.2 Phase 1: Planning (PLAN Lane)

1. **Office Hours:** Hermes runs `/office-hours` (gstack skill). 6 forcing questions. Design doc produced.
2. **CEO Review:** Hermes runs `/plan-ceo-review`. Strategic challenge. 4 scope modes. Plan approved.
3. **Engineering Review:** Hermes runs `/plan-eng-review`. Architecture locked. ASCII diagrams. Test matrix. Failure modes.
4. **Design Review:** Hermes runs `/plan-design-review`. AI slop detection. Design dimensions rated 0-10.
5. **Security Review:** Hermes runs `/cso`. OWASP + STRIDE. Threat model documented.
6. **Spec Authoring:** Hermes runs `/spec`. 5-phase spec: Why → Scope → Technical → Draft → File. Codex quality gate.
7. **Canvas Update:** All review cards appear in the PLAN lane. Each card shows status (pending → in-progress → approved). Knowledge pins from GBrain auto-attach to relevant cards.
8. **GBrain Write:** All plans, reviews, decisions, and architecture docs are written to GBrain with typed edges: `venture has plan`, `plan has review`, `review approves architecture`.

### 3.3 Phase 2: Build (BUILD Lane)

1. **Worker Spawn:** Hermes requests Docker to spawn a Worker Plane for the venture.
2. **Container Initialization:**
   - Claude Code installs gstack (`git clone ... ~/.claude/skills/gstack && ./setup`)
   - PAUL initializes (`.paul/` directory, `paul.toml`, `ledger.toml`)
   - CARL initializes (`carl.json` with domains: development, design, security, docs)
   - GBrain MCP connected (`claude mcp add gbrain -- gbrain serve` via worker's connection to Core GBrain)
3. **Canvas Session Card:** "NoteTaker Build #1" appears in BUILD lane. Status: 🟢 Active. Shows live terminal stream when clicked.
4. **Task Delegation:** Hermes delegates tasks to the Worker via gRPC:
   - "Implement auth flow" → PAUL Plan → Apply → Unify
   - "Implement notes CRUD" → PAUL Plan → Apply → Unify
   - "Design UI components" → gstack `/design-shotgun` → `/design-html`
5. **Live Updates:** Worker streams back to Hermes:
   - Code diffs (displayed in Canvas artifact cards)
   - Commit messages (linked to git graph)
   - Test results (pass/fail counts)
   - Cost reports (tokens used, model, duration)
6. **GBrain Indexing:** Every commit triggers `gbrain sync --strategy code`. Code definitions, references, and patterns are indexed.
7. **Continuous Checkpoint:** gstack's continuous checkpoint mode auto-commits WIP with `[gstack-context]` body. `/context-restore` available if session crashes.
8. **CARL Context:** Dynamic rules load based on task. "fix bug" → DEVELOPMENT domain. "write docs" → DOCS domain. Rules vanish when context changes.
9. **Pair Agent:** If needed, Hermes runs `/pair-agent` to share browser with another agent (e.g., OpenClaw for second opinion). Browser session appears as a shared card on the canvas.
10. **Build Complete:** All tasks implemented. Tests passing. Coverage acceptable. Worker signals completion.

### 3.4 Phase 3: Review (REVIEW Lane)

1. **Staff Engineer Review:** Hermes runs `/review` (gstack skill). Auto-fixes obvious issues. Flags completeness gaps.
2. **Cross-Model Review:** Hermes runs `/codex` (gstack skill). OpenAI Codex CLI reviews the same diff. Cross-model analysis shows overlap vs. unique findings.
3. **Security Audit:** Hermes runs `/cso` again. Post-implementation security review.
4. **Design Audit:** Hermes runs `/design-review`. Same audit as `/plan-design-review`, then fixes what it finds. Before/after screenshots.
5. **AEGIS Multi-Agent Audit:** Hermes runs `quality:audit` (AEGIS skill). 12 personas, 14 domains. 3-layer output: Layer A (diagnostic), Layer B (remediation), Layer C (PAUL-ready execution plan).
6. **Canvas Update:** Review cards appear in REVIEW lane. Each shows findings count (fixed/open/waived). Red cards for critical findings, yellow for warnings, green for clean.
7. **Remediation:** If AEGIS finds issues, Layer C generates PAUL-ready plans. Worker executes fixes. Cards cycle back to BUILD, then REVIEW.
8. **Approval:** All reviews pass. Cards turn green. Lane moves to TEST.

### 3.5 Phase 4: Test (TEST Lane)

1. **Browser QA:** Hermes runs `/qa` (gstack skill). Real Chromium browser. Real clicks. Real screenshots. Bug finding + auto-fixing.
2. **Unit Test Suite:** Worker runs existing tests. Coverage audit. gstack `/ship` bootstraps test framework if missing.
3. **E2E Tests:** Hermes runs `/qa` on staging URL. Full user flow testing.
4. **Performance Benchmark:** Hermes runs `/benchmark`. Core Web Vitals. Page load times. Resource sizes. Before/after comparison.
5. **iOS QA (if applicable):** Hermes runs `/ios-qa`. Real iPhone over USB. Swift source analysis. Auto-fixes.
6. **DX Review:** Hermes runs `/devex-review`. Live developer experience audit. Tests onboarding flow. Times TTHW. Screenshots errors.
7. **Canvas Update:** Test cards in TEST lane. Pass/fail counts. Coverage percentages. Performance scores.
8. **Regression Tests:** Every bug fix generates a regression test. Test suite grows. Canvas shows "Tests: 42 → 51 (+9 new)."
9. **Exit:** All tests pass. Coverage acceptable. Performance baselined. Lane moves to SHIP.

### 3.6 Phase 5: Ship (SHIP Lane)

1. **PR Creation:** Hermes runs `/ship` (gstack skill). Tests run. Coverage audit. PR opened. Commit messages meaningful.
2. **Document Release:** Hermes runs `/document-release`. Updates README, ARCHITECTURE, CONTRIBUTING, CLAUDE.md. Diataxis coverage map. Gaps identified.
3. **Document Generate:** If gaps found, Hermes runs `/document-generate`. Generates missing docs from scratch using Diataxis framework.
4. **Human Approval:** Paperclip sends approval request to user. User reviews PR, docs, test results. Canvas shows PR card with "Pending Approval" status.
5. **Deploy:** User approves. Hermes runs `/land-and-deploy`. Merge PR. Wait for CI. Deploy to production. Verify health.
6. **Canary:** Hermes runs `/canary`. Post-deploy monitoring. Watches for console errors, performance regressions, page failures.
7. **Canvas Update:** PR card → "Merged" → "Deployed" → "Canary Healthy" → "Production Verified". All green.
8. **GBrain Sync:** All shipped artifacts, docs, and decisions are synced to GBrain. `venture shipped product` edge created.

### 3.7 Phase 6: Reflect (REFLECT Lane)

1. **Retro:** Hermes runs `/retro` (gstack skill). Weekly engineering retrospective. Per-person breakdowns. Shipping streaks. Test health trends. Growth opportunities.
2. **Learnings:** Hermes runs `/learn`. Manages what gstack learned across sessions. Reviews, searches, prunes, and exports project-specific patterns, pitfalls, and preferences. Learnings compound.
3. **GBrain Sync:** Hermes runs `/sync-gbrain`. Re-indexes all code. Refreshes search guidance. Updates `CLAUDE.md` with GBrain search guidance block.
4. **Taste Update:** Hermes runs `gstack-taste-update`. Writes approvals/rejections from `/design-shotgun` into persistent per-project taste profile. Decays 5%/week. Feeds future variants.
5. **Canvas Update:** Retro card, Learnings card, GBrain Sync card, Taste Update card all in REFLECT lane. Green checkmarks when complete.
6. **Archive:** Worker container is archived (not destroyed). Snapshot saved to `/shared/ventures/{id}/archive/`. Full state preserved for forensic analysis or resurrection.
7. **Paperclip Close:** Paperclip marks venture as "Shipped". Final cost report: $127.43 / $240 budget. ROI metrics.
8. **GBrain Dream Cycle:** Overnight, GBrain enriches all venture data. Fixes citations. Scores salience. Finds contradictions. Preps tomorrow's tasks. New knowledge pins appear on the canvas next morning.

---

## 4. Multi-Venture Parallel Execution

### 4.1 Hermes Conductor

Hermes' Conductor (from Workspace) manages parallel venture execution:

```
┌─────────────────────────────────────────────────────────────┐
│                    HERMES CONDUCTOR                        │
│                    (Parallel Sprint Manager)                │
├─────────────────────────────────────────────────────────────┤
│  Venture 1: NoteTaker    │ Status: BUILD     │ Worker: 01  │
│  Venture 2: MarketAnalyzer│ Status: PLAN      │ Worker: 02  │
│  Venture 3: BlogPlatform  │ Status: THINK     │ Worker: 03  │
│  Venture 4: ApiRefactor   │ Status: REVIEW    │ Worker: 04  │
│  Venture 5: MobileApp     │ Status: TEST      │ Worker: 05  │
│  ...                     │                   │             │
│  ─────────────────────────────────────────────────────────  │
│  Active Workers: 5 / 15 (max)                               │
│  Budget Utilization: $892 / $1,200 (74%)                    │
│  Queue: 3 ventures waiting for worker allocation              │
│  Warm Workers: 2 (pre-spawned, idle)                        │
└─────────────────────────────────────────────────────────────┘
```

**Allocation Rules:**
1. **Priority:** Ventures are sorted by Paperclip priority (P0, P1, P2) and user-defined urgency.
2. **Budget Check:** Before allocating a worker, Paperclip verifies budget availability. If budget exceeded, venture is queued.
3. **Resource Check:** Hermes checks available CPU/memory. If insufficient, waits for another worker to complete.
4. **Warm Workers:** Pre-spawned idle workers reduce startup time from ~30s to ~3s.
5. **Auto-Scale:** When queue grows, Hermes can request approval from Paperclip (and user) to increase max workers beyond 15.

### 4.2 Canvas Multi-Venture View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GALAXY VIEW (0.1x)                              │
│                                                                             │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│   │   NoteTaker      │  │  MarketAnalyzer  │  │   BlogPlatform   │         │
│   │   ┌──────────┐   │  │   ┌──────────┐   │  │   ┌──────────┐   │         │
│   │   │ BUILD    │   │  │   │ PLAN     │   │  │   │ THINK    │   │         │
│   │   │ 🟢 3 sess│   │  │   │ 🟡 2 rev │   │  │   │ 🔵 1 idea│   │         │
│   │   └──────────┘   │  │   └──────────┘   │  │   └──────────┘   │         │
│   │   $127 / $240    │  │   $45 / $200     │  │   $0 / $150      │         │
│   │   53% budget     │  │   22% budget     │  │   0% budget      │         │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│   │   ApiRefactor    │  │   MobileApp      │  │   [+ New Venture]│         │
│   │   ┌──────────┐   │  │   ┌──────────┐   │  │                  │         │
│   │   │ REVIEW   │   │  │   │ TEST     │   │  │                  │         │
│   │   │ 🟡 5 find│   │  │   │ 🟢 0 bugs│   │  │                  │         │
│   │   └──────────┘   │  │   └──────────┘   │  │                  │         │
│   │   $89 / $300     │  │   $203 / $250    │  │                  │         │
│   │   30% budget     │  │   81% budget ⚠️  │  │                  │         │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
│   Workers: 5 active | Queue: 3 | Budget: $892 / $1,200 (74%)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Click any venture zone to zoom into **Venture View** (0.5x)
- Click any lane to zoom into **Lane View** (1.0x)
- Click any card to zoom into **Card View** (2.0x)
- Drag ventures to reorder priority
- Drag cards between ventures to reassign tasks (with Paperclip approval)

---

## 5. Integration: gstack in the Worker Plane

### 5.1 Why gstack Lives in the Worker Plane

gstack is **deeply optimized for Claude Code**. Its skills are designed to be invoked as slash commands within a Claude Code session. Its browser automation (`/browse`, `/qa`) uses Playwright within the Claude Code process. Its continuous checkpoint mode commits via Claude Code's git integration.

**The user explicitly requested:** "an instance of claude code with hermes configured to use claude code + gstack when starting or working with a venture"

This means:
- gstack is **not** a Hermes skill (it's a Claude Code skill pack)
- gstack runs **inside** the Claude Code session in the Worker Plane
- Hermes delegates to Claude Code, which then uses gstack skills internally
- This is a **two-level delegation**: Hermes (orchestrator) → Claude Code (executor) → gstack (methodology)

### 5.2 gstack + PAUL + CARL Coexistence

Inside the Worker Plane, Claude Code has three skill packs installed:

```
~/.claude/skills/
├── gstack/           # gstack skills (23+ specialists)
│   ├── office-hours/
│   ├── review/
│   ├── qa/
│   ├── ship/
│   ├── cso/
│   ├── browse/
│   ├── design-shotgun/
│   ├── ...
│   └── setup
├── paul/             # PAUL execution loop
│   ├── .paul/
│   │   ├── paul.toml
│   │   ├── ledger.toml
│   │   ├── STATE.md
│   │   └── ...
│   └── SKILLS/
├── carl/             # CARL dynamic rule injection
│   ├── carl.json
│   ├── carl-hook.py
│   └── domains/
└── seed/             # SEED venture incubator
    ├── seed.md
    └── data/
```

**Interaction Flow:**
1. Hermes sends task: "Build auth flow for NoteTaker"
2. Claude Code receives task via gRPC
3. Claude Code loads context from GBrain (via MCP)
4. Claude Code checks CARL: keyword "build" → DEVELOPMENT domain rules loaded
5. Claude Code runs PAUL: Plan → Apply → Unify
6. Within PAUL's Apply phase, Claude Code invokes gstack skills:
   - `/autoplan` → generates sub-tasks
   - `/review` → catches bugs mid-build
   - `/qa` → tests in browser
   - `/ship` → creates PR
7. CARL dynamically loads DOCS domain rules when documentation is needed
8. CARL loads SECURITY domain rules when `/cso` is invoked
9. All results, commits, and artifacts stream back to Hermes
10. Hermes updates Galaxy Canvas and Paperclip

### 5.3 gstack's Conductor vs. Hermes Conductor

gstack's Conductor (for running 10-15 parallel Claude Code sessions) is **superseded by** Hermes' Conductor in the Core Plane. However, gstack's Conductor still has value within a **single Worker Plane** for parallel tasks within one venture:

- **Hermes Conductor:** Orchestrates multiple Worker Planes (one per venture). 15 max.
- **gstack Conductor:** Within a single Worker Plane, Claude Code can run 2-3 parallel gstack sessions (e.g., `/review` on one branch while `/qa` runs on another). This is managed by Claude Code's native subprocess handling.

This is a **hierarchical** conductor model:
```
Hermes Conductor (Core Plane)
├── Worker Plane 1: NoteTaker
│   └── gstack Conductor (inside Claude Code)
│       ├── Session A: /autoplan + implement
│       ├── Session B: /review (background)
│       └── Session C: /qa (staging URL)
├── Worker Plane 2: MarketAnalyzer
│   └── gstack Conductor
│       ├── Session A: /office-hours
│       └── Session B: /investigate
└── Worker Plane 3: BlogPlatform
    └── gstack Conductor
        └── Session A: /design-shotgun
```

### 5.4 gstack + Oh My Pi Coexistence

Oh My Pi is installed in the Worker Plane as an **alternative coding surface** that Claude Code can invoke:

```
# Inside Worker Plane, Claude Code can spawn Oh My Pi for specific tasks
# Example: Oh My Pi for Rust-heavy work (superior LSP/DAP support)

Hermes Task: "Implement Rust backend for NoteTaker"
→ Claude Code: "This is Rust-heavy. Let me use Oh My Pi for this."
→ Claude Code spawns: `omp --model claude-sonnet-4 --task "implement auth in Rust"`
→ Oh My Pi executes with LSP, DAP, and 53 language servers
→ Oh My Pi returns: code, test results, diff
→ Claude Code incorporates into the broader gstack workflow
→ Continue with gstack `/review`, `/ship`, etc.
```

Oh My Pi is **not** the primary executor. It is a **specialist tool** within the Worker Plane, invoked by Claude Code (or directly by Hermes) for tasks where its LSP/DAP capabilities are superior.

---

## 6. DenchClaw Integration: The CRM Bridge

### 6.1 Architecture

DenchClaw runs as a **satellite service** in the Core Plane. It is isolated because it requires OpenClaw, which is not part of the Galaxy stack.

```
┌────────────────────────────────────────────────────────────┐
│  CORE PLANE                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Paperclip  │  │  DenchClaw  │  │   OpenClaw GW       │  │
│  │  (Node.js)  │  │  (Node.js)  │  │   (Port 19001)      │  │
│  │             │  │             │  │                     │  │
│  │  • Ventures │  │  • CRM Data │  │  • DenchClaw's      │  │
│  │  • Budgets  │  │  • Deals    │  │    required infra   │  │
│  │  • Goals    │  │  • Contacts │  │  • Not used by      │  │
│  │  • Tickets  │  │  • Pipelines│  │    other Galaxy     │  │
│  │             │  │             │  │    components       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                                  │
│         │ REST API       │ REST API                         │
│         └────────────────┘                                  │
│              Galaxy CRM Bridge (custom adapter)             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Data Flow

**Paperclip → DenchClaw:**
1. New venture "NoteTaker" created in Paperclip
2. Paperclip sends venture data to DenchClaw via bridge:
   - Company name, goal, market segment
   - Potential customers (if known from user input)
   - Competitors (if identified in SEED phase)
3. DenchClaw creates:
   - Company record in CRM
   - Deal pipeline: "NoteTaker Product Launch"
   - Contacts: user (founder), any identified customers

**DenchClaw → Paperclip:**
1. DenchClaw enriches contacts (e.g., from LinkedIn, email, etc.)
2. DenchClaw returns enriched data to Paperclip:
   - Contact details, company affiliations, deal history
   - Pipeline status (lead → qualified → proposal → closed)
3. Paperclip displays CRM data in venture dashboard:
   - "5 leads captured", "2 deals in pipeline", "1 customer closed"

**GBrain ↔ DenchClaw:**
1. DenchClaw contacts are synced to GBrain as `person` and `company` pages
2. Typed edges created: `person works_at company`, `company has deal`, `deal relates_to venture`
3. GBrain dream cycle enriches these pages overnight
4. When Hermes prepares for a meeting, GBrain provides: "You last spoke to Alice on April 22. She owes you the security review."

### 6.3 User Interface

- **DenchClaw UI:** Accessible at `http://galaxy-denchclaw:3100`. Full CRM functionality.
- **Paperclip CRM Tab:** Paperclip's venture dashboard has a "CRM" tab that shows DenchClaw data inline (via API bridge). Users don't need to leave Paperclip for basic CRM views.
- **Galaxy Canvas:** CRM contacts appear as knowledge pins. Deal pipeline status appears as a mini-dashboard inside the venture zone.
- **Hermes Queries:** User can ask Hermes: "Who are our top leads for NoteTaker?" → Hermes queries DenchClaw via Paperclip bridge → GBrain synthesis → Answer with citations.

---

## 7. Security & Isolation

### 7.1 Container Isolation

| Plane | Network | External Access | Secrets | Data Persistence |
|-------|---------|-----------------|---------|-----------------|
| **Core Plane** | galaxy-internal + galaxy-external | Yes (via Tailscale) | Vault-mounted read-only | Persistent volumes |
| **Worker Plane** | galaxy-internal only | No (proxy via Hermes) | Inherit from Core (read-only) | Venture-specific (ephemeral) |
| **DenchClaw** | galaxy-internal + limited external | Yes (for web UI) | Separate vault | Persistent volume |

### 7.2 Secret Management

```
/shared/secrets/
├── anthropic.key          # Claude Code API key
├── openai.key             # Codex / GPT API key
├── openrouter.key         # Hermes routing key
├── gbrain.token           # GBrain admin token
├── paperclip.key          # Paperclip admin key
├── denchclaw.key          # DenchClaw API key
├── tailscale.key          # Tailscale auth key
├── supabase-url           # Optional: shared Supabase
└── ssh-keys/              # Git push keys
    ├── github-deploy
    └── gitlab-deploy
```

- All secrets are mounted as **read-only** files (not env vars, to prevent accidental logging)
- Worker Planes only receive the secrets they need (principle of least privilege)
- Rotation: Hermes can trigger secret rotation via a `security:rotate-secrets` skill

### 7.3 Prompt Injection Defense

- **gstack's layered defense** is active in all Worker Planes:
  - 22MB ML classifier scans every page and tool output locally
  - Claude Haiku transcript check votes on conversation shape
  - Random canary token in system prompt catches exfiltration
  - 2-of-3 classifier agreement before blocking
- **Hermes' built-in security:** Command approval for destructive commands, container isolation, path-traversal guards
- **Network:** Worker Planes have no external outbound access. All web requests (browser QA, API calls) are proxied through Hermes in the Core Plane, which can apply rate limiting and domain restrictions.

### 7.4 Cost Guardrails

| Guardrail | Mechanism | Action |
|-----------|-----------|--------|
| Budget Limit | Paperclip per-venture budget | Auto-pause at 100% |
| Worker Timeout | Docker container max lifetime | Auto-archive after 24h idle / 72h active |
| Token Rate Limit | Hermes API gateway | Throttle if > 10K tokens/min |
| Model Tier Gate | Paperclip approval required | Opus-level models need explicit approval |
| Emergency Stop | User command: "STOP ALL" | Immediately pause all workers, preserve state |

---

## 8. Deployment Guide

### 8.1 Prerequisites

- **Hardware:** 16GB RAM minimum, 32GB recommended. 4+ CPU cores. 100GB disk.
- **OS:** Linux (Ubuntu 22.04+ recommended), macOS (with Docker Desktop), or Windows (WSL2).
- **Software:** Docker 24+, Docker Compose 2.20+, Git, Bun 1.0+, Node.js 20+.
- **API Keys:** Anthropic (Claude), OpenAI (optional), OpenRouter (for Hermes model routing), ZeroEntropy (for GBrain embeddings, optional).

### 8.2 Step-by-Step Deployment

**Step 1: Clone Galaxy Repository**
```bash
git clone https://github.com/your-org/galaxy.git
cd galaxy
```

**Step 2: Configure Secrets**
```bash
mkdir -p shared/secrets
echo "YOUR_ANTHROPIC_KEY" > shared/secrets/anthropic.key
echo "YOUR_OPENROUTER_KEY" > shared/secrets/openrouter.key
# Add other keys as needed
chmod 600 shared/secrets/*
```

**Step 3: Start Core Plane**
```bash
docker-compose -f docker-compose.galaxy-core.yml up -d
```

**Step 4: Verify Core Services**
```bash
# Hermes API
curl http://localhost:8080/health

# Hermes Workspace UI
open http://localhost:3000

# Galaxy Canvas API + WebSocket
curl http://localhost:3001/health

# Paperclip API
curl http://localhost:3100/health

# GBrain MCP
gbrain doctor --remote localhost:50051

# DenchClaw Web UI
open http://localhost:3100
```

**Step 5: Initialize GBrain**
```bash
# Via Hermes CLI
galaxy-hermes-cli gbrain init --pglite
# Or via Hermes chat: "Initialize my brain"
```

**Step 6: Connect Hermes to GBrain**
```bash
# This is auto-configured in docker-compose, but verify:
galaxy-hermes-cli mcp add gbrain -- grpc://localhost:50051
```

**Step 7: Start First Venture**
```bash
# Via Hermes chat: "I want to build an AI note-taking app"
# Or via CLI:
galaxy-hermes-cli venture create \
  --name "NoteTaker" \
  --goal "Build #1 AI note-taking app" \
  --budget 240 \
  --type application

# Hermes will auto-spawn Worker Plane, run SEED, and start the SDLC
```

**Step 8: Monitor in Galaxy Canvas**
```bash
open http://localhost:3000/canvas
# Or navigate to the Canvas tab in Hermes Workspace
```

### 8.3 Production Deployment (Kubernetes)

For production, use the Kubernetes manifests in `k8s/`:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/gbrain.yaml
kubectl apply -f k8s/hermes.yaml
kubectl apply -f k8s/hermes-workspace.yaml
kubectl apply -f k8s/galaxy-canvas.yaml
kubectl apply -f k8s/paperclip.yaml
kubectl apply -f k8s/denchclaw.yaml
kubectl apply -f k8s/tailscale.yaml
kubectl apply -f k8s/ingress.yaml
```

Worker Planes are deployed as **Kubernetes Jobs** with TTL:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: galaxy-worker-notetaker
spec:
  ttlSecondsAfterFinished: 86400  # Archive for 24h, then delete
  template:
    spec:
      containers:
      - name: claude-code
        image: galaxy/claude-code-worker:latest
        resources:
          limits:
            cpu: "4"
            memory: "8Gi"
        env:
        - name: VENTURE_ID
          value: "notetaker-2026-001"
      restartPolicy: Never
```

### 8.4 Tailscale for Remote Access

```bash
# Tailscale is included in the Core Plane
# Get your auth key from https://login.tailscale.com/admin/settings/keys
# Add it to shared/secrets/tailscale.key

# After deployment, your Galaxy is accessible from any Tailscale device:
# http://galaxy-core (magic DNS)
# http://galaxy-workspace:3000
# http://galaxy-paperclip:3100
# http://galaxy-denchclaw:3100
```

---

## 9. Monitoring & Observability

### 9.1 Metrics Dashboard

A built-in Prometheus + Grafana stack (optional, in `monitoring/`) tracks:

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Worker CPU/Memory | Docker stats | > 90% for 5min |
| API Request Latency | Fastify middleware | > 2s p99 |
| WebSocket Connections | Socket.io | Drops > 10% in 1min |
| Token Usage per Venture | Paperclip | > 80% of budget |
| GBrain Sync Lag | GBrain metrics | > 30min behind |
| DenchClaw API Health | Health check | 2 consecutive failures |
| Error Rate | All services | > 1% for 5min |

### 9.2 Audit Log

Every action is logged to a structured audit log (JSONL, stored in GBrain):

```json
{"timestamp": "2026-05-01T14:23:00Z", "actor": "hermes", "action": "worker.spawn", "target": "notetaker-worker-01", "venture_id": "notetaker-2026-001", "cost": 0.00, "metadata": {"model": "claude-sonnet-4", "skills": ["gstack", "paul", "carl"]}}
{"timestamp": "2026-05-01T14:25:00Z", "actor": "claude-code", "action": "gstack.skill.invoke", "target": "/office-hours", "venture_id": "notetaker-2026-001", "cost": 0.45, "metadata": {"tokens_in": 1200, "tokens_out": 3400}}
{"timestamp": "2026-05-01T14:30:00Z", "actor": "paperclip", "action": "budget.alert", "target": "notetaker-2026-001", "cost": 192.00, "metadata": {"threshold": 0.8, "budget": 240.00}}
```

### 9.3 Cost Attribution

Every API call, every token, every model invocation is attributed to a venture:

```
Venture: NoteTaker (notetaker-2026-001)
├── Phase: THINK
│   ├── /office-hours: $0.45 (Claude Sonnet, 4.6K tokens)
│   └── /learn: $0.12 (Claude Haiku, 1.2K tokens)
├── Phase: PLAN
│   ├── /plan-ceo-review: $0.67 (Claude Opus, 8.1K tokens)
│   ├── /plan-eng-review: $0.34 (Claude Sonnet, 3.2K tokens)
│   └── /cso: $0.89 (Claude Opus, 10.2K tokens)
├── Phase: BUILD
│   ├── Session #1 (auth flow): $12.45 (Claude Sonnet, 145K tokens)
│   ├── Session #2 (notes CRUD): $8.23 (Claude Sonnet, 98K tokens)
│   ├── Session #3 (UI design): $15.67 (Claude Opus, 187K tokens)
│   └── /browse (research): $2.34 (Browser automation, 23K tokens)
├── Phase: REVIEW
│   ├── /review: $4.56 (Claude Sonnet, 54K tokens)
│   ├── /codex: $3.21 (GPT-4, 38K tokens)
│   └── /cso (post-build): $1.78 (Claude Sonnet, 21K tokens)
├── Phase: TEST
│   ├── /qa (browser): $5.67 (Browser automation, 67K tokens)
│   └── /benchmark: $0.89 (Claude Haiku, 10K tokens)
├── Phase: SHIP
│   ├── /ship: $2.34 (Claude Sonnet, 28K tokens)
│   ├── /document-release: $1.45 (Claude Sonnet, 17K tokens)
│   └── CI/CD (GitHub Actions): $0.00 (free tier)
├── Phase: REFLECT
│   ├── /retro: $0.67 (Claude Sonnet, 8K tokens)
│   ├── /sync-gbrain: $0.23 (Embedding, 2.8K tokens)
│   └── /learn: $0.12 (Claude Haiku, 1.4K tokens)
└── Total: $61.01 / $240.00 (25%)
```

---

## 10. Summary: What Changed from v1

| v1 (Original) | v2 (Refined) | Rationale |
|---------------|--------------|-----------|
| Agor.live **excluded** due to BSL license | **Galaxy Canvas** included — open-source (MIT) spatial canvas built on React Flow | User requested equivalent. React Flow is MIT-licensed. |
| No spatial visualization | 7 SDLC lanes with swimlanes, real-time sync, multi-zoom levels | Visual management of parallel ventures |
| Single runtime assumption | **Container architecture**: Core Plane (always on) + Worker Planes (ephemeral per venture) | Isolation, resource management, cost control, gstack compatibility |
| gstack as Hermes skill | **gstack lives in Worker Plane** with Claude Code — it's a Claude Code skill pack, not a Hermes skill | gstack is optimized for Claude Code slash commands |
| Oh My Pi as primary coding engine | **Claude Code + gstack** as primary, Oh My Pi as specialist fallback | User explicitly requested Claude Code + gstack for ventures |
| PAUL as Hermes skill | **PAUL lives in Worker Plane** with Claude Code — it's a project orchestration loop inside the coding session | PAUL is designed for Claude Code's `.paul/` directory |
| CARL as Hermes skill | **CARL lives in Worker Plane** with Claude Code — dynamic rule injection inside the session | CARL is a hook that runs on every Claude Code interaction |
| No DenchClaw integration details | **Full CRM bridge** architecture: Paperclip ↔ DenchClaw via REST API, GBrain sync, inline UI | User explicitly paired Paperclip with DenchClaw |
| No deployment guide | **Docker Compose + Kubernetes** manifests, step-by-step deployment, Tailscale integration | Production-ready architecture |
| No monitoring | **Prometheus + Grafana** metrics, structured audit logs, cost attribution per venture | Operational visibility |

---

## 11. Appendix: Full Component List

### INCLUDED (Run as containers)
1. **Hermes** (Core Plane) — Autonomous agent
2. **Hermes Workspace** (Core Plane) — Web UI
3. **Galaxy Canvas** (Core Plane) — Spatial canvas with SDLC lanes
4. **GBrain** (Core Plane) — Persistent knowledge + graph
5. **Paperclip** (Core Plane) — Venture orchestration
6. **DenchClaw** (Core Plane) — CRM satellite
7. **Claude Code** (Worker Plane) — Primary coding executor
8. **gstack** (Worker Plane) — 23+ skills inside Claude Code
9. **PAUL** (Worker Plane) — Plan-Apply-Unify loop inside Claude Code
10. **CARL** (Worker Plane) — Dynamic rule injection inside Claude Code
11. **SEED** (Worker Plane) — Venture incubator, invoked by Hermes
12. **Oh My Pi** (Worker Plane, optional) — Specialist coding surface

### ADAPTED (Ported as features/extensions)
13. **OpenViking** → GBrain hierarchical retrieval (`--depth abstract|overview|detail`)
14. **OpenBrain1** → GBrain capture channels + import recipes
15. **BASE** → GBrain workspace schema pack + health monitoring
16. **AEGIS** → `quality:audit` skill (runs inside Claude Code via gstack)
17. **GSD Core** → 5-phase project lifecycle template (THINK → PLAN → BUILD → REVIEW → TEST → SHIP → REFLECT)

### EXCLUDED (Redundant or incompatible)
18. **Agor.live** → Replaced by Galaxy Canvas (open-source, MIT)
19. **GSD Pi** → Superseded by Claude Code + gstack + Oh My Pi

---

*Document: HERMES GALAXY v2. Architecture: Container-First with Galaxy Canvas.*
*Last updated: 2026-05-01*
