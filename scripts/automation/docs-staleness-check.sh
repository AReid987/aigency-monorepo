#!/usr/bin/env bash
# =============================================================================
# Docs Staleness Check
# =============================================================================
# Detects when documentation has fallen behind source code changes.
#
# Usage:
#   ./scripts/automation/docs-staleness-check.sh [--threshold-days N]
#
# Exit codes:
#   0 — docs are fresh
#   1 — docs are stale (threshold exceeded)
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
THRESHOLD_DAYS=7

while [[ $# -gt 0 ]]; do
  case "$1" in
    --threshold-days)
      THRESHOLD_DAYS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--threshold-days N]"
      exit 1
      ;;
  esac
done

cd "$REPO_ROOT"

# Get timestamps (Unix epoch)
DOCS_LAST_MOD=$(git log -1 --format=%ct -- apps/docs/ 2>/dev/null || echo "0")
SOURCE_LAST_MOD=$(git log -1 --format=%ct -- apps/ packages/ agents/ 2>/dev/null || echo "0")

if [ "$DOCS_LAST_MOD" == "0" ]; then
  echo "⚠️  No docs history found. Documentation may not exist yet."
  exit 1
fi

if [ "$SOURCE_LAST_MOD" == "0" ]; then
  echo "✅ No source changes detected."
  exit 0
fi

AGE_DIFF=$((SOURCE_LAST_MOD - DOCS_LAST_MOD))
THRESHOLD_SECONDS=$((THRESHOLD_DAYS * 24 * 60 * 60))

DOCS_DATE=$(date -r "$DOCS_LAST_MOD" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$DOCS_LAST_MOD" '+%Y-%m-%d %H:%M:%S')
SOURCE_DATE=$(date -r "$SOURCE_LAST_MOD" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$SOURCE_LAST_MOD" '+%Y-%m-%d %H:%M:%S')

echo "📊 Docs Staleness Check"
echo "   Docs last updated:    $DOCS_DATE"
echo "   Source last changed:  $SOURCE_DATE"
echo "   Threshold:            ${THRESHOLD_DAYS} days"
echo ""

if [ "$AGE_DIFF" -gt "$THRESHOLD_SECONDS" ]; then
  DAYS_BEHIND=$((AGE_DIFF / 86400))
  echo "❌ STALE — Documentation is ${DAYS_BEHIND} days behind source code."
  echo "   Action: Regenerate deep-wiki via AI agent."
  exit 1
else
  DAYS_FRESH=$((AGE_DIFF / 86400))
  echo "✅ FRESH — Documentation is ${DAYS_FRESH} days behind (within threshold)."
  exit 0
fi
