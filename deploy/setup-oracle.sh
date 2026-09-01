#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/setup-oracle.sh"
  exit 1
fi

echo "==> Installing Docker..."
apt-get update
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker

if id -u ubuntu >/dev/null 2>&1; then
  usermod -aG docker ubuntu
fi

echo "==> Docker installed."
docker --version
docker compose version

echo
echo "Next steps:"
echo "1. Clone the repo (or pull latest changes)."
echo "2. Copy .env.production.example to .env and fill in secrets + domain."
echo "3. Run: docker compose -f docker-compose.prod.yml up -d --build"
echo "4. Seed once: docker compose -f docker-compose.prod.yml exec backend uv run python scripts_seed.py"
