#!/bin/bash
# setup-slm.sh — Universal SLM installer for AI commit messages
# Zero external dependencies. Auto-detects OS/arch and installs the best backend:
#   • MLX         → macOS arm64 (native Metal GPU, fastest)
#   • llama.cpp   → All platforms (pip install, auto-optimizes for Metal/AVX2)
#   • llamafile   → Universal single-binary fallback (no Python needed)
#
# Usage: ./scripts/automation/setup-slm.sh [--backend mlx|llamacpp|llamafile] [--model MODEL] [--force]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SLM_DIR="${SCRIPT_DIR}/.slm"
MODEL_DIR="${SLM_DIR}/models"
VENV_DIR="${SLM_DIR}/venv"

FORCE=false
BACKEND_ARG=""
MODEL_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend)
      BACKEND_ARG="$2"
      shift 2
      ;;
    --model)
      MODEL_ARG="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--backend mlx|llamacpp|llamafile] [--model MODEL] [--force]"
      exit 1
      ;;
  esac
done

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${BLUE}▶ $1${NC}"; }
ok()    { echo -e "${GREEN}✓ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠ $1${NC}"; }
err()   { echo -e "${RED}✗ $1${NC}"; }

# ── Platform Detection ───────────────────────────────────────────────────────

detect_platform() {
  local os arch
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)
  case "$os" in
    linux)
      case "$arch" in
        x86_64)  echo "linux-amd64" ;;
        aarch64) echo "linux-arm64" ;;
        *)       echo "unsupported" ;;
      esac
      ;;
    darwin)
      case "$arch" in
        x86_64)  echo "macos-intel" ;;
        arm64)   echo "macos-arm64" ;;
        *)       echo "unsupported" ;;
      esac
      ;;
    mingw*|msys*|cygwin*)
      echo "windows-amd64"
      ;;
    *)
      echo "unsupported"
      ;;
  esac
}

PLATFORM=$(detect_platform)
[ "$PLATFORM" = "unsupported" ] && { err "Unsupported platform: $(uname -s) $(uname -m)"; exit 1; }
info "Detected platform: $PLATFORM"

# ── Backend Selection ────────────────────────────────────────────────────────

# macOS arm64 → MLX (native Metal, no Python compilation)
# All others  → llama.cpp (pip wheel, auto-optimizes)
# Opt-in      → llamafile (single binary)

determine_backend() {
  if [ -n "$BACKEND_ARG" ]; then
    echo "$BACKEND_ARG"
    return
  fi

  case "$PLATFORM" in
    macos-arm64)
      echo "mlx"
      ;;
    *)
      echo "llamacpp"
      ;;
  esac
}

BACKEND=$(determine_backend)
info "Selected backend: $BACKEND"

# ── Model Selection ──────────────────────────────────────────────────────────

# Default models per backend
case "$BACKEND" in
  mlx)
    DEFAULT_MODEL="mlx-community/Qwen3.5-0.8B-OptiQ-4bit"
    ;;
  llamacpp|llamafile)
    DEFAULT_MODEL="unsloth/Qwen3.5-0.8B-Q4_K_M.gguf"
    ;;
esac

MODEL="${MODEL_ARG:-$DEFAULT_MODEL}"

# Model metadata
GGUF_URL="https://huggingface.co/unsloth/Qwen3.5-0.8B-GGUF/resolve/main/Qwen3.5-0.8B-Q4_K_M.gguf"
GGUF_NAME="Qwen3.5-0.8B-Q4_K_M.gguf"
GGUF_SIZE_MB="450"

# ── Python Setup ─────────────────────────────────────────────────────────────

PYTHON_CMD=""

find_python() {
  for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then
      PYTHON_CMD="$cmd"
      return 0
    fi
  done
  return 1
}

setup_venv() {
  if [ -d "$VENV_DIR" ] && [ "$FORCE" = false ]; then
    ok "Virtual environment exists: ${VENV_DIR}"
    return 0
  fi

  if ! find_python; then
    err "Python 3 is required but not installed."
    err "Install Python 3.9+ and try again: https://python.org/downloads"
    exit 1
  fi

  local py_version
  py_version=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
  info "Python version: $py_version"

  info "Creating Python virtual environment..."
  $PYTHON_CMD -m venv "$VENV_DIR"
  ok "Virtual environment created"
}

# ── Backend Installation ─────────────────────────────────────────────────────

install_mlx() {
  local pip="${VENV_DIR}/bin/pip"
  info "Installing MLX and mlx-lm (Apple Silicon Metal)..."
  "$pip" install --quiet --upgrade pip
  "$pip" install --quiet mlx mlx-lm
  ok "MLX packages installed"
}

install_llamacpp_python() {
  local pip="${VENV_DIR}/bin/pip"
  info "Installing llama-cpp-python (platform-optimized)..."
  "$pip" install --quiet --upgrade pip

  # CMAKE_ARGS tell llama.cpp which acceleration to compile with:
  # - DLLAMA_METAL=ON  → Apple Silicon GPU
  # - DLLAMA_AVX2=ON   → x86_64 SIMD
  # llama-cpp-python ships prebuilt wheels for common platforms,
  # so this usually downloads a wheel — no compilation needed.
  CMAKE_ARGS="-DLLAMA_METAL=ON -DLLAMA_AVX2=ON" \
    "$pip" install --quiet llama-cpp-python

  ok "llama-cpp-python installed"
}

