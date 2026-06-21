#!/bin/bash
set -euo pipefail

DOCKER_VERSION=27.5.1
DOCKER_COMPOSE_VERSION=2.35.0
ARCH=x86_64

# Map Docker's architecture names to Compose's convention.
case "$(uname -m)" in
  x86_64) ARCH=x86_64 ;;
  aarch64) ARCH=aarch64 ;;
  *) echo "Unsupported architecture: $(uname -m)"; exit 1 ;;
esac

echo "=== Installing Docker CLI ==="
curl -fsSL "https://download.docker.com/linux/static/stable/${ARCH}/docker-${DOCKER_VERSION}.tgz" -o /tmp/docker.tgz
curl -fsSL "https://download.docker.com/linux/static/stable/${ARCH}/docker-${DOCKER_VERSION}.tgz.sha256" -o /tmp/docker.tgz.sha256
cd /tmp
sha256sum -c docker.tgz.sha256
tar xzf docker.tgz
cp /tmp/docker/docker /usr/local/bin/docker
chmod +x /usr/local/bin/docker
rm -rf /tmp/docker /tmp/docker.tgz /tmp/docker.tgz.sha256

echo "=== Installing Docker Compose ==="
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo "=== Starting Docker daemon ==="
dockerd &>/var/log/dockerd.log &

# Poll until the daemon is reachable instead of a fixed sleep.
echo "=== Waiting for Docker daemon ==="
timeout=30
while [ "$timeout" -gt 0 ]; do
  if docker info --format '{{.ServerVersion}}' &>/dev/null; then
    break
  fi
  sleep 1
  timeout=$((timeout - 1))
done

if [ "$timeout" -eq 0 ]; then
  echo "Docker daemon failed to start"
  exit 1
fi

echo "=== Verifying ==="
docker --version
docker compose version
docker info --format '{{.ServerVersion}}'

echo "=== Done ==="
