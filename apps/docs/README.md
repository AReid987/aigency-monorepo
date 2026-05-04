# @aigency/docs

> Aigency Documentation — the deep-wiki, onboarding guides, and agent context files.

---

## What This App Is

`apps/docs` is the **documentation surface** for the entire Aigency monorepo. It contains:

- **Deep-wiki** — architecture, apps, packages, agents, data layer
- **Onboarding guides** — tailored for Contributors, Staff Engineers, Executives, and PMs
- **AGENTS.md** — AI agent instructions for working in this codebase
- **llms.txt / llms-full.txt** — LLM-friendly project summaries

Today: raw markdown files.
Tomorrow: a deployed static site at `docs.aigency.com`.

---

## Why `apps/docs` (Not Root-Level `wiki/`)

In Turborepo conventions, documentation that is meant to become a **deployable site** belongs in `apps/`, not at the root.

| Location | Use Case | Deployable? |
|----------|----------|-------------|
| `apps/docs` | Docs as a site (VitePress, Next.js + MDX) | ✅ Yes |
| `docs/` at root | Simple markdown for GitHub browsing | ❌ No |
| `apps/telos/wiki/` | TELOS-specific identity docs | ❌ Too narrow |

We chose `apps/docs` because:
1. The wiki will eventually be a rendered static site
2. It can have its own build pipeline in `turbo.json`
3. It follows the same pattern as other apps in the monorepo
4. It can import `@aigency/design-tokens` for consistent styling

---

## Directory Structure

```
apps/docs/
├── README.md              ← this file
├── package.json           ← @aigency/docs
├── 01-getting-started/
│   ├── overview.md
│   ├── setup.md
│   └── quick-reference.md
├── 02-deep-dive/
│   ├── architecture.md
│   ├── agent-system.md
│   ├── data-layer.md
│   ├── frontend.md
│   ├── apps/
│   │   ├── router.md
│   │   ├── membrane.md
│   │   ├── oracle.md
│   │   ├── librarian.md
│   │   ├── contracts.md
│   │   └── telos.md
│   └── packages/
│       ├── agent-core.md
│       ├── surreal.md
│       ├── honcho.md
│       ├── mem-brain.md
│       ├── design-tokens.md
│       └── vault-tools.md
├── 03-agents/
│   ├── index.md
│   ├── zenith.md
│   ├── cipher.md
│   ├── vector.md
│   ├── iris.md
│   ├── echo.md
│   ├── atlas.md
│   ├── compass.md
│   └── herald.md
├── onboarding/
│   ├── contributor.md
│   ├── staff-engineer.md
│   ├── executive.md
│   └── product-manager.md
├── AGENTS.md
├── llms.txt
└── llms-full.txt
```

---

## Roadmap

### Phase 1: Content (Current)
All documentation exists as markdown. Humans read it directly. AI agents ingest it via `AGENTS.md` and `llms.txt`.

### Phase 2: Static Site (Q4 2025)
Add a VitePress or Next.js + MDX build step:

```bash
pnpm --filter @aigency/docs dev     # local preview
pnpm --filter @aigency/docs build   # static site output to dist/
```

**Tech choices:**
- **VitePress** — fast, Markdown-native, built-in search, dark mode
- **MDX** — if we need React components embedded in docs
- **Design tokens** — import from `@aigency/design-tokens` for colors/typography

### Phase 3: Deploy (Q4 2025)
GitHub Actions workflow:

```yaml
# .github/workflows/docs-deploy.yml
on:
  push:
    paths: ['apps/docs/**']

jobs:
  build:
    - run: pnpm --filter @aigency/docs build
    - deploy: Vercel → docs.aigency.com
```

### Phase 4: TELOS Integration (Q1 2026)
The docs site becomes the **public face** of Aigency's TELOS framework:
- Each agent's TELOS page is auto-generated from `apps/telos/agents/*.md`
- Corporate TELOS gets a dedicated page
- Activity Log is rendered as a live feed
- Diff viewer shows TELOS evolution over time

---

## Ownership

| Callsign | Responsibility |
|----------|---------------|
| **ECHO** | Content strategy, keeping docs current, public communication |
| **CIPHER** | Build system, deployment pipeline, docs site infrastructure |
| **IRIS** | Visual design, design token integration, dark mode styling |
| **THE ARCHITECT** | Architectural accuracy, technical review, AGENTS.md maintenance |

---

## Contributing to Docs

Docs are code. Treat them like it:

1. Edit the markdown files directly
2. Follow the existing structure and naming conventions
3. Include Mermaid diagrams for architecture pages
4. Cite source files with `(file_path:line)` format
5. Run `git add apps/docs/` and commit with `docs:` prefix

---

*The map is not the territory — but without the map, no one can find the territory.*
