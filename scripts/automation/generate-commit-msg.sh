#!/bin/bash
# Generate conventional commit message from staged diff using a local SLM
# shellcheck disable=SC2059,SC2001
# Supports: Ollama → Python backend (mlx-lm / llama-cpp) → heuristic fallback
# Auto-installs Python backend on first run if Ollama is unavailable
# Usage: ./scripts/automation/generate-commit-msg.sh [--model MODEL] [--dry-run]
# Output: writes commit message to stdout (for use by git or cz-git)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

SLM_DIR="${SCRIPT_DIR}/.slm"
MODEL_PATH="${SLM_DIR}/models/qwen2.5-0.5b-instruct-q4_k_m.gguf"
BACKEND_JSON="${SLM_DIR}/backend.json"
VENV_DIR="${SLM_DIR}/venv"

MODEL="${OLLAMA_MODEL:-qwen2.5:0.5b}"

# Known scopes for this monorepo
VALID_SCOPES="mem-brain router surreal honcho agent-core vault-tools oracle membrane librarian telos contracts ci docs test packages apps scripts automation design-tokens tsconfig monorepo"
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

# ── Backend Detection ────────────────────────────────────────────────────────

BACKEND="heuristic"

# 1. Check Ollama
if command -v ollama &>/dev/null; then
  if ollama list 2>/dev/null | awk '{print $1}' | grep -qx "${MODEL}"; then
    BACKEND="ollama"
  fi
fi

# 2. Check local Python backend
if [ "$BACKEND" = "heuristic" ] && [ -f "$BACKEND_JSON" ] && [ -f "$MODEL_PATH" ]; then
  BACKEND=$(cat "$BACKEND_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('backend','heuristic'))" 2>/dev/null || echo "heuristic")
  if [ "$BACKEND" != "mlx" ] && [ "$BACKEND" != "llama-cpp" ]; then
    BACKEND="heuristic"
  fi
fi

# 3. Auto-install Python backend if neither Ollama nor local backend available
if [ "$BACKEND" = "heuristic" ]; then
  echo "🔧 No SLM backend found. Auto-installing Python backend..." >&2
  if "${SCRIPT_DIR}/setup-slm.sh" 2>/dev/null; then
    if [ -f "$BACKEND_JSON" ]; then
      BACKEND=$(cat "$BACKEND_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('backend','heuristic'))" 2>/dev/null || echo "heuristic")
    fi
  else
    echo "   Auto-install failed. Using heuristic fallback." >&2
    BACKEND="heuristic"
  fi
fi

# ── Scope Validation ─────────────────────────────────────────────────────────

validate_scope() {
  local msg="$1"
  local scope
  scope=$(printf '%s' "$msg" | sed -n 's/^[^(]*(\([a-z0-9_-]*\)): .*/\1/p')

  if [ -z "$scope" ]; then
    printf '%s\n' "$msg"
    return
  fi

  if echo " $VALID_SCOPES " | grep -q " $scope "; then
    printf '%s\n' "$msg"
    return
  fi

  # Normalize unknown scope to empty (no scope)
  printf '%s\n' "$msg" | sed "s/(\${scope}): /: /"
}

# ── Diff Extraction ──────────────────────────────────────────────────────────

DIFF=$(git diff --cached --stat 2>/dev/null || true)
if [ -z "$DIFF" ]; then
  DIFF=$(git diff --stat 2>/dev/null || true)
fi
if [ -z "$DIFF" ]; then
  echo "chore: no changes detected"
  exit 0
fi

DETAILED_DIFF=$(git diff --cached 2>/dev/null || git diff 2>/dev/null || true)
MAX_DIFF_CHARS=6000
if [ "${#DETAILED_DIFF}" -gt "$MAX_DIFF_CHARS" ]; then
  DETAILED_DIFF="${DETAILED_DIFF:0:$MAX_DIFF_CHARS}"
fi

# ── Heuristic Fallback ───────────────────────────────────────────────────────

heuristic_commit() {
  local files="$1"
  local type="chore"
  local scope=""
  local subject=""

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

  if [ -n "$scope" ]; then
    echo "${type}(${scope}): ${subject}"
  else
    echo "${type}: ${subject}"
  fi
}

# ── Ollama Backend ───────────────────────────────────────────────────────────

ollama_commit() {
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
  response=$(printf '%s' "$prompt" | ollama run "$MODEL" --nowordwrap 2>/dev/null || echo "")

  # Extract the first line matching conventional commit format
  local extracted
  extracted=$(printf '%s' "$response" | grep -m1 -E "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|wiki|telos|agent)(\([a-z0-9_-]+\))?: .{3,100}$" 2>/dev/null || echo "")

  if [ -n "$extracted" ]; then
    # Strip trailing period if present
    extracted=$(printf '%s' "$extracted" | sed 's/\.$//')
    validate_scope "$extracted"
  else
    echo "⚠️  Ollama returned invalid format, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
  fi
}

# ── Python Backend (mlx-lm / llama-cpp) ─────────────────────────────────────

python_backend_commit() {
  local python="${VENV_DIR}/bin/python"
  if [ ! -f "$python" ]; then
    python="${VENV_DIR}/Scripts/python.exe"
  fi

  if [ ! -f "$python" ]; then
    echo "⚠️  Python venv not found, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
    return
  fi

  local file_list
  file_list=$(echo "$DIFF" | head -25)

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

  local response=""

  case "$BACKEND" in
    mlx)
      response=$("$python" -m mlx_lm.generate \
        --model "${MODEL_PATH}" \
        --prompt "$prompt" \
        --max-tokens 50 \
        --temp 0.2 \
        --top-p 0.9 2>/dev/null || echo "")
      ;;
    llama-cpp)
      response=$("$python" << PYEOF
from llama_cpp import Llama
import sys

llm = Llama(
    model_path="${MODEL_PATH}",
    n_ctx=2048,
    verbose=False
)
output = llm(
    """${prompt}""",
    max_tokens=50,
    temperature=0.2,
    top_p=0.9,
    stop=["\n"]
)
print(output["choices"][0]["text"], end="")
PYEOF
      )
      ;;
  esac

  # Extract the first line matching conventional commit format
  local extracted
  extracted=$(printf '%s' "$response" | grep -m1 -E "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|wiki|telos|agent)(\([a-z0-9_-]+\))?: .{3,100}$" 2>/dev/null || echo "")

  if [ -n "$extracted" ]; then
    # Strip trailing period if present
    extracted=$(printf '%s' "$extracted" | sed 's/\.$//')
    validate_scope "$extracted"
  else
    echo "⚠️  Python backend returned invalid format, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
  fi
}

# ── Main ─────────────────────────────────────────────────────────────────────

if [ "$DRY_RUN" = true ]; then
  echo "=== Backend: $BACKEND ==="
  echo "=== Diff stat ==="
  echo "$DIFF"
  echo ""
  echo "=== Generated message ==="
fi

case "$BACKEND" in
  ollama)
    ollama_commit
    ;;
  mlx|llama-cpp)
    python_backend_commit
    ;;
  heuristic)
    heuristic_commit "$DIFF"
    ;;
  *)
    heuristic_commit "$DIFF"
    ;;
esac
