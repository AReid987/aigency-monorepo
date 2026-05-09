#!/bin/bash
# Generate conventional commit message from staged diff using a local SLM
# Supports: Ollama → MLX (macOS) → llama-cpp-python → llamafile → heuristic fallback
# Auto-installs Python backend on first run if Ollama is unavailable
# Usage: ./scripts/automation/generate-commit-msg.sh [--model MODEL] [--dry-run]
# Output: writes commit message to stdout (for use by git or cz-git)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

SLM_DIR="${SCRIPT_DIR}/.slm"
GGUF_MODEL="${SLM_DIR}/models/Qwen3.5-0.8B-Q4_K_M.gguf"
BACKEND_JSON="${SLM_DIR}/backend.json"
VENV_DIR="${SLM_DIR}/venv"
LLAMAFILE_BIN="${SLM_DIR}/llamafile/llamafile"

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

# Known scopes for this monorepo
VALID_SCOPES="mem-brain router surreal honcho agent-core vault-tools oracle membrane librarian telos contracts ci docs test packages apps scripts automation design-tokens tsconfig monorepo"

# ── Backend Detection ────────────────────────────────────────────────────────

BACKEND="heuristic"

# 1. Check Ollama
if command -v ollama &>/dev/null; then
  if ollama list 2>/dev/null | awk '{print $1}' | grep -qx "${MODEL}"; then
    BACKEND="ollama"
  fi
fi

# 2. Check local Python backend (mlx or llama-cpp-python)
if [ "$BACKEND" = "heuristic" ] && [ -f "$BACKEND_JSON" ]; then
  DETECTED=$(cat "$BACKEND_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('backend','heuristic'))" 2>/dev/null || echo "heuristic")
  case "$DETECTED" in
    mlx|llamacpp)
      BACKEND="$DETECTED"
      ;;
  esac
fi

# 3. Check llamafile
if [ "$BACKEND" = "heuristic" ] && [ -f "$LLAMAFILE_BIN" ] && [ -f "$GGUF_MODEL" ]; then
  BACKEND="llamafile"
fi

# 4. Auto-install Python backend if nothing available
if [ "$BACKEND" = "heuristic" ]; then
  echo "🔧 No SLM backend found. Auto-installing..." >&2
  if "${SCRIPT_DIR}/setup-slm.sh" 2>/dev/null; then
    if [ -f "$BACKEND_JSON" ]; then
      DETECTED=$(cat "$BACKEND_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('backend','heuristic'))" 2>/dev/null || echo "heuristic")
      case "$DETECTED" in
        mlx|llamacpp)
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

  local subject
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

# ── Prompt Builder ───────────────────────────────────────────────────────────

build_prompt() {
  local file_list
  file_list=$(echo "$DIFF" | head -25)

  cat << EOF
Generate a git commit message in this exact format:
type(scope): brief description

Rules:
- type must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, wiki, agent
- scope is the package name like: mem-brain, router, surreal, honcho, agent-core, vault-tools, ci
- description is short, imperative, lowercase, no period
- ONLY output the commit message, nothing else

Changed files:
${file_list}

Commit message:
EOF
}

# ── Response Cleaning ────────────────────────────────────────────────────────

clean_response() {
  local response="$1"
  # Extract first conventional commit line
  local extracted
  extracted=$(printf '%s' "$response" | grep -m1 -E "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|wiki|telos|agent)(\([a-z0-9_-]+\))?: .{3,100}$" 2>/dev/null || echo "")

  if [ -n "$extracted" ]; then
    # Strip trailing period if present
    extracted=$(printf '%s' "$extracted" | sed 's/\.$//')
    validate_scope "$extracted"
  else
    echo ""
  fi
}

# ── Ollama Backend ───────────────────────────────────────────────────────────

