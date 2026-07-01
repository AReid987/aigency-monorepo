# Other — apps/docs

# Documentation App (`apps/docs`)

## Overview
`apps/docs` is the **documentation surface** for the Aigency monorepo. It is a content-only app today (raw markdown) and will become a deployed static site tomorrow.

## Contents

| Section | Path | Purpose |
|---------|------|---------|
| Getting Started | `01-getting-started/` | Overview, setup, and quick-reference guides. |
| Deep Dive | `02-deep-dive/` | Architecture, data layer, frontend, apps, and packages deep-wiki. |
| Agents | `03-agents/` | Agent index and per-agent context files. |
| Onboarding | `onboarding/` | Role-specific onboarding: contributor, staff engineer, executive, PM. |
| Agent Instructions | `AGENTS.md` | AI agent instructions for working in this codebase. |
| LLM Summaries | `llms.txt`, `llms-full.txt` | LLM-friendly project summaries. |

## Why `apps/docs` Instead of Root `wiki/`

Following Turborepo conventions, deployable documentation belongs in `apps/`:

* It can have its own build pipeline in `turbo.json`.
* It can import `@aigency/design-tokens` for consistent styling.
* It is the future home of `docs.aigency.com`.

## Roadmap

1. **Phase 1 (current)** — All docs exist as markdown; agents ingest via `AGENTS.md` and `llms.txt`.
2. **Phase 2** — Add VitePress or Next.js + MDX build step:
   ```bash
   pnpm --filter @aigency/docs dev
   pnpm --filter @aigency/docs build
   ```
3. **Phase 3** — Deploy to `docs.aigency.com`.

## Integration Points

* Consumed by `@aigency/nexus` and other IDE agents as context.
* Onboarding files are the first stop for new humans joining the project.
* Deep-dive package/app docs mirror the monorepo structure and should be kept in sync.
