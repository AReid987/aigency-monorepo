# THE HERMES GALAXY: Unified Agent Architecture

## Executive Summary

This document designs a single, cohesive, unified system that integrates **17 distinct open-source AI/tech projects** into one coherent architecture. The design follows the user's stated mental model:

- **Hermes** = Base Agent (the autonomous core)
- **Oh My Pi** = Coding Delegate (the execution engine Hermes delegates to)
- **Paperclip** = Venture Orchestration Layer (business, org charts, budgets, governance)
- **DenchClaw** = CRM Module (pairs with Paperclip for venture operations)

The resulting system is codenamed **"HERMES GALAXY"** — a multi-layer agent operating system where each layer has a single, best-in-class component, with redundant functionality either absorbed or explicitly excluded with rationale.

---

## 1. Project Analysis Matrix

| # | Project | Owner | Purpose | Stack | Decision | Role in Galaxy |
|---|---------|-------|---------|-------|----------|----------------|
| 1 | **Hermes** | Nous Research | Autonomous agent with self-improving learning loop | Python, 60+ tools, 20+ messaging platforms | **KEEP** | **Layer 1: Base Agent** — The autonomous core. Heartbeat, skills, memory, MCP, voice, scheduled automations. |
| 2 | **Hermes Workspace** | outsourc-e | Web UI, chat, files, terminal, swarm mode, conductor | TypeScript/React, PWA | **KEEP** | **Layer 1: Control Plane** — Web dashboard for Hermes. Conductor for dispatch, swarm orchestration, agent view. |
| 3 | **Oh My Pi (omp)** | can1357 | Coding agent with IDE wired in (LSP, DAP, debugger) | Rust (~55k lines), 40+ providers, 32 tools | **KEEP** | **Layer 2: Coding Engine** — The execution surface. Hermes delegates coding tasks here. |
| 4 | **GBrain** | garrytan | Persistent knowledge base with graph + synthesis | TypeScript/Bun, PGLite/Postgres/pgvector, hybrid search | **KEEP** | **Layer 3: Canonical Brain** — All memory routes through here. Hybrid search, auto-link graph, dream cycle. |
| 5 | **GStack** | garrytan | Software factory with 23+ specialist skills | TypeScript/Bun, Markdown skills | **ADAPT** | **Layer 4: Methodology Skills** — Skills imported into Hermes skill system. Not a runtime. |
| 6 | **Paperclip** | paperclip.ing | Venture orchestration (org charts, budgets, governance) | Node.js, self-hosted, embedded Postgres | **KEEP** | **Layer 5: Business OS** — Org chart, goals, heartbeats, cost tracking, ticket system. |
| 7 | **DenchClaw** | DenchHQ | CRM framework built on OpenClaw | Node.js, OpenClaw gateway | **ADAPT** | **Layer 5: CRM Module** — Requires isolation due to OpenClaw dependency. Runs as satellite service. |
| 8 | **Agor** | agor.live | Team command center for agentic development | FeathersJS, React, Socket.io, BSL license | **EXCLUDE** | Spatial multiplayer canvas overlaps with Hermes Workspace + Paperclip. BSL license incompatible. |
| 9 | **OpenViking** | openviking.ai | Context database with virtual FS paradigm | Python, virtual file system | **ADAPT** | **Layer 3: Context Loader** — Hierarchical L0/L1/L2 context loading imported into GBrain as a retrieval mode. |
| 10 | **OpenBrain1 (OB1)** | NateBJones | Cross-tool AI memory (thoughts DB, MCP) | Supabase, PostgreSQL/pgvector, SvelteKit | **ADAPT** | **Layer 3: Capture Channels** — Slack/Discord capture + data import recipes integrated into GBrain ingestion. |
| 11 | **SEED** | ChristopherKahler | Typed project incubator | Markdown, npm | **ADAPT** | **Layer 4: Venture Launcher** — Hermes skill for incubating new Paperclip ventures. Generates PLANNING.md. |
| 12 | **PAUL** | ChristopherKahler | Plan-Apply-Unify execution loop | Markdown, toml, 26 slash commands | **ADAPT** | **Layer 4: Execution Loop** — Project methodology skill for Hermes. Plan → Apply → Unify. |
| 13 | **CARL** | ChristopherKahler | Dynamic rule injection engine | Python, JSON, MCP | **ADAPT** | **Layer 4: Context Router** — Dynamic rule injection added to Hermes' skill system. |
| 14 | **AEGIS** | ChristopherKahler | Multi-agent codebase audit (12 personas) | Markdown, bash | **ADAPT** | **Layer 4: Quality Gate** — Audit skill for Hermes. Pre-ship safety review. |
| 15 | **BASE** | ChristopherKahler | Workspace operating system with knowledge graph | JSON, Python hooks, MCP | **ADAPT** | **Layer 3: Workspace Graph** — Concepts absorbed into GBrain as schema packs + workspace health monitoring. |
| 16 | **GSD Pi** | OpenGSD | CLI coding agent with planning + worktrees | TypeScript, SQLite, TUI/Web UI | **EXCLUDE** | Redundant with Oh My Pi (inferior coding surface) + Hermes (planning). Oh My Pi is best-in-class. |
| 17 | **GSD Core** | OpenGSD | Spec-driven meta-framework (5-phase loop) | Markdown, any runtime | **ADAPT** | **Layer 4: Meta-Methodology** — The 5-phase loop (Discuss→Plan→Execute→Verify→Ship) becomes the default project lifecycle. |