ollama_commit() {
  local prompt
  prompt=$(build_prompt)

  local response
  response=$(printf '%s' "$prompt" | ollama run "$MODEL" --nowordwrap 2>/dev/null || echo "")

  local result
  result=$(clean_response "$response")

  if [ -n "$result" ]; then
    printf '%s\n' "$result"
  else
    echo "⚠️  Ollama returned invalid format, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
  fi
}

# ── MLX Backend (macOS arm64) ───────────────────────────────────────────────

mlx_commit() {
  local python="${VENV_DIR}/bin/python"
  if [ ! -f "$python" ]; then
    echo "⚠️  Python venv not found, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
    return
  fi

  local mlx_model
  mlx_model=$(cat "$BACKEND_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('model',''))" 2>/dev/null || echo "")

  if [ -z "$mlx_model" ]; then
    echo "⚠️  MLX model not configured, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
    return
  fi

  local result
  result=$("$python" 2>/dev/null << PYEOF
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler
import re

model, tokenizer = load("${mlx_model}")

prompt = """You are a commit message generator.

Example 1:
Files: src/router.ts, src/config.ts
Message: feat(router): add config validation

Example 2:
Files: README.md
Message: docs: update installation instructions

Now generate:
$(build_prompt)
Message:"""

sampler = make_sampler(temp=0.1)
response = generate(model, tokenizer, prompt=prompt, max_tokens=15, verbose=False, sampler=sampler)

# Strip <think>...</think> tags (reasoning models)
response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
# Clean up
response = response.strip().strip('"').strip("'")
print(response)
PYEOF
  )

  local cleaned
  cleaned=$(clean_response "$result")

  if [ -n "$cleaned" ]; then
    printf '%s\n' "$cleaned"
  else
    echo "⚠️  MLX returned invalid format, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
  fi
}

# ── llama-cpp-python Backend ────────────────────────────────────────────────

llamacpp_commit() {
  local python="${VENV_DIR}/bin/python"
  if [ ! -f "$python" ]; then
    echo "⚠️  Python venv not found, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
    return
  fi

  if [ ! -f "$GGUF_MODEL" ]; then
    echo "⚠️  GGUF model not found, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
    return
  fi

  local result
  result=$("$python" 2>/dev/null << PYEOF
from llama_cpp import Llama

llm = Llama(
    model_path="${GGUF_MODEL}",
    n_ctx=2048,
    verbose=False
)

output = llm.create_chat_completion(
    messages=[
        {"role": "system", "content": "You generate git commit messages. Only output the commit message in format: type(scope): description. No explanations."},
        {"role": "user", "content": """$(build_prompt)"""}
    ],
    max_tokens=30,
    temperature=0.2,
    stop=["\n"]
)
text = output["choices"][0]["message"]["content"]
text = text.strip().strip('"').strip("'")
print(text)
PYEOF
  )

  local cleaned
  cleaned=$(clean_response "$result")

  if [ -n "$cleaned" ]; then
    printf '%s\n' "$cleaned"
  else
    echo "⚠️  llama-cpp returned invalid format, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
  fi
}

# ── llamafile Backend ───────────────────────────────────────────────────────

llamafile_commit() {
  if [ ! -f "$LLAMAFILE_BIN" ] || [ ! -f "$GGUF_MODEL" ]; then
    echo "⚠️  llamafile not configured, using heuristic fallback" >&2
    heuristic_commit "$DIFF"
    return
  fi

  local prompt
  prompt=$(build_prompt)

  # llamafile uses llama-cli syntax
  local result
  result=$("$LLAMAFILE_BIN" \
    -m "$GGUF_MODEL" \
    -p "$prompt" \
    -n 30 \
    --temp 0.2 \
    --no-display-prompt 2>/dev/null || echo "")

  local cleaned
  cleaned=$(clean_response "$result")

  if [ -n "$cleaned" ]; then
    printf '%s\n' "$cleaned"
  else
    echo "⚠️  llamafile returned invalid format, using heuristic fallback" >&2
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
    heuristic_commit "$DIFF"
    ;;
  *)
    heuristic_commit "$DIFF"
    ;;
esac
