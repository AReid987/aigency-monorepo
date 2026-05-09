#!/bin/bash
# Generate conventional commit message from staged diff using a local SLM
# Backends (in priority order): MLX (macOS arm64) → llama-cpp-python → llamafile → heuristic
# Auto-installs the best backend on first run. Zero manual dependencies.
# Usage: ./scripts/automation/generate-commit-msg.sh [--dry-run]
# Output: writes commit message to stdout (for use by git prepare-commit-msg hook)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

SLM_DIR="${SCRIPT_DIR}/.slm"
BACKEND_JSON="${SLM_DIR}/backend.json"
VENV_DIR="${SLM_DIR}/venv"
LLAMAFILE_BIN="${SLM_DIR}/llamafile/llamafile"

DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Known scopes for this monorepo
VALID_SCOPES="mem-brain router surreal honcho agent-core vault-tools oracle membrane librarian telos contracts ci docs test packages apps scripts automation design-tokens tsconfig monorepo"

# ── Backend Detection ────────────────────────────────────────────────────────

BACKEND="heuristic"

# 1. Read from backend.json if it exists
if [ -f "$BACKEND_JSON" ]; then
  DETECTED=$(python3 -c "import sys,json; print(json.load(sys.stdin).get('backend','heuristic'))" < "$BACKEND_JSON" 2>/dev/null || echo "heuristic")
  case "$DETECTED" in
    mlx|llamacpp|llamafile)
      BACKEND="$DETECTED"
      ;;
  esac
fi

# 2. If nothing configured, auto-install
if [ "$BACKEND" = "heuristic" ]; then
  echo "🔧 No SLM backend found. Auto-installing (one-time)..." >&2
  if "${SCRIPT_DIR}/setup-slm.sh" 2>/dev/null; then
    if [ -f "$BACKEND_JSON" ]; then
      DETECTED=$(python3 -c "import sys,json; print(json.load(sys.stdin).get('backend','heuristic'))" < "$BACKEND_JSON" 2>/dev/null || echo "heuristic")
      case "$DETECTED" in
        mlx|llamacpp|llamafile)
          BACKEND="$DETECTED"
          ;;
      esac
    fi
  else
    echo "   Auto-install failed. Using heuristic fallback." >&2
    BACKEND="heuristic"
  fi
fi

# ── Diff Extraction ──────────────────────────────────────────────────────────

DIFF=$(git diff --cached --stat 2>/dev/null || true)
if [ -z "$DIFF" ]; then
  DIFF=$(git diff --stat 2>/dev/null || true)
fi
if [ -z "$DIFF" ]; then
  echo "chore: no changes detected"
  exit 0
fi

FILE_LIST=$(git diff --cached --name-only 2>/dev/null | head -40)
if [ -z "$FILE_LIST" ]; then
  FILE_LIST=$(git diff --name-only 2>/dev/null | head -40)
fi

# ── Heuristic Fallback ───────────────────────────────────────────────────────

