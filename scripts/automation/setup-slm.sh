#!/bin/bash
# setup-slm.sh — Universal SLM installer for AI commit messages
# Auto-detects OS/arch and installs the best available Python backend:
#   - Apple Silicon (macOS arm64) → mlx-lm (fastest, Metal GPU)
#   - Intel Mac / Linux / Windows → llama-cpp-python (CPU, cross-platform)
#
# Usage: ./scripts/automation/setup-slm.sh [--force]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SLM_DIR="${SCRIPT_DIR}/.slm"
MODEL_DIR="${SLM_DIR}/models"
VENV_DIR="${SLM_DIR}/venv"

# Default tiny model for commit messages (~350MB GGUF)
# Qwen2.5-0.5B-Instruct Q4_K_M — excellent quality for size
MODEL_URL="https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf"
MODEL_NAME="qwen2.5-0.5b-instruct-q4_k_m.gguf"
MODEL_SIZE_MB="350"

FORCE=false
if [ "${1:-}" = "--force" ]; then
  FORCE=true
fi

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${BLUE}▶ $1${NC}"; }
ok() { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err() { echo -e "${RED}✗ $1${NC}"; }

# Detect OS and architecture
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
if [ "$PLATFORM" = "unsupported" ]; then
  err "Unsupported platform: $(uname -s) $(uname -m)"
  exit 1
fi

info "Detected platform: $PLATFORM"

# Create directories
mkdir -p "$MODEL_DIR"

# Determine backend
BACKEND=""
case "$PLATFORM" in
  macos-arm64)
    BACKEND="mlx"
    ;;
  *)
    BACKEND="llama-cpp"
    ;;
esac

info "Selected backend: $BACKEND"

# Check Python availability
PYTHON_CMD=""
for cmd in python3 python; do
  if command -v "$cmd" &>/dev/null; then
    PYTHON_CMD="$cmd"
    break
  fi
done

if [ -z "$PYTHON_CMD" ]; then
  err "Python 3 is required but not installed."
  err "Install Python 3.9+ and try again: https://python.org/downloads"
  exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
info "Python version: $PYTHON_VERSION"

# Create virtual environment
setup_venv() {
  if [ -d "$VENV_DIR" ] && [ "$FORCE" = false ]; then
    ok "Virtual environment exists: ${VENV_DIR}"
    return 0
  fi

  info "Creating Python virtual environment..."
  $PYTHON_CMD -m venv "$VENV_DIR"
  ok "Virtual environment created"
}

# Install backend packages
install_backend() {
  local pip="${VENV_DIR}/bin/pip"
  if [ ! -f "$pip" ]; then
    pip="${VENV_DIR}/Scripts/pip.exe"
  fi

  info "Installing backend packages (this may take a few minutes)..."

  # Upgrade pip first
  "$pip" install --quiet --upgrade pip setuptools wheel

  case "$BACKEND" in
    mlx)
      info "Installing mlx and mlx-lm (Apple Silicon optimized)..."
      "$pip" install --quiet mlx mlx-lm huggingface-hub
      ;;
    llama-cpp)
      info "Installing llama-cpp-python (CPU backend)..."
      # Use CMAKE_ARGS to enable optimizations
      CMAKE_ARGS="-DLLAMA_AVX2=ON" "$pip" install --quiet llama-cpp-python huggingface-hub
      ;;
  esac

  ok "Backend packages installed"
}

# Download model GGUF
download_model() {
  local model_path="${MODEL_DIR}/${MODEL_NAME}"

  if [ -f "$model_path" ] && [ "$FORCE" = false ]; then
    ok "Model already exists: ${MODEL_NAME}"
    return 0
  fi

  info "Downloading ${MODEL_NAME} (~${MODEL_SIZE_MB}MB)..."
  info "Source: Hugging Face (Qwen2.5-0.5B-Instruct-GGUF)"

  # huggingface-cli is deprecated; use curl/wget directly
  if command -v curl &>/dev/null; then
    curl -fsSL --progress-bar "$MODEL_URL" -o "$model_path"
  elif command -v wget &>/dev/null; then
    wget -q --show-progress "$MODEL_URL" -O "$model_path"
  else
    err "curl or wget required for download"
    exit 1
  fi

  ok "Model downloaded to ${model_path}"
}

# Write backend metadata
write_metadata() {
  cat > "${SLM_DIR}/backend.json" << EOF
{
  "platform": "${PLATFORM}",
  "backend": "${BACKEND}",
  "python": "${PYTHON_CMD}",
  "venv": "${VENV_DIR}",
  "model": "${MODEL_DIR}/${MODEL_NAME}",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  ok "Backend metadata written to ${SLM_DIR}/backend.json"
}

# Verify installation
verify() {
  local python="${VENV_DIR}/bin/python"
  if [ ! -f "$python" ]; then
    python="${VENV_DIR}/Scripts/python.exe"
  fi

  info "Verifying installation..."

  case "$BACKEND" in
    mlx)
      if "$python" -c "import mlx_lm" 2>/dev/null; then
        ok "mlx-lm import successful"
      else
        err "mlx-lm import failed"
        exit 1
      fi
      ;;
    llama-cpp)
      if "$python" -c "from llama_cpp import Llama" 2>/dev/null; then
        ok "llama-cpp-python import successful"
      else
        err "llama-cpp-python import failed"
        exit 1
      fi
      ;;
  esac

  if [ ! -f "${MODEL_DIR}/${MODEL_NAME}" ]; then
    err "Model file missing"
    exit 1
  fi

  ok "Verification passed"
}

# Main
main() {
  info "Setting up local SLM for AI commit messages..."
  info "Install dir: ${SLM_DIR}"

  setup_venv
  install_backend
  download_model
  write_metadata
  verify

  ok "SLM setup complete!"
  ok "Backend: ${BACKEND} (${PLATFORM})"
  ok "Model: ${MODEL_NAME}"
  ok "Run: ./scripts/automation/generate-commit-msg.sh"
}

main "$@"
