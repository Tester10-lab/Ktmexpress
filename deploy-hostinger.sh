#!/bin/bash
# =======================================================
# Ktmexpress Hostinger VPS One-Click Clean Deployment Script
# Domain: kdmexpress.com | IP: 200.141.11.152
# Repository: https://github.com/Tester10-lab/Ktmexpress.git
# =======================================================

set -e

echo "🚀 Starting 100% Clean Hostinger VPS Deployment for Ktmexpress..."

# 1. Stop and completely wipe old Docker containers, images, cache, and volumes
echo "🧹 Wiping old Docker containers, images, and cached build layers..."
docker compose down -v --remove-orphans 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker rmi -f $(docker images -q) 2>/dev/null || true
docker volume prune -f 2>/dev/null || true
docker builder prune -af 2>/dev/null || true
docker system prune -af --volumes 2>/dev/null || true

# Kill any lingering services on ports
fuser -k 80/tcp 2>/dev/null || true
fuser -k 443/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true

# 2. Update system packages
apt-get update -y

# 3. Ensure 2GB swap space exists (prevents Out-Of-Memory during React build)
if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo "🧠 Allocating 2GB swap memory for build stability..."
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile || true
fi

# 4. Ensure Docker and Docker Compose plugin are installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

if ! docker compose version &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    apt-get install -y docker-compose-plugin
fi

# 5. Backup .env if exists, then re-clone the repository
DEPLOY_DIR="/var/www/ktmexpress"
if [ -f "$DEPLOY_DIR/.env" ]; then
    echo "💾 Backing up existing .env configuration..."
    cp "$DEPLOY_DIR/.env" /root/.ktmexpress.env
elif [ -f "$DEPLOY_DIR/backend/.env" ]; then
    cp "$DEPLOY_DIR/backend/.env" /root/.ktmexpress.env
fi

echo "🗑️ Updating deployment directory $DEPLOY_DIR..."
rm -rf "$DEPLOY_DIR"

echo "📥 Cloning fresh repository from Tester10-lab/Ktmexpress.git..."
mkdir -p /var/www
git clone https://github.com/Tester10-lab/Ktmexpress.git "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Restore .env if backup exists
if [ -f /root/.ktmexpress.env ]; then
    echo "♻️ Restoring your saved .env configuration..."
    cp /root/.ktmexpress.env "$DEPLOY_DIR/.env"
    cp /root/.ktmexpress.env "$DEPLOY_DIR/backend/.env"
fi

# 6. Build and launch Docker containers with --no-cache to guarantee fresh frontend/backend
echo "🐳 Building Docker containers with --no-cache (clean build)..."
docker compose build --no-cache --pull
docker compose up -d

echo "🌱 Waiting for database & seeding Super Admin..."
sleep 6
docker compose exec -T backend node seed.js || true

# 7. Configure / Restart Host Nginx reverse proxy & SSL for kdmexpress.com
echo "🔒 Configuring / Restarting Host Nginx & SSL reverse proxy..."
if [ -f "$DEPLOY_DIR/setup-ssl.sh" ]; then
    bash "$DEPLOY_DIR/setup-ssl.sh" || systemctl restart nginx || true
elif command -v nginx &> /dev/null; then
    systemctl restart nginx || true
fi

echo "======================================================="
echo "🎉 Clean deployment successful!"
echo "Your app is live on https://kdmexpress.com and http://200.141.11.152"
echo "======================================================="