heuristic_commit() {
  local files="$1"
  local type="chore"
  local scope=""

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
    if echo "$files" | grep -qiE "fix|bug|patch"; then
      type="fix"
    fi
  fi

  if echo "$files" | grep -q "packages/mem-brain"; then scope="mem-brain"
  elif echo "$files" | grep -q "packages/surreal"; then scope="surreal"
  elif echo "$files" | grep -q "packages/honcho"; then scope="honcho"
  elif echo "$files" | grep -q "packages/agent-core"; then scope="agent-core"
  elif echo "$files" | grep -q "packages/vault-tools"; then scope="vault-tools"
  elif echo "$files" | grep -q "apps/router"; then scope="router"
  elif echo "$files" | grep -q "apps/oracle"; then scope="oracle"
  elif echo "$files" | grep -q "apps/membrane"; then scope="membrane"
  elif echo "$files" | grep -q "apps/librarian"; then scope="librarian"
  elif echo "$files" | grep -q "apps/telos"; then scope="telos"
  elif echo "$files" | grep -q "apps/contracts"; then scope="contracts"
  elif echo "$files" | grep -q "\.github"; then scope="ci"
  fi

  local file_count basename subject
  file_count=$(echo "$files" | grep -c . | tr -d ' ')
  basename=$(echo "$files" | head -1 | xargs basename 2>/dev/null || echo "files")

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

# ── Scope Validation ─────────────────────────────────────────────────────────

validate_scope() {
  local msg="$1"
  local scope
  scope=$(printf '%s' "$msg" | sed -n 's/^[^(]*(\([a-z0-9_-]*\)): .*/\1/p')

  [ -z "$scope" ] && { printf '%s\n' "$msg"; return; }
  if echo " $VALID_SCOPES " | grep -q " $scope "; then
    printf '%s\n' "$msg"
    return
  fi
  # Unknown scope — strip it
  printf '%s\n' "$msg" | sed "s/(\${scope}): /: /"
}

# ── Response Cleaning ────────────────────────────────────────────────────────

capitalize_subject() {
  local msg="$1"
  # Capitalize first letter of the subject (after the colon)
  # macOS sed doesn't support \u, so we use perl
  printf '%s' "$msg" | perl -pe 's/^((feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|wiki|telos|agent)(\([a-z0-9_-]+\))?: )([a-zA-Z])(.*)$/$1\u$4$5/'
}

clean_response() {
  local response="$1"
  # Extract first conventional commit line
  local extracted
  extracted=$(printf '%s' "$response" | grep -m1 -E \
    "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|wiki|telos|agent)(\([a-z0-9_-]+\))?: .{3,100}$" 2>/dev/null || echo "")

  if [ -n "$extracted" ]; then
    # Strip trailing period if present
    extracted=$(printf '%s' "$extracted" | sed 's/\.$//')
    extracted=$(capitalize_subject "$extracted")
    validate_scope "$extracted"
  else
    echo ""
  fi
}

# ── Prompt Builder ───────────────────────────────────────────────────────────

build_prompt_text() {
  local files="$1"
  cat << EOF
Write ONE git commit message for these changes.

Format: type(scope): brief description
Type must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore
Description: imperative, no period, max 10 words. First word capitalized.
Only output the commit message, nothing else.

Changed files:
${files}
EOF
}

# ── MLX Backend (macOS arm64) ────────────────────────────────────────────────

mlx_commit() {
  local python="${VENV_DIR}/bin/python"
  if [ ! -f "$python" ]; then
    echo "⚠️  Python venv not found, using heuristic" >&2
    heuristic_commit "$FILE_LIST"
    return
  fi

  local mlx_model
  mlx_model=$(python3 -c "import sys,json; print(json.load(sys.stdin).get('model',''))" < "$BACKEND_JSON" 2>/dev/null || echo "")

  if [ -z "$mlx_model" ]; then
    echo "⚠️  MLX model not configured, using heuristic" >&2
    heuristic_commit "$FILE_LIST"
    return
  fi

  local prompt
  prompt=$(build_prompt_text "$FILE_LIST")

  # Write Python script to temp file to avoid heredoc quoting issues
  local pyscript
  pyscript=$(mktemp)
  cat > "$pyscript" << PYEOF
import re
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler

model, tokenizer = load("${mlx_model}")

prompt = """${prompt}"""

sampler = make_sampler(temp=0.05)
response = generate(
    model, tokenizer,
    prompt=prompt,
    max_tokens=20,
    verbose=False,
    sampler=sampler
)

response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
print(response.strip())
PYEOF

  # Try inference up to 2 times (MLX models sometimes need warmup)
  local result="" attempt
  for attempt in 1 2; do
    result=$("$python" "$pyscript" 2>/dev/null || echo "")
    local cleaned
    cleaned=$(clean_response "$result")
    if [ -n "$cleaned" ]; then
      rm -f "$pyscript"
      printf '%s\n' "$cleaned"
      return
    fi
  done

  rm -f "$pyscript"
  echo "⚠️  MLX returned invalid format, using heuristic" >&2
  heuristic_commit "$FILE_LIST"
}

# ── llama-cpp-python Backend ─────────────────────────────────────────────────

llamacpp_commit() {
  local python="${VENV_DIR}/bin/python"
  if [ ! -f "$python" ]; then
    echo "⚠️  Python venv not found, using heuristic" >&2
    heuristic_commit "$FILE_LIST"
    return
  fi

  local model_path
  model_path=$(python3 -c "import sys,json; print(json.load(sys.stdin).get('model',''))" < "$BACKEND_JSON" 2>/dev/null || echo "")

  if [ -z "$model_path" ] || [ ! -f "$model_path" ]; then
    echo "⚠️  GGUF model not found, using heuristic" >&2
    heuristic_commit "$FILE_LIST"
    return
  fi

  local prompt
  prompt=$(build_prompt_text "$FILE_LIST")

  # Write Python script to temp file to avoid heredoc quoting issues
  local pyscript
  pyscript=$(mktemp)
  cat > "$pyscript" << PYEOF
from llama_cpp import Llama

llm = Llama(
    model_path="${model_path}",
    n_ctx=2048,
    verbose=False
)

output = llm.create_chat_completion(
    messages=[
        {"role": "system", "content": "You write git commit messages."},
        {"role": "user", "content": """${prompt}"""}
    ],
    max_tokens=25,
    temperature=0.2,
    stop=["\n", "Here", "The", "This", "Commit"]
)

text = output["choices"][0]["message"]["content"]
print(text.strip())
PYEOF

  # Try inference up to 2 times (first load can be slow/empty)
  local result="" attempt
  for attempt in 1 2; do
    result=$("$python" "$pyscript" 2>/dev/null || echo "")
    local cleaned
    cleaned=$(clean_response "$result")
    if [ -n "$cleaned" ]; then
      rm -f "$pyscript"
      printf '%s\n' "$cleaned"
      return
    fi
  done

  rm -f "$pyscript"
  echo "⚠️  llama-cpp returned invalid format, using heuristic" >&2
  heuristic_commit "$FILE_LIST"
}

# ── llamafile Backend ────────────────────────────────────────────────────────

llamafile_commit() {
  if [ ! -f "$LLAMAFILE_BIN" ]; then
    echo "⚠️  llamafile not found, using heuristic" >&2
    heuristic_commit "$FILE_LIST"
    return
  fi

  local model_path
  model_path=$(python3 -c "import sys,json; print(json.load(sys.stdin).get('model',''))" < "$BACKEND_JSON" 2>/dev/null || echo "")

  if [ -z "$model_path" ] || [ ! -f "$model_path" ]; then
    echo "⚠️  GGUF model not found, using heuristic" >&2
    heuristic_commit "$FILE_LIST"
    return
  fi

  local prompt
  prompt=$(build_prompt_text "$FILE_LIST")

  local result
  result=$("$LLAMAFILE_BIN" \
    -m "$model_path" \
    -p "$prompt" \
    -n 25 \
    --temp 0.2 \
    --no-display-prompt 2>/dev/null || echo "")

  local cleaned
  cleaned=$(clean_response "$result")

  if [ -n "$cleaned" ]; then
    printf '%s\n' "$cleaned"
  else
    echo "⚠️  llamafile returned invalid format, using heuristic" >&2
    heuristic_commit "$FILE_LIST"
  fi
}

# ── Main ─────────────────────────────────────────────────────────────────────

if [ "$DRY_RUN" = true ]; then
  echo "=== Backend: $BACKEND ==="
  echo "=== File list ==="
  echo "$FILE_LIST"
  echo ""
  echo "=== Generated message ==="
fi

case "$BACKEND" in
  mlx)
    mlx_commit
    ;;
  llamacpp)
    llamacpp_commit
    ;;
  llamafile)
    llamafile_commit
    ;;
  heuristic)
    heuristic_commit "$FILE_LIST"
    ;;
  *)
    heuristic_commit "$FILE_LIST"
    ;;
esac
