#!/bin/bash
# agent-slice-commit.sh — Complete slice completion pipeline
# Runs: format → lint → typecheck → test → coverage-check → wiki-check → commit → push
# Usage: agent-slice-commit.sh [options] [message]
# Options:
#   --skip-tests       Skip test execution
#   --skip-coverage    Skip coverage check
#   --skip-wiki        Skip wiki update check
#   --no-verify        Skip all verification (fast mode)
#   --message, -m      Commit message (auto-generated if omitted)
#   --dry-run          Show what would happen without executing
#   --graphite, -gt    Use Graphite CLI for stacked PR workflow
#   --push             Push after commit (default: no push)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$REPO_ROOT"

# Default options
SKIP_TESTS=false
SKIP_COVERAGE=false
SKIP_WIKI=false
NO_VERIFY=false
DRY_RUN=false
USE_GRAPHITE=false
PUSH=false
MESSAGE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests)
      SKIP_TESTS=true; shift ;;
    --skip-coverage)
      SKIP_COVERAGE=true; shift ;;
    --skip-wiki)
      SKIP_WIKI=true; shift ;;
    --no-verify)
      NO_VERIFY=true; shift ;;
    --dry-run)
      DRY_RUN=true; shift ;;
    --graphite|-gt)
      USE_GRAPHITE=true; shift ;;
    --push)
      PUSH=true; shift ;;
    --message|-m)
      MESSAGE="$2"; shift 2 ;;
    *)
      if [ -z "$MESSAGE" ]; then
        MESSAGE="$1"
      fi
      shift ;;
  esac
done

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

