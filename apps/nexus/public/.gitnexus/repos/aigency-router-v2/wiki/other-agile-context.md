# Agile Context

## Overview
The `docs/agile-context/` directory contains the structured product documentation for the Aigency OS project. It defines the product brief, requirements, architecture, UI/UX direction, and a milestone-driven backlog organized by epics and stories. This context drives implementation priorities across the router, workers, TUI, and dashboard.

## Document Structure

| Document | Purpose |
|----------|---------|
| `00_AIGENCY_OS_PROJECT_BRIEF.md` | High-level project brief, goals, and scope. |
| `01_AIGENCY_OS_PRD.md` | Product Requirements Document with features, non-goals, and acceptance criteria. |
| `02_AIGENCY_OS_ARCHITECTURE.md` | System architecture, component boundaries, and data flow. |
| `03_AIGENCY_OS_ARCHITECTURE_C4.md` | C4 model diagrams for context, containers, components, and code. |
| `04_AIGENCY_OS_UI-UX.md` | User experience guidelines, personas, and interface principles. |
| `05_AIGENCY_OS_BACKLOG/00_AIGENCY_OS_BACKLOG.md` | Master backlog and roadmap overview. |
| `05_AIGENCY_OS_BACKLOG/01_EPIC-1/` | Epic 1 stories (stories 1.1–1.6). |
| `05_AIGENCY_OS_BACKLOG/02_EPIC-2/` | Epic 2 stories (stories 2.1–2.4). |
| `05_AIGENCY_OS_BACKLOG/03_EPIC-3/` | Epic 3 stories (stories 3.1–3.4). |
| `05_AIGENCY_OS_BACKLOG/04_EPIC-4/` | Epic 4 stories (stories 4.1–4.5). |

## Purpose in the Repository
- **Source of truth** for product intent and architectural decisions.
- **Planning input** for sprint and story generation workflows.
- **Context for AI agents** when implementing features or refactoring code.
- **Traceability** from high-level epics down to individual source files and tests.

## Usage
- Refer to the PRD and architecture docs before adding new capabilities.
- Use story files to identify acceptance criteria and integration points.
- Keep documents in sync with code changes so the backlog remains actionable.

## Integration Points
- **Workers**: implementation stories for Gateway, Vault, Brain, Translator, Selector, Sugar DB, and Engram workers.
- **TUI & Dashboard**: UX and telemetry stories.
- **Verification scripts**: `scripts/verify-s*.sh` map to milestone acceptance criteria derived from these documents.