install_llamafile() {
  local llamafile_dir="${SLM_DIR}/llamafile"
  local llamafile_bin="${llamafile_dir}/llamafile"

  if [ -f "$llamafile_bin" ] && [ "$FORCE" = false ]; then
    ok "llamafile already exists: ${llamafile_bin}"
    return 0
  fi

  mkdir -p "$llamafile_dir"
  info "Downloading llamafile (universal binary)..."

  local tag
  tag=$(curl -sL "https://api.github.com/repos/mozilla-ai/llamafile/releases/latest" | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('tag_name','0.10.1'))")

  local url="https://github.com/mozilla-ai/llamafile/releases/download/${tag}/llamafile-${tag}"
  info "Source: ${url}"

  if command -v curl &>/dev/null; then
    curl -fsSL --progress-bar "$url" -o "$llamafile_bin"
  elif command -v wget &>/dev/null; then
    wget -q --show-progress "$url" -O "$llamafile_bin"
  else
    err "curl or wget required for download"; exit 1
  fi

  chmod +x "$llamafile_bin"
  ok "llamafile downloaded to ${llamafile_bin}"
}

# ── Model Download ───────────────────────────────────────────────────────────

download_gguf_model() {
  local model_path="${MODEL_DIR}/${GGUF_NAME}"

  if [ -f "$model_path" ] && [ "$FORCE" = false ]; then
    ok "Model already exists: ${GGUF_NAME}"
    return 0
  fi

  info "Downloading ${GGUF_NAME} (~${GGUF_SIZE_MB}MB)..."
  info "Source: Hugging Face (unsloth/Qwen3.5-0.8B-GGUF)"

  if command -v curl &>/dev/null; then
    curl -fsSL --progress-bar "$GGUF_URL" -o "$model_path"
  elif command -v wget &>/dev/null; then
    wget -q --show-progress "$GGUF_URL" -O "$model_path"
  else
    err "curl or wget required for download"; exit 1
  fi

  ok "Model downloaded to ${model_path}"
}

# ── Verification ─────────────────────────────────────────────────────────────

verify_mlx() {
  local python="${VENV_DIR}/bin/python"
  if "$python" -c "import mlx_lm" 2>/dev/null; then
    ok "mlx-lm import successful"
  else
    err "mlx-lm import failed"; return 1
  fi
}

verify_llamacpp() {
  local python="${VENV_DIR}/bin/python"
  if "$python" -c "from llama_cpp import Llama" 2>/dev/null; then
    ok "llama-cpp-python import successful"
  else
    err "llama-cpp-python import failed"; return 1
  fi
}

verify_llamafile() {
  local bin="${SLM_DIR}/llamafile/llamafile"
  [ -f "$bin" ] && [ -x "$bin" ] && ok "llamafile binary verified" || { err "llamafile binary not found"; return 1; }
}

# ── Metadata ─────────────────────────────────────────────────────────────────

write_metadata() {
  local model_path=""
  case "$BACKEND" in
    mlx)
      model_path="${MODEL}"
      ;;
    llamacpp|llamafile)
      model_path="${MODEL_DIR}/${GGUF_NAME}"
      ;;
  esac

  cat > "${SLM_DIR}/backend.json" << EOF
{
  "platform": "${PLATFORM}",
  "backend": "${BACKEND}",
  "python": "${PYTHON_CMD}",
  "venv": "${VENV_DIR}",
  "model": "${model_path}",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  ok "Metadata written to ${SLM_DIR}/backend.json"
}

# ── Main ─────────────────────────────────────────────────────────────────────

main() {
  info "Setting up local SLM for AI commit messages..."
  info "Install dir: ${SLM_DIR}"
  info "Backend: ${BACKEND}"
  info "Model: ${MODEL}"

  mkdir -p "$MODEL_DIR"

  case "$BACKEND" in
    mlx)
      setup_venv
      install_mlx
      verify_mlx
      write_metadata
      ok "SLM setup complete!"
      ok "Backend: MLX (macOS Metal)"
      ok "Model: ${MODEL}"
      ;;
    llamacpp)
      setup_venv
      install_llamacpp_python
      download_gguf_model
      verify_llamacpp
      write_metadata
      ok "SLM setup complete!"
      ok "Backend: llama-cpp-python (${PLATFORM})"
      ok "Model: ${GGUF_NAME}"
      ;;
    llamafile)
      download_gguf_model
      install_llamafile
      verify_llamafile
      write_metadata
      ok "SLM setup complete!"
      ok "Backend: llamafile (universal)"
      ok "Model: ${GGUF_NAME}"
      ;;
    *)
      err "Unknown backend: ${BACKEND}"
      err "Valid backends: mlx, llamacpp, llamafile"
      exit 1
      ;;
  esac

  echo ""
  info "Run: ./scripts/automation/generate-commit-msg.sh [--dry-run]"
}

main "$@"
