# @aigency/telos

> **τέλος** (telos): purpose, end, goal, ultimate aim.
>
> TELOS is Aigency's Deep Context Framework — a structured system for capturing
> the identity, mission, goals, and operational state of every entity in the
> ecosystem: the company, the founder, and every agent.

---

## What This App Is

`apps/telos` is both a **content system** and a **future runtime** for Aigency's identity layer.

**Today:** A directory of markdown-based Telos Context Files (TCFs) — interview-captured documents that define who we are and what we pursue.

**Tomorrow:** A CLI-driven interview workflow, a browsable web UI, and an auto-deployment pipeline that publishes TELOS to a public webpage.

---

## Why TELOS Is an App (Not a Package)

TELOS sits in `apps/` because it is **deployable** and **self-contained**:

| Concern | App? | Package? | TELOS |
|--------|------|----------|-------|
| Has a web UI | ✅ | ❌ | ✅ (planned) |
| Deployed to Vercel | ✅ | ❌ | ✅ (planned) |
| Has a CLI entrypoint | ✅ | ❌ | ✅ (planned) |
| Consumed by other apps | ❌ | ✅ | ❌ |
| Shared library code | ❌ | ✅ | ❌ |

Other apps (Router, Membrane, Oracle) may **read** TELOS files, but they don't import TELOS as a dependency. TELOS is a **source of truth**, not a shared module.

---

## Directory Structure

```
apps/telos/
├── README.md                 ← this file
├── package.json              ← @aigency/telos, CLI entrypoint
├── TELOS.md                  ← framework spec: what TELOS is, how to use it
├── INTERVIEW.md              ← 10-phase interview protocol for capturing TELOS
├── src/                      ← runtime code (future: CLI, server, parser)
│   (not yet created)
├── agents/
│   ├── atlas.md              ← ATLAS (Jordan Mercer) — skeleton draft
│   ├── cipher.md             ← CIPHER (Roman Voss) — skeleton draft
│   ├── compass.md            ← COMPASS (Imara Adeyemi) — skeleton draft
│   ├── echo.md               ← ECHO (Selene Navarro) — skeleton draft
│   ├── herald.md             ← HERALD (Dax Okafor) — skeleton draft
│   ├── iris.md               ← IRIS (Vivienne Calloway) — skeleton draft
│   ├── vector.md             ← VECTOR (Dominique Osei) — skeleton draft
│   └── zenith.md             ← ZENITH (Newton Hughes) — skeleton draft
├── drafts/
│   ├── aigency-corporate.DRAFT.md    ← to be replaced by THE ARCHITECT
│   └── architect-personal.DRAFT.md   ← to be replaced by THE ARCHITECT
└── templates/
    ├── agent-persona.md      ← persona template (bio, voice, relationships)
    └── TELOS-v1-blank.md     ← blank TCF template for interview output
```

---

## Current State (v0.1 — Content Only)

### What Exists

- **Framework spec** (`TELOS.md`) — structure, grammar, and usage guide
- **Interview protocol** (`INTERVIEW.md`) — 10-phase capture process
- **Persona template** (`templates/agent-persona.md`) — pre-interview agent biography
- **Blank template** (`templates/TELOS-v1-blank.md`) — starting point for new TCFs
- **8 agent skeletons** (`agents/*.md`) — inferred drafts awaiting interview capture
- **2 draft TELOS** (`drafts/*.DRAFT.md`) — placeholder for corporate and personal

### What Is Missing

- No runtime code (`src/` does not exist yet)
- No CLI tool
- No web UI
- No deployment pipeline
- No parser/validator for TELOS markdown
- No integration with agent substrates

---

## Roadmap

### Phase 1: Content Foundation (Current)

**Goal:** All TELOS files are interview-captured and version-controlled.

- [x] Deploy framework spec, interview protocol, and templates
- [x] Create skeleton drafts for all 8 agents
- [ ] **THE ARCHITECT writes personal TELOS** (using interview protocol)
- [ ] **THE ARCHITECT writes corporate TELOS** (using interview protocol)
- [ ] Interview all 8 agents in character to replace skeleton drafts
- [ ] Fill out `agent-persona.md` for each agent before their interview
- [ ] Establish quarterly TELOS review cadence

**Deliverable:** A complete, truth-grounded TELOS corpus in git.

---

### Phase 2: CLI Workflow (Q3 2025)

**Goal:** Run the TELOS interview as a structured CLI tool.

```bash
# Start an interview session with an agent
npx telos interview --agent zenith

# The CLI loads the agent's persona, runs the 10-phase protocol,
# records answers, and synthesizes a draft TELOS.

# Validate an existing TELOS file
npx telos validate agents/cipher.md

# Check for stale TELOS files (no activity log update in >30 days)
npx telos status

# Render a TELOS to HTML for preview
npx telos render agents/zenith.md --output zenith.html
```

**Components:**
- `src/cli.ts` — CLI entrypoint using `commander` or `cac`
- `src/interview.ts` — interview engine that loads persona, asks questions, captures answers
- `src/validator.ts` — schema validation for TCF structure (mission exists, goals are ranked, KPIs have numbers, etc.)
- `src/renderer.ts` — markdown → HTML converter with Aigency design tokens
- `src/parser.ts` — TCF markdown parser that extracts structured data

**Deliverable:** `npx telos` works locally. Interviews are recorded and synthesizable.

---

### Phase 3: Web UI (Q4 2025)

**Goal:** Browse, search, and visualize all TELOS files in a web interface.

