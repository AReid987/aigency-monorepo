#!/usr/bin/env bash
# =============================================================================
# Agentic Wiki Regeneration Trigger
# =============================================================================
# This script acts as the bridge between CI automation and AI agent execution.
# It prepares the environment for an AI agent to regenerate the deep-wiki.
#
# Usage:
#   ./scripts/automation/agentic-wiki-regen.sh [--dry-run]
#
# What it does:
#   1. Validates docs staleness
#   2. Creates a timestamped work branch
#   3. Generates a prompt/context file for the AI agent
#   4. (Optional) Triggers an external agent via webhook or MCP
#
# Note: This script does NOT run the AI itself. It sets up the conditions
# for an AI agent (Claude, GPT, etc.) to do the work.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DRY_RUN=false

cd "$REPO_ROOT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "🤖 Agentic Wiki Regeneration"
echo "   Dry run: $DRY_RUN"
echo ""

# Step 1: Check staleness
echo "🔍 Step 1: Checking staleness..."
if ! ./scripts/automation/docs-staleness-check.sh; then
  echo "   Staleness confirmed. Proceeding with regeneration setup."
else
  echo "   Docs are fresh. No regeneration needed."
  exit 0
fi

echo ""

# Step 2: Create work branch
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="agentic/wiki-regen-${TIMESTAMP}"

echo "🌿 Step 2: Creating work branch: $BRANCH_NAME"
if [ "$DRY_RUN" = false ]; then
  git checkout -b "$BRANCH_NAME"
fi

echo ""

# Step 3: Prepare context for AI agent
CONTEXT_FILE=".agentic-wiki-context.md"

echo "📝 Step 3: Preparing agent context..."
cat > "$CONTEXT_FILE" << EOF
# Agentic Wiki Regeneration Context

**Task:** Regenerate the deep-wiki for aigency-monorepo to reflect current codebase state.

**Branch:** $BRANCH_NAME
**Triggered:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Staleness:** Detected by \`docs-staleness-check.sh\`

## Repository State

- **Commit:** $(git rev-parse HEAD)
- **Branch:** $(git rev-parse --abbrev-ref HEAD)
- **Files changed since last docs update:**
$(git diff --name-only $(git log -1 --format=%H -- apps/docs/)..HEAD -- apps/ packages/ agents/ | sed 's/^/  - /')

## Instructions for AI Agent

1. Read the current deep-wiki at \`apps/docs/\`
2. Identify what has changed in the codebase
3. Update relevant wiki pages (don't regenerate everything unless needed)
4. Focus on:
   - New apps/packages added
   - Architecture changes
   - Agent updates
   - API changes
5. Maintain citation format: \`(file_path:line)\`
6. Include Mermaid diagrams where architecture changed
7. Update AGENTS.md if conventions changed

## Output

Commit changes to branch \`$BRANCH_NAME\` and open a PR.
EOF

echo "   Context written to: $CONTEXT_FILE"

echo ""

# Step 4: GitNexus refresh (non-AI, can run automatically)
echo "🔄 Step 4: Refreshing GitNexus index..."
if [ "$DRY_RUN" = false ]; then
  ./scripts/automation/gitnexus-sync.sh
fi

echo ""

# Step 5: Stage context file
echo "📦 Step 5: Staging context..."
if [ "$DRY_RUN" = false ]; then
  git add "$CONTEXT_FILE"
  git commit -m "chore(agentic): prepare wiki regeneration context [agentic-wiki]"
fi

echo ""
echo "✅ Agentic setup complete"
echo ""
echo "Next steps:"
echo "   1. AI agent reads $CONTEXT_FILE"
echo "   2. Agent regenerates relevant wiki pages"
echo "   3. Agent commits to branch: $BRANCH_NAME"
echo "   4. Human reviews and merges PR"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "🧪 DRY RUN — No changes were made."
  rm -f "$CONTEXT_FILE"
fi
