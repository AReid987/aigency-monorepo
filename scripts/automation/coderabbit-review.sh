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
# Output is always persisted to .coderabbit/reviews/ for later autofix.
#
# Examples:
#   ./scripts/automation/coderabbit-review.sh quick
#   ./scripts/automation/coderabbit-review.sh staged --plain
#   ./scripts/automation/coderabbit-review.sh agent --base main
#   ./scripts/automation/coderabbit-review.sh quick --autofix  # review + auto-apply fixes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

MODE="${1:-quick}"
shift || true

# Parse --autofix flag
AUTOFIX=false
for arg in "$@"; do
  if [ "$arg" = "--autofix" ]; then
    AUTOFIX=true
    set -- "${@/$arg/}"
  fi
done

# Detect base branch
BASE_BRANCH="${BASE_BRANCH:-main}"
if git rev-parse --verify develop &>/dev/null; then
  BASE_BRANCH="${BASE_BRANCH:-develop}"
fi

# Ensure review directory exists
REVIEW_DIR="$REPO_ROOT/.coderabbit/reviews"
mkdir -p "$REVIEW_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REVIEW_FILE="$REVIEW_DIR/review-$TIMESTAMP.md"
META_FILE="$REVIEW_DIR/review-$TIMESTAMP.json"

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
echo "   Output: $REVIEW_FILE"
if [ "$AUTOFIX" = true ]; then
  echo "   Autofix: enabled"
fi
echo ""

# Run review and capture output
exec > >(tee -a "$REVIEW_FILE")
exec 2> >(tee -a "$REVIEW_FILE" >&2)

case "$MODE" in
  quick)
    echo "Reviewing uncommitted changes..."
    $CR_CMD --type uncommitted "$@" || true
    ;;

  staged)
    echo "Reviewing staged changes..."
    $CR_CMD --type uncommitted --plain "$@" || true
    ;;

  committed)
    echo "Reviewing committed changes since $BASE_BRANCH..."
    $CR_CMD --type committed --base "$BASE_BRANCH" "$@" || true
    ;;

  pr)
    echo "Reviewing full PR diff..."
    $CR_CMD --base "$BASE_BRANCH" --plain "$@" || true
    ;;

  agent)
    echo "Generating agent-optimized review..."
    $CR_CMD --agent --base "$BASE_BRANCH" "$@" || true
    ;;

  interactive)
    echo "Launching interactive review..."
    $CR_CMD --interactive "$@" || true
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
    echo ""
    echo "Flags:"
    echo "  --autofix   Automatically apply fixable suggestions after review"
    exit 1
    ;;
esac

# Restore stdout/stderr
exec >&- 2>&-
exec 1>/dev/tty 2>/dev/tty || true

# Write metadata
cat > "$META_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "mode": "$MODE",
  "baseBranch": "$BASE_BRANCH",
  "file": "$REVIEW_FILE",
  "autofix": $AUTOFIX
}
EOF

echo ""
echo "✅ Review complete — saved to:"
echo "   $REVIEW_FILE"

# Count findings
FINDINGS=$(grep -c "^\s*[-*]\s*\`\|\[Issue\]\|\[Finding\]\|Suggestion\|Fix" "$REVIEW_FILE" 2>/dev/null || echo 0)
if [ "$FINDINGS" -gt 0 ]; then
  echo "   📋 ~$FINDINGS potential findings detected"
fi

# Run autofix if requested
if [ "$AUTOFIX" = true ]; then
  echo ""
  echo "🔧 Running autofix from review..."
  "$SCRIPT_DIR/apply-coderabbit-fixes.sh" "$REVIEW_FILE" || true
fi

echo ""
echo "To apply fixes manually:"
echo "  ./scripts/automation/apply-coderabbit-fixes.sh   # apply from latest review"
echo "  pnpm autofix                                      # run all auto-fixers"
echo "  pnpm format                                       # format with Biome"
echo "  pnpm lint:fix                                     # lint and fix with Biome"
