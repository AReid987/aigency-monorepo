# 🍰 Slice Completion Workflow

One-command pipeline for completing discrete work units (slices) in the Aigency monorepo.

## Quick Start

```bash
# Complete current slice with full QA pipeline
pnpm slice

# Complete and push to remote
pnpm slice:push

# Complete with Graphite stacked PR workflow
pnpm slice:gt

# Fast mode — skip verification (emergencies only)
pnpm slice:fast

# Generate AI commit message only
pnpm commit:ai
```

## Pipeline Stages

| Stage | Command | Description |
|-------|---------|-------------|
| 1 | `biome format --write` | Auto-format all files |
| 2 | `biome check` | Lint with autofix |
| 3 | `turbo run typecheck` | TypeScript type checking |
| 4 | `turbo run test` | Run all tests |
| 5 | `coverage-check.sh --ci` | Validate coverage thresholds |
| 6 | `wiki-check.sh` | Check if wiki needs updates |
| 7 | `git commit` or `gt create` | Commit with AI-generated message |

## Coverage Thresholds

| Package | Threshold | Status |
|---------|-----------|--------|
| `apps/router` | 55% | ✅ |
| `packages/agent-core` | 80% | ✅ |
| `packages/surreal` | 10% | ✅ |
| `packages/vault-tools` | 1% | ✅ |
| `packages/honcho` | 10% | ✅ |
| `packages/mem-brain` | 20% | ✅ |

## AI Commit Generation

The pipeline uses a local Ollama model (`qwen2.5:0.5b`) to analyze diffs and generate conventional commit messages. If the model is unavailable or returns invalid output, a heuristic fallback generates messages based on changed file patterns.

### Commit Types

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Formatting, no code change
- `refactor` — Code restructuring
- `perf` — Performance improvement
- `test` — Test changes
- `build` — Build system changes
- `ci` — CI/CD changes
- `chore` — Maintenance
- `wiki` — LLM-Wiki knowledge base changes
- `telos` — TELOS context files
- `agent` — Agent configuration/personas

## Graphite Integration

When using `--graphite` flag:
- `gt add -A` stages changes
- `gt create -m "message"` creates a new commit
- `gt submit` pushes the stack (with `--push`)

## Skipping Stages

```bash
# Skip tests (useful when tests are known failing)
./scripts/automation/agent-slice-commit.sh --skip-tests

# Skip coverage check
./scripts/automation/agent-slice-commit.sh --skip-coverage

# Skip wiki update
./scripts/automation/agent-slice-commit.sh --skip-wiki

# Combine skips
./scripts/automation/agent-slice-commit.sh --skip-tests --skip-coverage
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/automation/agent-slice-commit.sh` | Main orchestrator |
| `scripts/automation/generate-commit-msg.sh` | AI commit message generation |
| `scripts/automation/generate-tests.sh` | Generate tests for low coverage |
| `scripts/automation/wiki-check.sh` | Check/update wiki |
| `scripts/automation/coverage-check.sh` | Validate coverage thresholds |
| `scripts/automation/coderabbit-review.sh` | CodeRabbit AI review |
| `scripts/automation/apply-coderabbit-fixes.sh` | Apply CodeRabbit autofixes |

## Git Hooks (Lefthook)

- **pre-commit**: autofix, biome-check, biome-format-md-json, typecheck-affected
- **prepare-commit-msg**: AI commit message generation (if empty message)
- **commit-msg**: commitlint validation
- **pre-push**: lint, typecheck, test, coverage-check, CodeRabbit review
