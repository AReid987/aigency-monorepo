#!/bin/bash
# generate-tests.sh — Generate tests for files with low coverage
# Usage: generate-tests.sh <package> [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$REPO_ROOT"

PACKAGE="${1:-}"
DRY_RUN=false
if [ "${2:-}" = "--dry-run" ]; then
  DRY_RUN=true
fi

if [ -z "$PACKAGE" ]; then
  echo "Usage: $0 <package> [--dry-run]"
  echo "  package: apps/router, packages/agent-core, etc."
  echo "  --dry-run: Show what would be generated without creating files"
  exit 1
fi

# Find uncovered files from coverage report
COVERAGE_FILE="$REPO_ROOT/$PACKAGE/coverage/coverage-final.json"

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "Error: No coverage report found at $COVERAGE_FILE"
  echo "Run tests with coverage first: pnpm test:coverage"
  exit 1
fi

# Parse coverage JSON to find files with low branch/statement coverage
# This is a simplified version - enhance with istanbul.js parsing for accuracy
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$COVERAGE_FILE', 'utf-8'));
const lowCoverage = [];
Object.entries(data).forEach(([file, metrics]) => {
  if (file.includes('node_modules') || file.endsWith('.d.ts') || file.includes('.test.')) return;
  const stmt = metrics.statementMap ? Object.keys(metrics.statementMap).length : 0;
  const hit = metrics.s ? Object.values(metrics.s).filter(v => v > 0).length : 0;
  const pct = stmt > 0 ? (hit / stmt) * 100 : 100;
  if (pct < 80) {
    lowCoverage.push({ file, pct: pct.toFixed(1), uncovered: stmt - hit });
  }
});
lowCoverage.sort((a, b) => parseFloat(a.pct) - parseFloat(b.pct));
console.log(JSON.stringify(lowCoverage.slice(0, 10), null, 2));
" > /tmp/low-coverage-files.json

echo "Files with low coverage (<80%):"
cat /tmp/low-coverage-files.json

if [ "$DRY_RUN" = true ]; then
  echo "[DRY RUN] Would generate tests for the above files"
  exit 0
fi

# Generate test prompts for each low-coverage file
# In a full implementation, this could call an LLM to generate tests
# For now, create scaffold test files
while read -r entry; do
  FILE=$(echo "$entry" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); console.log(d.file || '')")
  PCT=$(echo "$entry" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); console.log(d.pct || '')")

  if [ -z "$FILE" ] || [ "$FILE" = "undefined" ]; then continue; fi

  # Determine test file path
  if echo "$FILE" | grep -q "src/"; then
    TEST_FILE=$(echo "$FILE" | sed 's|src/|src/__tests__/|' | sed 's|\.ts$|.test.ts|')
  else
    TEST_FILE=$(echo "$FILE" | sed 's|\.ts$|.test.ts|')
  fi

  echo "Would generate test for: $FILE (coverage: $PCT%) -> $TEST_FILE"
done < <(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/low-coverage-files.json', 'utf-8'));
data.forEach(d => console.log(JSON.stringify(d)));
")

echo "✅ Test generation analysis complete"
echo "💡 Tip: Use AI tools to generate actual test implementations for the listed files"