---

## 2. Functional Layer Map

### Layer 1: AUTONOMOUS CORE (The "Consciousness")
**Components:** Hermes + Hermes Workspace

Hermes is the user's stated base agent. It is the only project in this list that is a **self-improving autonomous agent** with a learning loop, skill creation, and cross-session memory. It is the natural center of the system.

- **Hermes** provides: 60+ built-in tools, 20+ messaging platforms, voice mode, cron automations, MCP integration, memory system, skills system, delegates/parallel subagents, Honcho user modeling.
- **Hermes Workspace** provides: Web dashboard, chat, file browser, terminal, operations dashboard, conductor for mission dispatch, swarm mode with persistent tmux workers, kanban taskboard, agent view, PWA + Tailscale.

> **Why not GSD Pi or gstack as base?** Hermes is a true autonomous agent that runs anywhere and improves over time. GSD Pi is a CLI coding agent (narrower). gstack is a skill pack for Claude Code (not a standalone agent). Oh My Pi is a coding surface (not an orchestrator).

### Layer 2: CODING ENGINE (The "Hands")
**Component:** Oh My Pi

Hermes delegates all coding tasks to Oh My Pi. This is the user's stated mental model.

- **Why Oh My Pi?** It is the most capable coding surface in the list: LSP wired into every write (14 ops, 53 servers), real debugger (28 DAP ops, 14 adapters), code execution with Python/JS kernels that can callback to agent tools, time-traveling stream rules, 40+ providers, 55k Rust core. No other project matches this capability.
- **Integration:** Oh My Pi runs as a **delegate** under Hermes. Hermes spawns Oh My Pi sessions for coding tasks via Hermes' `execute_code` or subprocess delegation. Results and artifacts flow back to Hermes, which writes them to GBrain.
- **GSD Pi excluded:** GSD Pi is a fork of Pi by Mario Zechner. Oh My Pi is explicitly a "fork of Pi with batteries included." Oh My Pi supersedes GSD Pi in every dimension. GSD Pi's unique features (worktree isolation, TUI) are not worth the redundancy — worktree isolation can be handled by Hermes' git tools, and the TUI is superseded by Hermes Workspace.

### Layer 3: MEMORY & KNOWLEDGE (The "Brain")
**Component:** GBrain (canonical), with adapted concepts from OpenViking, OpenBrain1, BASE

All memory, knowledge, context, and state flows through GBrain.

- **Why GBrain over OpenBrain1?** GBrain has three features nobody else ships together: (1) synthesis layer with gap analysis, (2) self-wiring knowledge graph with typed edges, (3) overnight dream cycle for enrichment. Benchmarked: +31.4 P@5 over vector-only RAG. 146K pages in production use by Garry Tan.
- **Why GBrain over OpenViking?** OpenViking's virtual file system is elegant but GBrain already has a git-backed markdown repo + hybrid search. OpenViking's L0/L1/L2 hierarchical context loading can be **adapted** as a GBrain retrieval mode (e.g., `gbrain retrieve --depth abstract|overview|detail`).
- **Why GBrain over BASE?** BASE is a workspace OS with knowledge graph. GBrain is a universal brain that serves as workspace graph + personal brain + company brain. BASE's concepts (projects, entities, PSMM, drift detection) become **GBrain schema packs** and workspace health monitoring extensions.
- **OpenBrain1 adaptation:** OB1's Slack/Discord capture channels, data import recipes (ChatGPT, Obsidian, X, Gmail, etc.), and cross-tool MCP memory pattern are integrated into GBrain's ingestion pipeline. OB1's SvelteKit/Next.js dashboards are redundant with Hermes Workspace + Paperclip UI.
- **BASE adaptation:** BASE's workspace.json manifest, operator.json, PAUL auto-discovery, and drift score calculation become GBrain workspace extensions. PSMM (Per-Session Meta Memory) becomes a GBrain feature that re-injects session insights into context.

### Layer 4: METHODOLOGY & QUALITY (The "Discipline")
**Components:** GStack Skills, SEED, PAUL, CARL, AEGIS, GSD Core (adapted as skills/workflows)

These are not standalone runtimes — they become **Hermes skills** and **Paperclip workflows**.

- **GStack Skills → Hermes Skills:** gstack's 23+ specialist skills (`/office-hours`, `/plan-ceo-review`, `/review`, `/qa`, `/ship`, `/cso`, `/browse`, `/design-shotgun`, etc.) are converted to Hermes skills using the `agentskills.io` / Hermes skill format. gstack's browser automation (`/browse`, `/open-gstack-browser`) integrates with Hermes' built-in web tools. gstack's Conductor for parallel sprints maps to Hermes' swarm mode + Paperclip's org chart.
- **SEED → Venture Incubator Skill:** SEED's typed project incubation (5 project types: Application, Workflow, Client, Utility, Campaign) becomes a Hermes skill for launching new Paperclip ventures. `/seed launch` generates a PLANNING.md that Paperclip's CEO agent ingests.
- **PAUL → Execution Loop Skill:** PAUL's Plan-Apply-Unify loop with 26 slash commands, scope-adaptive ceremony, A.D.D. format, and diagnostic routing becomes the default coding execution methodology within Oh My Pi sessions. PAUL's `paul.toml` manifest integrates with GBrain's project tracking.
- **CARL → Context Router Skill:** CARL's dynamic rule injection (domain-based, keyword-triggered, context-bracketed) becomes a Hermes skill that dynamically loads context based on conversation state. This replaces static `SOUL.md` / `CLAUDE.md` with adaptive context.
- **AEGIS → Quality Gate Skill:** AEGIS's 12-agent, 14-domain audit pipeline becomes a Hermes pre-ship skill. Layer A (diagnostic) → Layer B (remediation) → Layer C (PAUL-ready execution). Triggered before Paperclip approves a PR.
- **GSD Core → Meta-Methodology:** The 5-phase loop (Discuss → Plan → Execute → Verify → Ship) becomes the default project lifecycle for all Paperclip ventures. It is not a runtime — it is a process template that every Paperclip project follows. The `.planning/` markdown artifacts are stored in GBrain.

