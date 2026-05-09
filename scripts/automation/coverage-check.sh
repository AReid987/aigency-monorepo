#!/usr/bin/env bash
# coverage-check.sh — Validate coverage thresholds from generated reports
# Usage: coverage-check.sh [--ci]
#   --ci    Fail on threshold violation (for CI/pre-push)
#   (none)  Report-only mode

set -euo pipefail

CI_MODE=false
if [ "${1:-}" = "--ci" ]; then
  CI_MODE=true
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EXIT_CODE=0

# Thresholds per package (minimum % lines coverage)
# NOTE: Incrementally raise these as test coverage improves
declare -A THRESHOLDS=(
  ["apps/router"]=55
  ["packages/agent-core"]=80
  ["packages/surreal"]=10
  ["packages/vault-tools"]=1
  ["packages/honcho"]=10
  ["packages/mem-brain"]=20
)

# Parse istanbul coverage-final.json for line coverage percentage
get_coverage_pct() {
  local pkg_dir="$1"
  local final_json="$pkg_dir/coverage/coverage-final.json"

  if [ ! -f "$final_json" ]; then
    echo "0"
    return
  fi

  node -e "
    const data = require('$final_json');
    let totalStatements = 0, coveredStatements = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalLines = 0, coveredLines = 0;

    Object.values(data).forEach(file => {
      // Statement coverage (used as proxy for line coverage in istanbul)
      if (file.s) {
        Object.values(file.s).forEach(count => {
          totalStatements++;
          if (count > 0) coveredStatements++;
        });
      }
      // Branch coverage
      if (file.b) {
        Object.values(file.b).forEach(branchCounts => {
          if (Array.isArray(branchCounts)) {
            branchCounts.forEach(count => {
              totalBranches++;
              if (count > 0) coveredBranches++;
            });
          }
        });
      }
      // Function coverage
      if (file.f) {
        Object.values(file.f).forEach(count => {
          totalFunctions++;
          if (count > 0) coveredFunctions++;
        });
      }
    });

    const linePct = totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0;
    console.log(linePct);
  " 2>/dev/null || echo "0"
}

echo "═══════════════════════════════════════════════════════════════"
echo "  📊 Aigency Coverage Threshold Check"
echo "═══════════════════════════════════════════════════════════════"
echo ""

for pkg_dir in "${!THRESHOLDS[@]}"; do
  pkg_name=$(basename "$pkg_dir")
  threshold="${THRESHOLDS[$pkg_dir]}"
  full_path="$ROOT_DIR/$pkg_dir"

  if [ ! -d "$full_path" ]; then
    echo "  ⚠️  $pkg_name — directory not found, skipping"
    continue
  fi

  pct=$(get_coverage_pct "$full_path")

  if [ "$pct" = "0" ]; then
    echo "  ⚠️  $pkg_name — no coverage report found (run tests first)"
    if [ "$CI_MODE" = true ]; then
      EXIT_CODE=1
    fi
    continue
  fi

  if [ "$pct" -lt "$threshold" ]; then
    echo "  ❌ $pkg_name — $pct% (threshold: ${threshold}%)"
    EXIT_CODE=1
  else
    echo "  ✅ $pkg_name — $pct% (threshold: ${threshold}%)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "  ❌ Coverage check FAILED — some packages are below threshold"
  echo ""
  echo "  To fix:"
  echo "    1. Run 'pnpm test:coverage' to generate reports"
  echo "    2. Add tests for uncovered code"
  echo "    3. Or adjust thresholds in codecov.yml and coverage-check.sh"
  echo ""
else
  echo "  ✅ All coverage thresholds met"
  echo ""
fi

exit "$EXIT_CODE"
