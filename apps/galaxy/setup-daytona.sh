#!/bin/bash
set -euo pipefail

echo "=== Installing Docker CLI ==="
curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-27.5.1.tgz -o /tmp/docker.tgz
tar xzf /tmp/docker.tgz -C /tmp
cp /tmp/docker/docker /usr/local/bin/docker
chmod +x /usr/local/bin/docker
rm -rf /tmp/docker /tmp/docker.tgz

echo "=== Installing Docker Compose ==="
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "=== Starting Docker daemon ==="
dockerd &>/var/log/dockerd.log &
sleep 3

echo "=== Verifying ==="
docker --version
docker compose version
docker info --format '{{.ServerVersion}}' 2>/dev/null || echo "Docker daemon starting..."

echo "=== Done ==="
