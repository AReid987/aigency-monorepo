# Aigency Monorepo

> **Aigency** — Autonomous agent infrastructure with persistent memory, knowledge graphs, and crystallized wisdom.

[![Coverage](https://app.codecov.io/github/AReid987/aigency-monorepo/config/badge)](https://app.codecov.io/github/AReid987/aigency-monorepo)
[![CI](https://github.com/AReid987/aigency-monorepo/actions/workflows/coverage.yml/badge.svg)](https://github.com/AReid987/aigency-monorepo/actions/workflows/coverage.yml)
[![Lint](https://github.com/AReid987/aigency-monorepo/actions/workflows/megalinter.yml/badge.svg)](https://github.com/AReid987/aigency-monorepo/actions/workflows/megalinter.yml)
[![CodeRabbit](https://img.shields.io/badge/CodeRabbit-AI%20Review-ff69b4)](https://coderabbit.ai)

---

## Architecture

```mermaid
flowchart TB
    subgraph Agents["Agents"]
        ATLAS["ATLAS<br/>Cartographer"]
        CIPHER["CIPHER<br/>Cryptographer"]
        COMPASS["COMPASS<br/>Navigator"]
        ECHO["ECHO<br/>Resonator"]
        HERALD["HERALD<br/>Herald"]
        IRIS["IRIS<br/>Seer"]
        VECTOR["VECTOR<br/>Pathfinder"]
        ZENITH["ZENITH<br/>Apex"]
    end

    subgraph Apps["Applications"]
        ROUTER["Router<br/>LLM Proxy"]
        ORACLE["ORACLE<br/>Memory Agent"]
        MEMBRANE["Membrane<br/>3D Viz"]
        LIBRARIAN["Librarian<br/>Curator"]
        CONTRACTS["Contracts<br/>Solidity"]
        TELOS["TELOS<br/>Identity"]
    end

    subgraph Packages["Packages"]
        MEMBRAIN["mem-brain<br/>Unified Memory"]
        SURREAL["surreal<br/>DB Client"]
        HONCHO["honcho<br/>Peer Identity"]
        AGENTCORE["agent-core<br/>Shared Types"]
        VAULT["vault-tools<br/>Utilities"]
        TOKENS["design-tokens<br/>W3C DTCG"]
    end

    Agents --> ROUTER
    ROUTER --> MEMBRAIN
    ORACLE --> MEMBRAIN
    MEMBRAIN --> SURREAL
    MEMBRAIN --> HONCHO
    MEMBRAIN --> AGENTCORE
    LIBRARIAN --> MEMBRAIN
    TELOS --> MEMBRAIN
    Apps --> AGENTCORE
    Packages --> AGENTCORE
```

### Memory Stack

```mermaid
flowchart LR
    subgraph Wiki["LLM-Wiki v2"]
        WP[wiki_page]
        WC[wiki_chunk]
        WL[wiki_link]
        WTE[wiki_timeline_entry]
    end

    subgraph Oracle["ORACLE Runtime"]
        AG[agent]
        DR[directive]
        PA[pattern]
        TL[timeline]
    end

    subgraph Sidecar["OB1 Governance"]
        AM[agent_memory]
        AMR[agent_memory_relation]
    end

    subgraph Queue["Job Queue"]
        J[job]
    end

    WP --> WL
    WC --> WP
    AG --> DR
    AG --> TL
    PA --> AG
    AM --> AMR
    AM --> AG
    J --> ORACLE
    J --> Wiki
```

---

## Packages

| Package | Description | Coverage | Tests |
|---------|-------------|----------|-------|
| [`agent-core`](./packages/agent-core) | Shared agent types, interfaces, constants | ![agent-core](https://app.codecov.io/github/AReid987/aigency-monorepo/config/badge?flag=agent-core) | ✅ |
| [`mem-brain`](./packages/mem-brain) | Unified memory layer (SurrealDB + Honcho) | ![mem-brain](https://app.codecov.io/github/AReid987/aigency-monorepo/config/badge?flag=mem-brain) | ✅ |
| [`surreal`](./packages/surreal) | SurrealDB 3.0 client, schema, LIVE queries | ![surreal](https://app.codecov.io/github/AReid987/aigency-monorepo/config/badge?flag=surreal) | ✅ |
| [`honcho`](./packages/honcho) | Peer identity, workspaces, sessions | ![honcho](https://app.codecov.io/github/AReid987/aigency-monorepo/config/badge?flag=honcho) | ✅ |
| [`vault-tools`](./packages/vault-tools) | Compilation, lint, flush utilities | ![vault-tools](https://app.codecov.io/github/AReid987/aigency-monorepo/config/badge?flag=vault-tools) | ✅ |
| [`design-tokens`](./packages/design-tokens) | W3C DTCG design tokens | N/A | — |
| [`tsconfig`](./packages/tsconfig) | Shared TypeScript configurations | N/A | — |

## Applications

| App | Description | Status |
|-----|-------------|--------|
| [`router`](./apps/router) | LLM Router — OpenAI-compatible proxy with quota-aware routing | 🟢 |
| [`oracle`](./apps/oracle) | ORACLE — Persistent memory agent service | 🟢 |
| [`librarian`](./apps/librarian) | LIBRARIAN — Knowledge graph curator | 🟢 |
| [`membrane`](./apps/membrane) | Membrane — 3D knowledge graph visualization | 🟡 |
| [`telos`](./apps/telos) | TELOS — Deep context framework | 🟡 |
| [`contracts`](./apps/contracts) | Solidity smart contracts (Base L2) | 🔴 |
| [`docs`](./apps/docs) | Documentation static site | 🟢 |

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [SurrealDB](https://surrealdb.com/) 3.0+ (for mem-brain, oracle)
- [Foundry](https://getfoundry.sh/) (for contracts — optional)

### Setup

```bash
# Install dependencies
pnpm install

# Install git hooks (lefthook)
pnpm prepare

# Build all packages
pnpm build
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers (Turborepo TUI) |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests with coverage reports |
| `pnpm coverage:check` | Verify coverage thresholds |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm lint:fix` | Lint and auto-fix |
| `pnpm format` | Format all files with Biome |
| `pnpm autofix` | Run all auto-fixers (format + lint + imports + sort) |
| `pnpm autofix:check` | Check if autofixes are needed |
| `pnpm clean` | Clean all build artifacts |

### CodeRabbit Review

```bash
# Review uncommitted changes (default)
pnpm review

# Review staged changes only
pnpm review:staged

# Review committed changes since main
pnpm review:committed

# Review + auto-apply fixes
./scripts/automation/coderabbit-review.sh quick --autofix

# Apply fixes from latest review
./scripts/automation/apply-coderabbit-fixes.sh
```

### Coverage

Coverage is tracked per-package via [Codecov](https://app.codecov.io/github/AReid987/aigency-monorepo).

```bash
# Generate coverage reports locally
pnpm test:coverage

# Check if coverage meets thresholds
pnpm coverage:check
```

**Current targets:**

| Package | Target | Notes |
|---------|--------|-------|
| agent-core | 80% | Core types and utilities |
| mem-brain | 20% | Memory layer (complex integrations) |
| surreal | 10% | DB client wrappers |
| honcho | 10% | Peer identity client |
| vault-tools | 1% | Utility scripts |
| router | 55% | LLM proxy app |

---

## Git Hooks (Lefthook)

| Hook | Triggers |
|------|----------|
| `pre-commit` | Autofix, biome-check, biome-format-md-json, typecheck-affected |
| `pre-push` | lint, typecheck, test, coverage-check, coderabbit-review |

> **Note:** Known pre-existing failures in `apps/contracts` (requires `forge`) and `packages/design-tokens` (rootDir mismatch) may require `--no-verify` on commit until resolved.

---

## CI/CD

| Workflow | File | Trigger |
|----------|------|---------|
| Coverage | `.github/workflows/coverage.yml` | Push/PR to `main` |
| CodeRabbit Review | `.github/workflows/coderabbit.yml` | PR open/sync |
| MegaLinter | `.github/workflows/megalinter.yml` | PR to `main` |
| Automation | `.github/workflows/automation.yml` | Schedule / manual |

---

## License

MIT — see [LICENSE](./LICENSE) for details.
