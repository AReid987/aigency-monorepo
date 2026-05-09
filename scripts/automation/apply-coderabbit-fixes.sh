#!/bin/bash
# Apply fixes from a CodeRabbit review file
# Usage: ./scripts/automation/apply-coderabbit-fixes.sh [review-file]
#   If no file provided, uses the most recent review in .coderabbit/reviews/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

REVIEW_FILE="${1:-}"

if [ -z "$REVIEW_FILE" ]; then
  REVIEW_DIR="$REPO_ROOT/.coderabbit/reviews"
  if [ ! -d "$REVIEW_DIR" ]; then
    echo "❌ No review directory found at $REVIEW_DIR"
    echo "   Run a review first: pnpm review"
    exit 1
  fi
  REVIEW_FILE=$(ls -t "$REVIEW_DIR"/review-*.md 2>/dev/null | head -1)
  if [ -z "$REVIEW_FILE" ]; then
    echo "❌ No review files found in $REVIEW_DIR"
    echo "   Run a review first: pnpm review"
    exit 1
  fi
fi

if [ ! -f "$REVIEW_FILE" ]; then
  echo "❌ Review file not found: $REVIEW_FILE"
  exit 1
fi

echo "🔧 Applying fixes from:"
echo "   $(basename "$REVIEW_FILE")"
echo ""

# ─── Phase 1: Structural auto-fixers ─────────────────────────────────────────
echo "📋 Phase 1: Running structural auto-fixers..."
"$SCRIPT_DIR/autofix.sh" fix
echo ""

# ─── Phase 2: Extract and categorize review findings ─────────────────────────
echo "📋 Phase 2: Analyzing review findings..."

# Create a structured report of remaining manual fixes
FIX_REPORT="$REPO_ROOT/.coderabbit/fix-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$FIX_REPORT" <<'HEADER'
# CodeRabbit Fix Report

This report lists findings from the latest CodeRabbit review that may require
manual attention. Auto-fixable issues (formatting, lint) have already been
applied via Biome.

## Automated Fixes Applied
- [x] Biome format
- [x] Biome lint (safe + unsafe)
- [x] Import organization
- [x] Package.json sorting
- [x] Trailing whitespace cleanup

## Manual Review Required

HEADER

# Extract potential file/line references and code suggestions from the review
# This is a best-effort parser — CodeRabbit output format may vary

# Look for code blocks that contain "Suggested fix" or similar
IN_FIX_BLOCK=false
FIX_COUNT=0

while IFS= read -r line; do
  # Detect start of a suggested fix block
  if echo "$line" | grep -qiE "suggested fix|proposed fix|fix suggestion|\\`\\`\\`diff"; then
    IN_FIX_BLOCK=true
    FIX_COUNT=$((FIX_COUNT + 1))
    echo "### Fix $FIX_COUNT" >> "$FIX_REPORT"
    echo "" >> "$FIX_REPORT"
    echo '```diff' >> "$FIX_REPORT"
    continue
  fi

  # Detect end of code block
  if [ "$IN_FIX_BLOCK" = true ] && echo "$line" | grep -qE "^\\`\\`\\`$"; then
    IN_FIX_BLOCK=false
    echo '```' >> "$FIX_REPORT"
    echo "" >> "$FIX_REPORT"
    continue
  fi

  # Collect lines inside fix block
  if [ "$IN_FIX_BLOCK" = true ]; then
    echo "$line" >> "$FIX_REPORT"
    continue
  fi

  # Capture file:line references for manual review
  if echo "$line" | grep -qE "[a-zA-Z0-9_/-]+\.(ts|tsx|js|jsx|json|md):[0-9]+"; then
    echo "- **$line**" >> "$FIX_REPORT"
  fi
done < "$REVIEW_FILE"

# If no structured fixes were found, add a generic note
if [ "$FIX_COUNT" -eq 0 ]; then
  echo "_No structured fix blocks detected in the review output._" >> "$FIX_REPORT"
  echo "" >> "$FIX_REPORT"
  echo "The review may contain narrative suggestions that require manual reading." >> "$FIX_REPORT"
  echo "Open the review file to inspect:" >> "$FIX_REPORT"
  echo "\`\`\`" >> "$FIX_REPORT"
  echo "cat \"$REVIEW_FILE\"" >> "$FIX_REPORT"
  echo "\`\`\`" >> "$FIX_REPORT"
fi

echo ""
echo "📋 Fix report generated:"
echo "   $FIX_REPORT"
echo ""

# ─── Phase 3: Summary ────────────────────────────────────────────────────────
echo "────────────────────────────────────────"
echo "✅ Structural fixes applied"
echo "📋 Manual fixes catalogued: $FIX_COUNT"
echo ""
echo "Next steps:"
echo "  cat \"$FIX_REPORT\"          # view fix report"
echo "  pnpm test                    # verify tests pass"
echo "  pnpm typecheck               # verify types"
echo "  git diff                     # review all changes"
echo ""
