#!/bin/bash
# CodeRabbit CLI Review Wrapper — Aigency Monorepo
# Usage: ./scripts/automation/coderabbit-review.sh [mode] [options]
#
# Modes:
#   quick       Review uncommitted changes (default)
#   staged      Review staged changes only
#   committed   Review committed changes since base branch
#   pr          Review entire PR diff (CI mode)
#   agent       Structured output for AI agent consumption
#
# Examples:
#   ./scripts/automation/coderabbit-review.sh quick
#   ./scripts/automation/coderabbit-review.sh staged --plain
#   ./scripts/automation/coderabbit-review.sh agent --base main

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

MODE="${1:-quick}"
shift || true

# Detect base branch
BASE_BRANCH="${BASE_BRANCH:-main}"
if git rev-parse --verify develop &>/dev/null; then
  BASE_BRANCH="${BASE_BRANCH:-develop}"
fi

# Check if CodeRabbit CLI is installed
if ! command -v coderabbit &>/dev/null && ! command -v cr &>/dev/null; then
  echo "🐰 CodeRabbit CLI not found. Installing..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &>/dev/null; then
      brew tap coderabbitai/tap 2>/dev/null || true
      brew install coderabbit 2>/dev/null || true
    fi
  fi
  # Fallback to curl installer
  if ! command -v coderabbit &>/dev/null && ! command -v cr &>/dev/null; then
    curl -fsSL https://cli.coderabbit.ai/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

CR_CMD="coderabbit"
if command -v cr &>/dev/null; then
  CR_CMD="cr"
elif ! command -v coderabbit &>/dev/null; then
  echo "❌ Failed to install CodeRabbit CLI"
  echo "   Manual install: curl -fsSL https://cli.coderabbit.ai/install.sh | sh"
  exit 1
fi

echo "🐰 Aigency CodeRabbit Review"
echo "   Mode: $MODE"
echo "   Base: $BASE_BRANCH"
echo ""

case "$MODE" in
  quick)
    echo "Reviewing uncommitted changes..."
    $CR_CMD --type uncommitted "$@"
    ;;

  staged)
    echo "Reviewing staged changes..."
    $CR_CMD --type uncommitted --plain "$@"
    ;;

  committed)
    echo "Reviewing committed changes since $BASE_BRANCH..."
    $CR_CMD --type committed --base "$BASE_BRANCH" "$@"
    ;;

  pr)
    echo "Reviewing full PR diff..."
    $CR_CMD --base "$BASE_BRANCH" --plain "$@"
    ;;

  agent)
    echo "Generating agent-optimized review..."
    $CR_CMD --agent --base "$BASE_BRANCH" "$@"
    ;;

  interactive)
    echo "Launching interactive review..."
    $CR_CMD --interactive "$@"
    ;;

  *)
    echo "Unknown mode: $MODE"
    echo ""
    echo "Available modes:"
    echo "  quick       Review uncommitted changes (default)"
    echo "  staged      Review staged changes only"
    echo "  committed   Review committed changes since base branch"
    echo "  pr          Review entire PR diff"
    echo "  agent       Structured output for AI agents"
    echo "  interactive Launch interactive TUI"
    exit 1
    ;;
esac

echo ""
echo "✅ Review complete"
echo ""
echo "To apply fixes:"
echo "  pnpm autofix      # run all auto-fixers"
echo "  pnpm format       # format with Biome"
echo "  pnpm lint:fix     # lint and fix with Biome"
