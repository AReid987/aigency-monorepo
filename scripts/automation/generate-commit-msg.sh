#!/bin/bash
# Generate conventional commit message from staged diff using a local SLM via Ollama
# Usage: ./scripts/automation/generate-commit-msg.sh [--model MODEL] [--dry-run]
# Output: writes commit message to stdout (for use by git or cz-git)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

MODEL="${OLLAMA_MODEL:-qwen2.5:0.5b}"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)
      MODEL="$2"
      shift 2
      ;;
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

# Check if Ollama is available
if ! command -v ollama &>/dev/null; then
  echo "❌ Ollama not installed. Install: https://ollama.com/download" >&2
  echo "   Falling back to heuristic commit message generation." >&2
  FALLBACK=true
else
  # Check if model is available
  if ! ollama list 2>/dev/null | awk '{print $1}' | grep -qx "${MODEL}"; then
    echo "⚠️  Model '$MODEL' not found locally." >&2
    echo "   Run: ollama pull $MODEL" >&2
    echo "   Falling back to heuristic commit message generation." >&2
    FALLBACK=true
  else
    FALLBACK=false
  fi
fi

# Get the staged diff (or all changes if nothing staged)
DIFF=$(git diff --cached --stat 2>/dev/null || true)
if [ -z "$DIFF" ]; then
  DIFF=$(git diff --stat 2>/dev/null || true)
fi
if [ -z "$DIFF" ]; then
  echo "chore: no changes detected"
  exit 0
fi

# Get detailed diff for the model
DETAILED_DIFF=$(git diff --cached 2>/dev/null || git diff 2>/dev/null || true)
# Truncate if too long (max ~8k tokens for tiny model)
MAX_DIFF_CHARS=15000
if [ "${#DETAILED_DIFF}" -gt "$MAX_DIFF_CHARS" ]; then
  DETAILED_DIFF="${DETAILED_DIFF:0:$MAX_DIFF_CHARS}\n... (diff truncated)"
fi

# Heuristic fallback: infer type and scope from changed files
heuristic_commit() {
  local files="$1"
  local type="chore"
  local scope=""
  local subject=""

  # Detect type from file patterns
  if echo "$files" | grep -qE "test\.(ts|tsx|js|jsx)"; then
    type="test"
  elif echo "$files" | grep -qE "\.md$"; then
    type="docs"
  elif echo "$files" | grep -qE "package\.json|pnpm-lock|tsconfig"; then
    type="chore"
  elif echo "$files" | grep -qE "ci\.yml|workflow|lefthook"; then
    type="ci"
  elif echo "$files" | grep -qE "schema\.surql|wiki|llm-wiki"; then
    type="wiki"
  elif echo "$files" | grep -qE "\.ts$|\.tsx$|\.js$|\.jsx$"; then
    type="feat"
    if echo "$files" | grep -qE "fix|bug|patch"; then
      type="fix"
    fi
  fi

  # Detect scope from directory
  if echo "$files" | grep -q "packages/mem-brain"; then
    scope="mem-brain"
  elif echo "$files" | grep -q "packages/surreal"; then
    scope="surreal"
  elif echo "$files" | grep -q "packages/honcho"; then
    scope="honcho"
  elif echo "$files" | grep -q "packages/agent-core"; then
    scope="agent-core"
  elif echo "$files" | grep -q "packages/vault-tools"; then
    scope="vault-tools"
  elif echo "$files" | grep -q "apps/router"; then
    scope="router"
  elif echo "$files" | grep -q "apps/oracle"; then
    scope="oracle"
  elif echo "$files" | grep -q "apps/membrane"; then
    scope="membrane"
  elif echo "$files" | grep -q "apps/librarian"; then
    scope="librarian"
  elif echo "$files" | grep -q "apps/telos"; then
    scope="telos"
  elif echo "$files" | grep -q "apps/contracts"; then
    scope="contracts"
  elif echo "$files" | grep -q "\.github"; then
    scope="ci"
  fi

  # Generate subject from file changes
  local file_count
  file_count=$(echo "$files" | wc -l | tr -d ' ')
  local first_file
  first_file=$(echo "$files" | head -1 | awk '{print $1}')
  local basename
  basename=$(basename "$first_file" 2>/dev/null || echo "files")

  if [ "$file_count" -eq 1 ]; then
    subject="update $basename"
  elif [ "$file_count" -le 3 ]; then
    subject="update $basename and related files"
  else
    subject="batch updates across $file_count files"
  fi

  # Detect refactor patterns
  if echo "$DETAILED_DIFF" | grep -qE "^\-.*\+" && echo "$DETAILED_DIFF" | grep -qE "^\+.*\-"; then
    if echo "$DETAILED_DIFF" | grep -qE "function|class|interface|type "; then
      type="refactor"
      subject="refactor $basename"
    fi
  fi

  if [ -n "$scope" ]; then
    echo "${type}(${scope}): ${subject}"
  else
    echo "${type}: ${subject}"
  fi
}

# SLM-based commit generation
slm_commit() {
  # Build a simpler, more focused prompt for tiny models
  local file_list
  file_list=$(echo "$DIFF" | head -30)

  local prompt="Generate a git commit message in this exact format:
type(scope): brief description

Rules:
- type must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, wiki, agent
- scope is the package name like: mem-brain, router, surreal, honcho, agent-core, vault-tools, ci
- description is short, imperative, lowercase, no period
- ONLY output the commit message, nothing else

Changed files:
${file_list}

Commit message:"

  local response
  # Use --nowordwrap and shorter context for tiny models
  response=$(printf '%s' "$prompt" | ollama run "$MODEL" --nowordwrap 2>/dev/null || echo "")

  # Aggressive cleanup for tiny model output: remove ANSI codes, newlines, trim
  response=$(printf '%s' "$response" | sed 's/\x1B\[[0-9;]*[A-Za-z]//g' | tr '\n\r' ' ' | sed 's/  */ /g')
  response=$(printf '%s' "$response" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  response=$(printf '%s' "$response" | sed "s/^[\"\'\`]*//;s/[\"\'\`]*$//")

  # Validate format
  if printf '%s' "$response" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|wiki|telos|agent)(\([a-z0-9_-]+\))?: .{3,100}$"; then
    printf '%s\n' "$response"
  else
    echo "⚠️  SLM returned invalid format, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
  fi
}

# Main
if [ "$DRY_RUN" = true ]; then
  echo "=== Diff stat ==="
  echo "$DIFF"
  echo ""
  echo "=== Generated message ==="
fi

if [ "${FALLBACK:-true}" = true ]; then
  heuristic_commit "$DIFF"
else
  slm_commit
fi
