#!/bin/bash
# Aigency Autofix Script
# Runs all available auto-fixers across the monorepo.
# Usage: ./scripts/automation/autofix.sh [--check] [--fix]
#   --check  Run in check mode (exit 1 if fixes needed)
#   --fix    Apply fixes (default)

set -euo pipefail

MODE="${1:-fix}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

echo "🛠  Aigency Autofix"
echo "   Mode: $MODE"
echo ""

FIX_FLAGS=""
if [ "$MODE" = "check" ]; then
  FIX_FLAGS=""
  echo "Running in CHECK mode (will exit 1 if fixes needed)"
else
  FIX_FLAGS="--write"
  echo "Running in FIX mode (will apply fixes)"
fi
echo ""

EXIT_CODE=0

# ─── 1. Biome Format ─────────────────────────────────────────────────────────
echo "📝 1/6 Biome Format"
if [ "$MODE" = "check" ]; then
  if ! pnpm exec biome format --no-errors-on-unmatched --files-ignore-unknown=true .; then
    echo "   ❌ Format issues found"
    EXIT_CODE=1
  else
    echo "   ✅ Format clean"
  fi
else
  pnpm exec biome format --write --no-errors-on-unmatched --files-ignore-unknown=true .
  echo "   ✅ Formatted"
fi
echo ""

# ─── 2. Biome Lint (with fixes) ──────────────────────────────────────────────
echo "🔍 2/6 Biome Lint"
if [ "$MODE" = "check" ]; then
  if ! pnpm exec biome check --no-errors-on-unmatched --files-ignore-unknown=true .; then
    echo "   ❌ Lint issues found"
    EXIT_CODE=1
  else
    echo "   ✅ Lint clean"
  fi
else
  # Try safe fixes first
  pnpm exec biome check --write --no-errors-on-unmatched --files-ignore-unknown=true . || true
  # Then try unsafe fixes for known patterns
  pnpm exec biome check --write --unsafe --no-errors-on-unmatched --files-ignore-unknown=true . || true
  echo "   ✅ Linted (safe + unsafe fixes applied)"
fi
echo ""

# ─── 3. Organize Imports ─────────────────────────────────────────────────────
echo "📦 3/6 Organize Imports"
if [ "$MODE" = "check" ]; then
  if ! pnpm exec biome check --organize-imports-enabled=true --no-errors-on-unmatched --files-ignore-unknown=true .; then
    echo "   ❌ Import organization issues found"
    EXIT_CODE=1
  else
    echo "   ✅ Imports clean"
  fi
else
  pnpm exec biome check --organize-imports-enabled=true --write --no-errors-on-unmatched --files-ignore-unknown=true . || true
  echo "   ✅ Imports organized"
fi
echo ""

# ─── 4. JSON / Package.json Sort ─────────────────────────────────────────────
echo "📋 4/6 JSON & Package.json"
if [ "$MODE" = "fix" ]; then
  # Sort package.json files with sort-package-json if available
  if command -v npx &>/dev/null && npx sort-package-json --version &>/dev/null; then
    npx sort-package-json "package.json" "packages/*/package.json" "apps/*/package.json" 2>/dev/null || true
    echo "   ✅ Package.json sorted"
  else
    echo "   ⏭️  sort-package-json not available, skipping"
  fi
else
  echo "   ⏭️  Check mode: skipping package.json sort"
fi
echo ""

# ─── 5. Git Conflict Markers ─────────────────────────────────────────────────
echo "⚔️  5/6 Git Conflict Markers"
if grep -rn "<<<<<<< HEAD" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" packages/ apps/ scripts/ 2>/dev/null; then
  echo "   ❌ Git conflict markers found!"
  EXIT_CODE=1
else
  echo "   ✅ No conflict markers"
fi
echo ""

# ─── 6. Trailing Whitespace / EOF Newline ────────────────────────────────────
echo "✂️  6/6 Trailing Whitespace"
if [ "$MODE" = "fix" ]; then
  # Fix trailing whitespace in tracked files
  git diff --cached --name-only --diff-filter=ACM 2>/dev/null | while read -r file; do
    if [ -f "$file" ] && [[ "$file" =~ \.(ts|tsx|js|jsx|json|md|yaml|yml|sh)$ ]]; then
      sed -i '' 's/[[:space:]]*$//' "$file" 2>/dev/null || sed -i 's/[[:space:]]*$//' "$file" 2>/dev/null || true
    fi
  done
  echo "   ✅ Trailing whitespace cleaned"
else
  echo "   ⏭️  Check mode: skipping whitespace cleanup"
fi
echo ""

# ─── Summary ─────────────────────────────────────────────────────────────────
echo "────────────────────────────────────────"
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "✅ All checks passed"
else
  echo "❌ Some checks failed — run with --fix to apply"
fi

echo ""
echo "Next steps:"
echo "  pnpm lint         # verify fixes"
echo "  pnpm typecheck    # verify types"
echo "  pnpm test         # verify tests"

exit "$EXIT_CODE"
