#!/usr/bin/env bash
# =============================================================================
# GitNexus Sync Script
# =============================================================================
# Keeps the GitNexus knowledge graph index in sync with the current codebase.
#
# Usage:
#   ./scripts/automation/gitnexus-sync.sh [--force]
#
# Designed for:
#   - Pre-commit hooks (lightweight check)
#   - Post-merge hooks (refresh after pull)
#   - CI/CD pipelines (GitHub Actions)
#   - Local dev convenience
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FORCE=false

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--force]"
      exit 1
      ;;
  esac
done

cd "$REPO_ROOT"

echo "🔍 GitNexus Sync — $(date)"
echo "   Repo: $REPO_ROOT"
echo ""

# Check if gitnexus is available
if ! command -v npx &> /dev/null; then
  echo "❌ npx not found. Is Node.js installed?"
  exit 1
fi

# Check current status
echo "📊 Checking index status..."
if [ -d ".gitnexus" ]; then
  npx gitnexus status
else
  echo "   No existing index found. Will create new."
fi

echo ""

# Run analyze
echo "🔄 Running GitNexus analyze..."
if [ "$FORCE" = true ]; then
  npx gitnexus analyze --force
else
  npx gitnexus analyze
fi

echo ""
echo "✅ GitNexus sync complete"
echo ""

# Check for uncommitted changes
if [ -d ".git" ]; then
  if ! git diff --quiet .gitnexus/ 2>/dev/null; then
    echo "⚠️  Index changed. Run 'git add .gitnexus/' to stage."
  fi
fi