### Layer 5: BUSINESS ORCHESTRATION (The "Company")
**Components:** Paperclip + DenchClaw

- **Paperclip** is the user's stated venture orchestration layer. It provides: org charts, goal alignment, cost budgets per agent, ticket system, heartbeats, governance (board approval), multi-company support. It is the "business operating system" of the Galaxy.
- **Hermes as CEO:** In Paperclip, Hermes is the CEO agent. It hires Oh My Pi as the CTO/Coding Engineer, GBrain as the institutional memory, and uses gstack skills for product reviews.
- **DenchClaw as CRM:** DenchClaw is the CRM module. However, it has a **critical dependency on OpenClaw**, which is not part of the Galaxy stack. Resolution: DenchClaw runs as a **satellite service** in its own OpenClaw gateway (`~/.openclaw-dench`). Paperclip connects to DenchClaw via its API (localhost:3100) or through a Paperclip adapter. Data syncs bidirectionally: Paperclip sends venture contacts to DenchClaw, DenchClaw returns deal status.

---

## 3. Redundancy Analysis & Resolution

### Full Redundancy: GSD Pi (Excluded)

| Dimension | GSD Pi | Oh My Pi | Winner |
|-----------|--------|----------|--------|
| Coding surface | CLI agent | IDE-wired surface (LSP, DAP) | Oh My Pi |
| Providers | Multi-provider | 40+ providers | Oh My Pi |
| Tools | Built-in | 32 built-in + LSP + DAP | Oh My Pi |
| Language support | General | 53 LSP servers | Oh My Pi |
| Debugging | Limited | 28 DAP ops, 14 adapters | Oh My Pi |
| Code execution | Basic | Python + JS kernels with callbacks | Oh My Pi |
| Planning | Milestones/slices/tasks | Hermes + PAUL handle this | N/A (not Oh My Pi's job) |
| Worktree isolation | Yes | Can be added via git tools | Not critical |
| TUI | Yes | Can use Hermes Workspace | Not critical |

**Verdict:** GSD Pi is entirely superseded by Oh My Pi + Hermes + PAUL. No functionality is lost.

### Partial Redundancy: GSD Core (Adapted)

GSD Core is a **meta-framework** that defines a 5-phase loop. It does not compete with Oh My Pi (execution) or Hermes (agent). It competes with gstack's sprint process and PAUL's loop.

**Resolution:** GSD Core's 5-phase loop is elevated to the **default project lifecycle template** for all Paperclip ventures. It is not a runtime — it is the process that gstack skills, PAUL execution, and SEED incubation follow. gstack provides the *skills* (what to do), PAUL provides the *execution* (how to do it), and GSD Core provides the *lifecycle* (when to do it).

### Partial Redundancy: OpenViking (Adapted)

OpenViking provides a virtual file system context database with L0/L1/L2 hierarchical loading.

**Resolution:** GBrain already has a git-backed markdown repo. OpenViking's innovation is the **hierarchical context retrieval** (abstract → overview → detail). This is adapted as a `gbrain retrieve --depth` feature. The `viking://` URI scheme is not needed because GBrain already has a URI contract (`gbrain search`, `gbrain think`).

### Partial Redundancy: OpenBrain1 (Adapted)

OpenBrain1 provides cross-tool memory via PostgreSQL + pgvector + MCP.

**Resolution:** GBrain already uses PostgreSQL + pgvector + MCP. OB1's unique contributions are:
1. **Capture channels:** Slack/Discord quick-capture bots → Integrated into GBrain ingestion.
2. **Data import recipes:** ChatGPT, Obsidian, X, Gmail, etc. → Integrated into GBrain `gbrain import` recipes.
3. **Dashboards:** SvelteKit/Next.js → Excluded (Hermes Workspace + Paperclip provide UI).
4. **Community extensions:** CRM, wiki, household KB → Schema packs for GBrain.

### Full Redundancy: Agor (Excluded)

**Why excluded:**
1. **BSL License:** Business Source License 1.1 is not fully open-source. It cannot be integrated into a unified open-source system without licensing constraints.
2. **Function overlap:** Agor's spatial multiplayer canvas, session trees, and branch pipelines overlap with Hermes Workspace (conductor, swarm, kanban) + Paperclip (org chart, task board). Agor's real-time collaboration is a feature, not a core function.
3. **Tech stack mismatch:** FeathersJS + React is a different stack from the rest of the system (Hermes Python, Paperclip Node.js, GBrain TypeScript/Bun).

**Verdict:** Agor is a well-designed product but does not fit the unified architecture. Users who need spatial canvases can run Agor separately.

---

## 4. Integration Conflicts & Exclusions

### Exclusion: Agor.live
- **Reason:** BSL license incompatible with unified open-source system. Functionality overlaps with Hermes Workspace + Paperclip. Spatial canvas is a niche feature, not a core requirement.
- **Replacement:** Hermes Workspace dashboard + Paperclip ticket board + swarm mode.

### Exclusion: GSD Pi
- **Reason:** Entirely superseded by Oh My Pi (superior coding surface) + Hermes (planning/orchestration) + PAUL (execution loop). Every unique feature of GSD Pi has a better alternative in the Galaxy.
- **Replacement:** Oh My Pi + Hermes + PAUL.

### Adaptation: DenchClaw (OpenClaw Dependency)
- **Conflict:** DenchClaw is built on OpenClaw (`~/.openclaw-dench`). The Galaxy uses Hermes as the base agent, not OpenClaw.
- **Resolution:** DenchClaw runs as a **satellite CRM service** with its own OpenClaw gateway. Paperclip connects to DenchClaw via HTTP API (localhost:3100) and a Paperclip adapter. This is an intentional bridge, not a full integration. The user explicitly wants DenchClaw as the CRM, so we preserve it but isolate its runtime.
- **Data flow:** Paperclip sends new venture contacts → DenchClaw API. DenchClaw returns deal status, contact enrichment → Paperclip displays in venture dashboard.

### Adaptation: GStack (Claude Code Orientation)
- **Conflict:** gstack is heavily designed for Claude Code (`~/.claude/skills/gstack`). The Galaxy uses Hermes as the base agent.
- **Resolution:** gstack's skills are **agent-agnostic** — they are markdown files with slash commands. gstack already supports Hermes (`--host hermes`). The skills (`/office-hours`, `/review`, `/ship`, etc.) are installed as Hermes skills via `agentskills.io` compatibility. GBrain setup works natively with Hermes (`/setup-gbrain` with `--host hermes`).

### Adaptation: Christopher Kahler Suite (Claude Code Orientation)
- **Conflict:** SEED, PAUL, CARL, AEGIS, BASE are designed for Claude Code.
- **Resolution:** These are **methodology tools**, not runtimes. They are adapted as:
  - SEED → Hermes skill for venture incubation
  - PAUL → Hermes skill for execution loop (Plan-Apply-Unify)
  - CARL → Hermes skill for dynamic rule injection
  - AEGIS → Hermes skill for quality audit
  - BASE → GBrain schema packs + workspace monitoring
  
  Their markdown-based, JSON-based, and toml-based formats are runtime-agnostic. The "slash commands" become Hermes skill invocations or natural language triggers.

---

## 5. The Unified Architecture: HERMES GALAXY

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LAYER 5: BUSINESS OS                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Paperclip (Venture Orchestration)                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │  CEO    │ │  CTO    │ │  CMO    │ │  COO    │  (Org Chart)   │   │
│  │  │ Hermes  │ │ OhMyPi  │ │ Hermes  │ │ Hermes  │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  Goals → Tasks → Heartbeats → Budgets → Tickets          │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           ▲                                           │
│                           │ API Bridge                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  DenchClaw (CRM Satellite) — runs in isolated OpenClaw gw     │   │
│  │  localhost:3100  ←→  Paperclip adapter                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                         LAYER 4: METHODOLOGY                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Hermes Skills (from gstack, SEED, PAUL, CARL, AEGIS, GSD Core)  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ /office │ │ /plan   │ │ /review │ │ /qa     │ │ /ship   │   │   │
│  │  │ -hours  │ │ -review │ │         │ │         │ │         │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │ SEED    │ │ PAUL    │ │ CARL    │ │ AEGIS   │               │   │
│  │  │incubate │ │execute  │ │context  │ │audit    │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  GSD Core 5-Phase Loop: Discuss→Plan→Exec→Verify→Ship  │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                         LAYER 3: CANONICAL BRAIN                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  GBrain (Persistent Knowledge + Graph + Synthesis)               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │ Search  │ │ Think   │ │ Capture │ │ Sync    │ │ Dream   │    │   │
│  │  │Hybrid   │ │Synthesis│ │Ingest   │ │Git←→DB  │ │Cycle   │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  Extensions (from BASE, OpenViking, OpenBrain1):         │    │   │
│  │  │  • Workspace Graph (BASE)                                │    │   │
│  │  │  • Hierarchical Context (OpenViking L0/L1/L2)            │    │   │
│  │  │  • Capture Channels (OpenBrain1 Slack/Discord)             │    │   │
│  │  │  • Import Recipes (OpenBrain1 data importers)            │    │   │
│  │  │  • Drift Detection (BASE)                                │    │   │
│  │  │  • PSMM Session Memory (BASE)                            │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                         LAYER 2: CODING ENGINE                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Oh My Pi (The Execution Surface)                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │ LSP     │ │ DAP     │ │ Eval    │ │ Edit    │ │ Search  │    │   │
│  │  │ 53 srv  │ │ 14 adp  │ │Py/JS    │ │benchmxd │ │fastest  │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  Time-Traveling Stream Rules (TTSR)                      │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                           ▲                                           │
│                           │ Delegation via MCP / Subprocess             │
├─────────────────────────────────────────────────────────────────────────┤
│                         LAYER 1: AUTONOMOUS CORE                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Hermes (Self-Improving Agent) — The Consciousness               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │ Tools   │ │ Memory  │ │ Skills  │ │ MCP     │ │ Cron    │    │   │
│  │  │ 60+     │ │FTS5+LLM │ │Auto-gen │ │Servers  │ │Jobs    │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │ Voice   │ │ Msg     │ │ Honcho  │ │ Sub-    │               │   │
│  │  │ Mode    │ │ Gateway │ │Dialectic│ │ Agents  │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Hermes Workspace (Control Plane)                              │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │ Chat    │ │ Files   │ │ Terminal│ │ Swarm   │ │ Conductor│   │   │
│  │  │         │ │         │ │         │ │ Mode    │ │          │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                             │   │
│  │  │ Kanban  │ │ Ops     │ │ Agent   │                             │   │
│  │  │ Board   │ │ Dashboard│ │ View   │                             │   │
│  │  └─────────┘ └─────────┘ └─────────┘                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layer Interaction Flow

1. **User initiates venture:** User tells Hermes (via Telegram, Discord, or Workspace) "I want to build an AI note-taking app."
2. **Venture incubation (SEED skill):** Hermes runs the SEED skill. It asks 5 questions, brainstorms, and produces a `PLANNING.md` with type=Application (Deep rigor, 10 sections).
3. **Paperclip company creation:** Hermes (as CEO) creates a new Paperclip company. It hires itself as CEO, Oh My Pi as CTO, and sets a monthly budget ($240). The PLANNING.md becomes the company's first goal.
4. **GBrain memory:** The venture plan, company config, and all decisions are written to GBrain. Typed edges created: `user founded venture`, `venture has goal`, `goal has plan`.
5. **Methodology execution (GSD Core loop):**
   - **Discuss:** Hermes runs `/office-hours` (gstack skill) to interrogate the product idea. 6 forcing questions. Design doc produced.
   - **Plan:** Hermes runs `/plan-ceo-review` + `/plan-eng-review` (gstack skills). Architecture locked. Plan stored in GBrain.
   - **Execute:** Hermes delegates coding to Oh My Pi via MCP. Oh My Pi runs the PAUL execution loop: Plan → Apply → Unify. Oh My Pi uses LSP, DAP, and code execution as needed. PAUL's `paul.toml` and `ledger.toml` are synced to GBrain.
   - **Verify:** Hermes runs `/review` (gstack Staff Engineer skill) + AEGIS quality audit (12 personas, 14 domains). Issues found → fix plans generated.
   - **Ship:** Hermes runs `/ship` (gstack skill). Tests run, coverage audit, PR opened. GBrain synced.
6. **DenchClaw CRM:** If the venture involves customers, leads, or deals, Paperclip sends contact data to DenchClaw via API. DenchClaw returns enriched contact info and deal status.
7. **Continuous cycle:** Paperclip heartbeats wake agents on schedule. Hermes checks GBrain for new signals, runs enrichment, and continues the loop.

---

## 6. Data Flow & Integration Protocols

### 6.1 Hermes ↔ Oh My Pi (Coding Delegation)
- **Protocol:** MCP (Model Context Protocol) or subprocess spawn
- **Direction:** Hermes (orchestrator) → Oh My Pi (executor)
- **Data:** Task description, context, file paths → Code changes, test results, debug output
- **Persistence:** Oh My Pi session state is ephemeral. Results are written to GBrain by Hermes.
- **CARL integration:** Dynamic rules from CARL skill are injected into Oh My Pi context based on task type (e.g., "fix bug" → DEVELOPMENT rules).

### 6.2 Hermes ↔ GBrain (Memory)
- **Protocol:** MCP server (`gbrain serve`) or HTTP (`gbrain serve --http`)
- **Direction:** Bidirectional
- **Data:**
  - Hermes writes: decisions, meeting notes, code summaries, user preferences, agent patterns
  - Hermes reads: project context, prior decisions, entity relationships, knowledge graph queries
- **Schema:** gbrain-base-v2 taxonomy (15 types: person, company, project, media, tweet, analysis, etc.)
- **Workspace integration:** Projects register in GBrain graph on creation (from BASE concept). PSMM re-injects session insights.

### 6.3 Hermes ↔ Paperclip (Business Orchestration)
- **Protocol:** Paperclip API + heartbeat webhooks
- **Direction:** Bidirectional
- **Data:**
  - Paperclip sends: task assignments, budget updates, goal changes, approval requests
  - Hermes sends: task completions, cost reports, agent status, decisions requiring board approval
- **Governance:** Paperclip gates agent autonomy. Hermes cannot hire new agents without board approval. Budget limits auto-pause agents at 100%.

### 6.4 Paperclip ↔ DenchClaw (CRM Bridge)
- **Protocol:** HTTP REST API (DenchClaw on localhost:3100)
- **Direction:** Bidirectional
- **Data:**
  - Paperclip → DenchClaw: New contacts, leads, company records from venture activities
  - DenchClaw → Paperclip: Deal status, contact enrichment, pipeline updates
- **Isolation:** DenchClaw runs in its own OpenClaw gateway. The Paperclip adapter is the only bridge.

### 6.5 GBrain ↔ DenchClaw (Knowledge Sync)
- **Protocol:** GBrain ingestion pipeline (webhook or batch import)
- **Direction:** DenchClaw → GBrain
- **Data:** CRM contacts, meeting notes, deal history are captured into GBrain as `person`, `company`, `deal` pages with typed edges.

### 6.6 Oh My Pi ↔ GBrain (Code Knowledge)
- **Protocol:** GBrain MCP tools called from Oh My Pi sessions
- **Direction:** Oh My Pi → GBrain (read), GBrain → Oh My Pi (context)
- **Data:** Oh My Pi reads project architecture from GBrain. Code definitions, references, and patterns are indexed via `gbrain sources add` + `gbrain sync --strategy code`.

### 6.7 Hermes Workspace ↔ All Layers (Control Plane)
- **Protocol:** Web UI + WebSocket + internal APIs
- **Function:** The dashboard visualizes all layers: agent status, memory browser, task kanban, cost ledger, file explorer, terminal. Conductor dispatches missions to Hermes subagents.

---

## 7. Skill Mapping: How 17 Projects Become 1 System

### GStack Skills → Hermes Skills (23+ skills imported)

| gstack Skill | Hermes Skill Name | Purpose | When Triggered |
|--------------|---------------------|---------|----------------|
| `/office-hours` | `seed:office-hours` | Product interrogation, 6 forcing questions | New venture idea |
| `/plan-ceo-review` | `plan:ceo-review` | Strategic scope challenge | After office-hours |
| `/plan-eng-review` | `plan:eng-review` | Architecture lock, diagrams, test matrix | Before coding |
| `/plan-design-review` | `plan:design-review` | Design audit, AI slop detection | After mockups |
| `/review` | `quality:staff-review` | Staff engineer bug hunt | Pre-commit |
| `/qa` | `quality:qa-lead` | Browser automation, bug finding | Pre-ship |
| `/ship` | `deploy:ship` | Test, coverage, PR, push | After review/QA |
| `/cso` | `security:cso` | OWASP + STRIDE threat model | Before shipping |
| `/browse` | `tools:browser` | Web browsing, screenshots | Research, QA |
| `/design-shotgun` | `design:shotgun` | 4-6 mockup variants | Design phase |
| `/design-html` | `design:html-engineer` | Production HTML from mockup | After design approval |
| `/investigate` | `debug:investigator` | Root cause analysis | Bug reports |
| `/document-release` | `docs:release-writer` | Update all docs post-ship | After /ship |
| `/document-generate` | `docs:generate` | Generate missing docs from scratch | Doc gaps |
| `/codex` | `quality:second-opinion` | Independent review from OpenAI Codex | Cross-model validation |
| `/autoplan` | `plan:autopilot` | CEO → design → eng review auto-chain | Quick projects |
| `/learn` | `memory:learn` | Manage learned patterns across sessions | Continuous |
| `/make-pdf` | `docs:pdf-publisher` | Markdown → publication PDF | Reporting |
| `/diagram` | `docs:diagram-maker` | English → mermaid/excalidraw | Documentation |
| `/retro` | `process:retro` | Weekly engineering retrospective | Weekly |
| `/pair-agent` | `tools:cross-agent` | Share browser with other agents | Multi-agent QA |
| `/canary` | `deploy:canary` | Post-deploy monitoring | After deploy |
| `/benchmark` | `quality:performance` | Core web vitals, load times | Performance work |
| `/land-and-deploy` | `deploy:full-pipeline` | Merge → CI → deploy → verify | Final ship |
| `/freeze` | `safety:freeze` | Lock edits to one directory | Debugging |
| `/guard` | `safety:guard` | Careful + freeze combined | Production work |
| `/sync-gbrain` | `memory:sync-brain` | Re-index code into GBrain | After significant changes |

### Kahler Suite → Hermes Skills / GBrain Extensions

| Kahler Project | Adapted As | Integration Point |
|----------------|------------|-------------------|
| SEED | `seed:incubate` skill | Hermes skill library. Types (Application, Workflow, etc.) become Paperclip project templates. |
| PAUL | `paul:execute` skill | Hermes skill. Oh My Pi runs PAUL loop inside its sessions. `paul.toml` synced to GBrain. |
| CARL | `context:router` skill | Hermes skill. Dynamic rule injection based on keywords. Replaces static `SOUL.md`. |
| AEGIS | `quality:audit` skill | Hermes skill. Pre-ship 12-persona audit. Results feed PAUL fix plans. |
| BASE | GBrain workspace pack + health monitor | `gbrain schema use workspace`. Drift detection as GBrain cron job. PSMM as context feature. |

### OpenViking → GBrain Feature

| OpenViking Feature | GBrain Adaptation |
|--------------------|-------------------|
| Virtual file system (`viking://`) | GBrain already uses git-backed markdown repo. No new URI needed. |
| L0 Abstract (~100 tokens) | `gbrain retrieve --depth abstract` — auto-generated `.abstract.md` |
| L1 Overview (~2k tokens) | `gbrain retrieve --depth overview` — auto-generated `.overview.md` |
| L2 Detail (full) | `gbrain retrieve --depth detail` — full content |
| Directory recursive retrieval | `gbrain search --recursive` with intent analysis |
| Visualized retrieval traces | `gbrain search --explain` (already exists) |
| Session memory self-iteration | GBrain dream cycle (already exists) |

### OpenBrain1 → GBrain Ingestion Pack

| OB1 Feature | GBrain Integration |
|-------------|-------------------|
| Slack/Discord capture | GBrain webhook handlers (`gbrain capture --webhook`) |
| Data import recipes | GBrain import recipes (`gbrain import --recipe <source>`) |
| Thoughts table with embeddings | GBrain `pages` table (already has this) |
| Agent memory schema | GBrain schema pack for agent memory |
| Dashboards (SvelteKit/Next.js) | Excluded — Hermes Workspace + Paperclip provide UI |
| MCP server for remote agents | GBrain already has MCP server |

### GSD Core → Project Lifecycle Template

| GSD Core Phase | Galaxy Implementation |
|----------------|----------------------|
| 1. Discuss | `seed:office-hours` + `plan:ceo-review` (gstack skills) |
| 2. Plan | `plan:eng-review` + `paul:execute` plan phase |
| 3. Execute | Oh My Pi + `paul:execute` apply phase |
| 4. Verify | `quality:staff-review` + `quality:audit` (AEGIS) + `quality:qa-lead` |
| 5. Ship | `deploy:ship` + `docs:release-writer` |
| Artifacts in `.planning/` | Stored in GBrain under `projects/{name}/planning/` |

---

## 8. Implementation Roadmap

### Phase 0: Foundation (Weeks 1-2)
1. **Deploy Hermes** on a persistent VPS or serverless (Daytona/Modal)
2. **Deploy Hermes Workspace** and connect to Hermes instance
3. **Install GBrain** (`gbrain init --pglite` for local, or Supabase for shared)
4. **Connect GBrain to Hermes** via MCP (`claude mcp add gbrain -- gbrain serve` or equivalent for Hermes)
5. **Install Oh My Pi** (`curl -fsSL https://omp.sh/install | sh`)
6. **Verify delegation:** Hermes spawns Oh My Pi, Oh My Pi writes code, Hermes captures output to GBrain

### Phase 1: Business Layer (Weeks 3-4)
1. **Deploy Paperclip** (`npx paperclipai onboard --yes`)
2. **Connect Paperclip to Hermes** via adapter/heartbeat API
3. **Set up first company** in Paperclip: Hermes = CEO, Oh My Pi = CTO, budget = $240/mo
4. **Deploy DenchClaw** (`npx denchclaw bootstrap`) — runs as satellite
5. **Build Paperclip ↔ DenchClaw bridge** (REST API adapter)
6. **Test venture creation:** User → Hermes → Paperclip company → GBrain plan → Oh My Pi coding

### Phase 2: Methodology Layer (Weeks 5-8)
1. **Port gstack skills** to Hermes skill format:
   - Start with `/office-hours`, `/plan-ceo-review`, `/review`, `/qa`, `/ship`
   - Use gstack's `AGENTS.md` / `CLAUDE.md` format, adapted for Hermes `SOUL.md`
2. **Port SEED** as `seed:incubate` skill — 5 project types, type-specific rigor
3. **Port PAUL** as `paul:execute` skill — Plan-Apply-Unify loop, A.D.D. format, `paul.toml` manifest
4. **Port CARL** as `context:router` skill — Dynamic rule injection, domain matching, context brackets
5. **Port AEGIS** as `quality:audit` skill — 12 personas, 14 domains, 3-layer output
6. **Test full lifecycle:** SEED → gstack plan → Oh My Pi + PAUL → AEGIS review → ship

### Phase 3: Memory Enrichment (Weeks 9-10)
1. **GBrain schema packs:**
   - `workspace` pack (from BASE): projects, entities, state, PSMM
   - `agent` pack (from OB1): agent memory sidecars, provenance, recall traces
   - `venture` pack (from Paperclip): companies, org charts, budgets, goals
2. **GBrain ingestion extensions:**
   - Slack/Discord capture webhooks (from OB1)
   - Data import recipes: ChatGPT, Obsidian, X, Gmail (from OB1)
3. **GBrain retrieval modes:**
   - `--depth abstract|overview|detail` (from OpenViking)
   - `--recursive` directory retrieval (from OpenViking)
4. **Workspace health monitoring:** Drift detection, PAUL auto-discovery, CARL hygiene (from BASE)

### Phase 4: Advanced Features (Weeks 11-12)
1. **gstack Conductor integration** with Hermes Swarm Mode — parallel sprints across multiple ventures
2. **Cross-agent browser pairing** (`pair-agent` skill) — Hermes + OpenClaw + Codex share browser
3. **iOS QA pipeline** (from gstack) — Real device testing for mobile ventures
4. **Voice mode workflows** — Initiate ventures, review plans, approve budgets via voice
5. **Continuous checkpoint mode** — Auto-commit WIP, `/context-restore` for session recovery
6. **Skill optimization loop** — `gbrain skillopt` for improving Hermes skills based on performance

### Phase 5: Scale & Harden (Weeks 13-16)
1. **Security hardening:**
   - AEGIS security audit on all components
   - gstack `/cso` (OWASP + STRIDE) on web-facing services
   - Prompt injection defense (from gstack browser security)
2. **Cost optimization:**
   - Dynamic model routing (light models for simple tasks, heavy for complex)
   - Paperclip budget enforcement across all agents
   - GBrain token optimization (L0/L1 retrieval for simple queries)
3. **Multi-company support:** Paperclip runs dozens of ventures with data isolation
4. **Team scaling:** Multiple human users, each with their own GBrain slice (from gbrain company brain tutorial)
5. **Documentation:** `docs/ARCHITECTURE.md`, `docs/OPERATIONS.md`, `docs/ONBOARDING.md`

---

## 9. Technology Stack Summary

| Layer | Primary Component | Language | Runtime | Database | Key Protocols |
|-------|-------------------|----------|---------|----------|---------------|
| 1. Core | Hermes | Python | VPS/Docker/Daytona/Modal | SQLite (FTS5) | MCP, HTTP, WebSocket |
| 1. UI | Hermes Workspace | TypeScript/React | Node.js | Embedded | HTTP, WebSocket, SSE |
| 2. Coding | Oh My Pi | Rust | Native binary | In-memory | LSP, DAP, stdio |
| 3. Brain | GBrain | TypeScript/Bun | Node.js/Bun | PGLite/Postgres/pgvector | MCP, HTTP, git |
| 4. Methodology | Hermes Skills | Markdown | Hermes runtime | GBrain | Skill invocation |
| 5. Business | Paperclip | Node.js | Node.js | Embedded Postgres | HTTP, webhooks |
| 5. CRM | DenchClaw | Node.js | Node.js (OpenClaw gw) | OpenClaw | HTTP (localhost:3100) |

---

## 10. Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Oh My Pi is Rust-based, Hermes is Python-based | High | Medium | Delegation via MCP/subprocess, not direct integration. They communicate via text/JSON. |
| gstack skills are Claude Code optimized | High | Medium | gstack already supports `--host hermes`. Skills are markdown-based and agent-agnostic. Adaptation is configuration, not rewrite. |
| DenchClaw OpenClaw dependency creates runtime isolation | Medium | Low | DenchClaw runs as satellite. API bridge is sufficient. If OpenClaw is problematic, recreate DenchClaw's CRM as Paperclip extension. |
| Too many skills overwhelm Hermes context | Medium | High | CARL dynamic rule injection ensures only relevant skills load. BASE/PSMM prevents re-injection. |
| GBrain PGLite can't scale to 100K+ pages | Medium | High | Migration path to Supabase/Postgres is built-in. `gbrain init` supports both. |
| Paperclip + Hermes Workspace both have UIs | Low | Medium | They serve different purposes: Paperclip = business, Workspace = dev. Users can use both. Future: unify into single dashboard. |
| Kahler suite (SEED/PAUL/CARL/AEGIS/BASE) deeply tied to Claude Code | Medium | Medium | They are methodology tools, not runtimes. Their markdown/toml/JSON formats are portable. Slash commands become skill names. |
| Multiple memory systems (Hermes memory + GBrain) conflict | Medium | High | Canonical rule: GBrain is the source of truth. Hermes memory is short-term cache. On session start, Hermes loads from GBrain. On session end, Hermes writes to GBrain. |

---

## 11. Appendix: License Compatibility

| Project | License | Notes |
|---------|---------|-------|
| Hermes | Open source (implied) | Nous Research |
| Hermes Workspace | Open source | MIT (implied from GitHub) |
| Oh My Pi | MIT | Open source |
| GBrain | MIT | Open source |
| GStack | MIT | Open source |
| Paperclip | MIT | Open source, self-hosted |
| DenchClaw | MIT | Open source |
| Agor | **BSL 1.1** | **Excluded** — not fully open |
| OpenViking | Open source | Assumed open |
| OpenBrain1 | FSL-1.1-MIT | Functional Source License, eventually MIT |
| SEED | MIT | Open source |
| PAUL | MIT | Open source |
| CARL | MIT | Open source |
| AEGIS | MIT | Open source |
| BASE | MIT | Open source |
| GSD Pi | Unknown | OpenGSD |
| GSD Core | Unknown | OpenGSD |

---

## 12. Appendix: Quick Reference — What Was Included, Adapted, or Excluded

### INCLUDED (Run as-is)
1. **Hermes** — Base autonomous agent
2. **Hermes Workspace** — Web control plane
3. **Oh My Pi** — Coding execution surface
4. **GBrain** — Persistent knowledge + graph
5. **Paperclip** — Venture orchestration

### ADAPTED (Ported as skills, features, or extensions)
6. **GStack** — Skills imported into Hermes
7. **SEED** — Venture incubator skill
8. **PAUL** — Execution loop skill
9. **CARL** — Dynamic rule injection skill
10. **AEGIS** — Quality audit skill
11. **BASE** — Workspace schema pack + health monitor for GBrain
12. **GSD Core** — 5-phase project lifecycle template
13. **OpenViking** — Hierarchical retrieval modes for GBrain
14. **OpenBrain1** — Capture channels + import recipes for GBrain
15. **DenchClaw** — CRM satellite (bridge via API)

### EXCLUDED (Redundant or incompatible)
16. **Agor.live** — BSL license, spatial canvas redundant with Hermes Workspace + Paperclip
17. **GSD Pi** — Entirely superseded by Oh My Pi + Hermes + PAUL

---

*Document generated by the Orchestrator. Architecture: HERMES GALAXY.*