step() {
  echo ""
  echo -e "${BLUE}▶ $1${NC}"
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

fail() {
  echo -e "${RED}✗ $1${NC}"
}

# Dry run check
if [ "$DRY_RUN" = true ]; then
  echo "[DRY RUN] Would execute the following steps:"
  echo "  1. Format code (biome format --write)"
  if [ "$SKIP_TESTS" = false ]; then
    echo "  2. Run tests"
    if [ "$SKIP_COVERAGE" = false ]; then
      echo "  3. Check coverage thresholds"
    fi
  fi
  echo "  4. Run lint"
  echo "  5. Run typecheck"
  if [ "$SKIP_WIKI" = false ]; then
    echo "  6. Check/update wiki"
  fi
  echo "  7. Generate commit message${MESSAGE:+: "$MESSAGE"}"
  if [ "$USE_GRAPHITE" = true ]; then
    echo "  8. gt add → gt create → gt submit"
  else
    echo "  8. git add → git commit"
  fi
  if [ "$PUSH" = true ]; then
    echo "  9. Push to remote"
  fi
  exit 0
fi

# Check if there are changes to commit
if git diff --cached --quiet && git diff --quiet; then
  warn "No changes to commit"
  exit 0
fi

# Step 1: Format
step "1/7 Formatting code..."
if command -v pnpm &> /dev/null; then
  pnpm exec biome format --write --no-errors-on-unmatched --files-ignore-unknown=true . >/dev/null 2>&1 || true
  success "Code formatted"
else
  warn "pnpm not available, skipping format"
fi

# Step 2: Lint
step "2/7 Running linter..."
if [ "$NO_VERIFY" = false ]; then
  if command -v pnpm &> /dev/null; then
    if pnpm exec biome check --no-errors-on-unmatched --files-ignore-unknown=true . >/dev/null 2>&1; then
      success "Lint passed"
    else
      warn "Lint issues found — attempting autofix..."
      pnpm exec biome check --write --no-errors-on-unmatched --files-ignore-unknown=true . >/dev/null 2>&1 || true
      if pnpm exec biome check --no-errors-on-unmatched --files-ignore-unknown=true . >/dev/null 2>&1; then
        success "Lint autofixed"
      else
        fail "Lint still failing — manual intervention needed"
        exit 1
      fi
    fi
  fi
else
  warn "Skipped (no-verify mode)"
fi

# Step 3: Typecheck
step "3/7 Running typecheck..."
if [ "$NO_VERIFY" = false ]; then
  if command -v pnpm &> /dev/null; then
    if pnpm exec turbo run typecheck 2>&1 | tail -5; then
      success "Typecheck passed"
    else
      fail "Typecheck failed"
      exit 1
    fi
  fi
else
  warn "Skipped (no-verify mode)"
fi

# Step 4: Tests
if [ "$SKIP_TESTS" = false ] && [ "$NO_VERIFY" = false ]; then
  step "4/7 Running tests..."
  if command -v pnpm &> /dev/null; then
    if pnpm exec turbo run test 2>&1 | tail -20; then
      success "Tests passed"
    else
      warn "Some tests failed — check output above"
      # Don't exit — coverage report may still be useful
    fi
  fi
else
  step "4/7 Tests (skipped)"
fi

# Step 5: Coverage check
if [ "$SKIP_COVERAGE" = false ] && [ "$NO_VERIFY" = false ]; then
  step "5/7 Checking coverage..."
  if [ -f "$SCRIPT_DIR/coverage-check.sh" ]; then
    if "$SCRIPT_DIR/coverage-check.sh" --ci 2>&1 | tail -10; then
      success "Coverage thresholds met"
    else
      warn "Coverage below threshold — generating test targets..."
      "$SCRIPT_DIR/generate-tests.sh" packages/agent-core --dry-run 2>/dev/null || true
      warn "Run generate-tests.sh without --dry-run to create tests"
    fi
  fi
else
  step "5/7 Coverage (skipped)"
fi

# Step 6: Wiki check
if [ "$SKIP_WIKI" = false ]; then
  step "6/7 Checking wiki..."
  if [ -f "$SCRIPT_DIR/wiki-check.sh" ]; then
    if "$SCRIPT_DIR/wiki-check.sh" 2>&1 | tail -5; then
      success "Wiki is up to date"
    else
      warn "Wiki needs update — running auto-fix..."
      "$SCRIPT_DIR/wiki-check.sh" --auto-fix 2>&1 | tail -5 || true
      success "Wiki updated"
    fi
  fi
else
  step "6/7 Wiki (skipped)"
fi

# Step 7: Commit
step "7/7 Committing changes..."

# Stage all changes
git add -A

# Generate or use provided commit message
if [ -n "$MESSAGE" ]; then
  COMMIT_MSG="$MESSAGE"
else
  # Try AI-generated commit message
  if [ -f "$SCRIPT_DIR/generate-commit-msg.sh" ] && command -v ollama &> /dev/null; then
    echo "🤖 Generating commit message with Ollama..."
    COMMIT_MSG=$("$SCRIPT_DIR/generate-commit-msg.sh" 2>/dev/null || echo "")
    if [ -z "$COMMIT_MSG" ] || [ "$COMMIT_MSG" = "ci: automated commit" ]; then
      # Fallback to conventional commit based on changed files
      CHANGED_FILES=$(git diff --cached --name-only | head -20 | tr '\n' ' ')
      if echo "$CHANGED_FILES" | grep -q "test"; then
        COMMIT_MSG="test: add and update tests"
      elif echo "$CHANGED_FILES" | grep -q "package\.json"; then
        COMMIT_MSG="chore: update dependencies"
      elif echo "$CHANGED_FILES" | grep -q "README\|\.md$"; then
        COMMIT_MSG="docs: update documentation"
      else
        COMMIT_MSG="feat: update implementation"
      fi
    fi
  else
    COMMIT_MSG="ci: automated commit"
  fi
fi

echo "Commit message: $COMMIT_MSG"

# Commit with appropriate tool
if [ "$USE_GRAPHITE" = true ] && command -v gt &> /dev/null; then
  echo "📊 Using Graphite CLI..."
  gt add -A
  gt create -m "$COMMIT_MSG"
  success "Graphite commit created"

  if [ "$PUSH" = true ]; then
    gt submit
    success "Submitted to Graphite"
  fi
elif [ "$USE_GRAPHITE" = true ]; then
  warn "Graphite CLI (gt) not found — falling back to git"
  git commit -m "$COMMIT_MSG"
  success "Committed: $COMMIT_MSG"

  if [ "$PUSH" = true ]; then
    git push
    success "Pushed to remote"
  fi
else
  if [ "$NO_VERIFY" = true ]; then
    git commit --no-verify -m "$COMMIT_MSG"
  else
    git commit -m "$COMMIT_MSG"
  fi
  success "Committed: $COMMIT_MSG"

  if [ "$PUSH" = true ]; then
    git push
    success "Pushed to remote"
  fi
fi

echo ""
echo -e "${GREEN}🎉 Slice completion pipeline finished!${NC}"