```
https://telos.aigency.com/
├── /                     ← landing: what is TELOS?
├── /corporate            ← Aigency corporate TELOS
├── /architect            ← THE ARCHITECT personal TELOS
├── /agents               ← grid of all agent TELOS cards
│   ├── /zenith
│   ├── /cipher
│   └── ...
├── /compare              ← side-by-side agent comparison
└── /roadmap              ← this roadmap
```

**Features:**
- **Agent Cards** — visual cards with color, callsign, role, tagline, and mission
- **Goal Hierarchy Viz** — treemap or weighted list showing G1 > G2 > G3...
- **Risk Heatmap** — likelihood × impact grid
- **Project Timeline** — Gantt-style view of active projects across all agents
- **Activity Log Stream** — chronological feed of all TELOS updates
- **Search** — full-text search across all TCFs
- **Diff Viewer** — see what changed between TELOS versions (git history)

**Tech:**
- React + TypeScript (same stack as Membrane)
- Static site generation (SSG) at build time
- Markdown parsing via `marked`
- Design tokens from `@aigency/design-tokens`
- Deployed to Vercel

**Deliverable:** `telos.aigency.com` is live and browsable.

---

### Phase 4: Auto-Deployment Pipeline (Q4 2025)

**Goal:** Every TELOS update triggers an automatic redeploy of the TELOS webpage.

```
GitHub Actions Workflow: .github/workflows/telos-deploy.yml

on:
  push:
    paths:
      - 'apps/telos/**'

jobs:
  validate:
    - run: npx telos validate agents/*.md drafts/*.md

  build:
    - run: npx telos build-site
    - output: static HTML to apps/telos/dist/

  deploy:
    - target: Vercel (production)
    - url: https://telos.aigency.com
```

**Features:**
- **Pre-deploy validation** — reject commits with malformed TELOS files
- **Version tagging** — each deploy is tagged with git commit hash
- **Preview deploys** — PRs get preview URLs for TELOS changes
- **RSS/Atom feed** — Activity Log updates as a feed
- **JSON API** — `telos.aigency.com/api/agents.json` returns structured TCF data

**Deliverable:** Push to `apps/telos/` → auto-deploy in <2 minutes.

---

### Phase 5: Agent Substrate Integration (Q1 2026)

**Goal:** Agents read and update their own TELOS files autonomously.

```yaml
# agents/zenith/agent.yaml (future)
callsign: ZENITH
telos: "../../apps/telos/agents/zenith.md"
telos_auto_update: true
```

**Agent capabilities:**
- **Self-reporting** — After completing a project, the agent appends to its Activity Log
- **KPI updating** — Agents query their metrics and update KPI values in their TCF
- **Goal re-evaluation** — Quarterly, agents review their goals and suggest G1-G7 changes
- **Cross-reference** — Agents read other agents' TELOS files to understand capabilities and priorities
- **Narrative auto-generation** — Agents summarize their recent work into Narrative updates

**Safety guardrails:**
- All agent TELOS edits are PRs, not direct commits
- THE ARCHITECT approves agent TELOS changes
- Diff notifications via HERALD when any TCF changes
- Rollback capability via git

**Deliverable:** Agents maintain their own identity documents with human oversight.

---

### Phase 6: TELOS as Protocol (Q2 2026)

**Goal:** TELOS becomes an open standard for agent identity that other projects can adopt.

- **Schema specification** — JSON Schema for TCF validation
- **NPM package** — `telos-framework` for non-Aigency projects
- **Community templates** — TELOS templates for startups, individuals, open-source projects
- **Interoperability** — Import/export between TELOS and other agent identity formats

**Deliverable:** `npx telos init` works in any project, not just Aigency.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **App vs Package** | App (`apps/telos/`) | Deployable CLI + web UI; not consumed as a library |
| **Content format** | Markdown | Human-editable, git-friendly, portable |
| **Interview model** | Human-led, agent-assisted | Personal/corporate TELOS must come from THE ARCHITECT; agent TELOS from in-character interviews |
| **Build target** | Static site (SSG) | TELOS content changes slowly; no need for SSR |
| **Deployment** | Vercel + GitHub Actions | Same infrastructure pattern as other Aigency apps |
| **Styling** | Design tokens from `@aigency/design-tokens` | Consistent with Membrane and other surfaces |

---

## Usage (Today)

```bash
# Read a TELOS file
cat apps/telos/agents/zenith.md

# Start learning the framework
cat apps/telos/TELOS.md

# Run an interview (manual, for now)
cat apps/telos/INTERVIEW.md
# → follow the 10-phase protocol in conversation

# Use the blank template
cp apps/telos/templates/TELOS-v1-blank.md apps/telos/drafts/my-entity.md
```

---

## Usage (Future)

```bash
# Install the CLI
pnpm add -g @aigency/telos

# Run an interview
telos interview --agent cipher --output apps/telos/agents/cipher.md

# Validate all TELOS files
telos validate apps/telos/**/*.md

# Build the web UI
telos build-site --output dist/

# Preview locally
telos dev
```

---

## Ownership

| Callsign | Responsibility |
|----------|---------------|
| **THE ARCHITECT** | Personal TELOS, corporate TELOS, framework vision |
| **ZENITH** | Squad alignment on TELOS priorities, review cadence |
| **CIPHER** | CLI tooling, web UI implementation, deployment pipeline |
| **ECHO** | Public TELOS page content, thought leadership on the framework |
| **IRIS** | Web UI design, TELOS visual identity, agent card design |

---

## Related

- **Original TELOS:** https://github.com/danielmiessler/Telos
- **Live example:** https://daemon.danielmiessler.com/telos
- **Aigency design tokens:** `packages/design-tokens/`
- **Agent registry:** `packages/agent-core/src/index.ts`

---

*A TELOS is never done. It evolves as the entity evolves. This README is a TELOS for the TELOS app — and it too will change.*
