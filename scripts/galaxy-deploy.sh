#!/usr/bin/env bash
# Galaxy Oracle Cloud Deployment Script
# Run this ON the Oracle instance after SSH-ing in.
# Usage: ssh -i ~/.ssh/galaxy-oracle ubuntu@<ip> 'bash -s' < scripts/galaxy-deploy.sh

set -euo pipefail

echo "╔══════════════════════════════════════════════════╗"
echo "║  Galaxy VPS Deployment                           ║"
echo "║  Installing: Docker, Tailscale, Hermes, GBrain   ║"
echo "╚══════════════════════════════════════════════════╝"

# ── System update ─────────────────────────────────────────────────────────────
echo ""
echo "▸ Updating system..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

# ── Docker ────────────────────────────────────────────────────────────────────
echo ""
echo "▸ Installing Docker..."
sudo apt-get install -y -qq docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker
echo "  Docker $(docker --version | awk '{print $3}')"

# ── Tailscale ─────────────────────────────────────────────────────────────────
echo ""
echo "▸ Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
echo ""
echo "  ▸ Run: sudo tailscale up"
echo "  ▸ Then authenticate in the browser URL shown."
echo ""

# ── Galaxy directory ──────────────────────────────────────────────────────────
echo "▸ Setting up Galaxy directory..."
mkdir -p ~/galaxy/{shared/{secrets,gbrain,paperclip,canvas,denchclaw,tailscale},ventures}

# ── docker-compose.oracle.yml ─────────────────────────────────────────────────
echo "▸ Writing docker-compose.oracle.yml..."
cat > ~/galaxy/docker-compose.oracle.yml << 'COMPOSE'
version: '3.8'

services:
  gbrain:
    image: garrytan/gbrain:latest
    container_name: galaxy-gbrain
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 6G
    environment:
      - GBRAIN_ENGINE=pglite
      - GBRAIN_DATA_DIR=/brain
      - MCP_SERVER_PORT=50051
      - HTTP_SERVER_PORT=3002
    volumes:
      - ./shared/gbrain:/brain:rw
    ports:
      - "50051:50051"
      - "3002:3002"
    networks:
      - galaxy-internal
    restart: unless-stopped

  paperclip:
    image: paperclipai/paperclip:latest
    container_name: galaxy-paperclip
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 2G
    environment:
      - DATABASE_URL=sqlite:///data/paperclip.db
    volumes:
      - ./shared/paperclip:/data:rw
    ports:
      - "3100:3100"
    networks:
      - galaxy-internal
    restart: unless-stopped

networks:
  galaxy-internal:
    driver: bridge
COMPOSE

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  BASE INSTALL COMPLETE                           ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  Remaining steps (manual):                       ║"
echo "║  1. sudo tailscale up  (authenticate)            ║"
echo "║  2. Add API keys to ~/galaxy/shared/secrets/     ║"
echo "║  3. cd ~/galaxy && docker compose -f              ║"
echo "║     docker-compose.oracle.yml up -d               ║"
echo "║  4. Install Hermes: curl -fsSL                   ║"
echo "║     https://hermes-agent.nousresearch.com/        ║"
echo "║     install.sh | bash                             ║"
echo "║  5. hermes setup --portal                         ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
