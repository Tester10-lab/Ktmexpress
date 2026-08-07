#!/bin/bash
# =======================================================
# Ktmexpress Hostinger VPS One-Click Deployment Script
# Domain: kdmexpress.com | IP: 200.141.11.152
# =======================================================

set -e

echo "🚀 Starting Hostinger VPS deployment for Ktmexpress..."

# Update system
apt-get update -y

# Ensure 2GB swap space exists (prevents Out-Of-Memory crashes during Docker build)
if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo "🧠 Allocating 2GB swap memory for build stability..."
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile || true
fi

# Ensure Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Ensure Docker Compose plugin is installed
if ! docker compose version &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    apt-get install -y docker-compose-plugin
fi

# Setup directory
DEPLOY_DIR="/var/www/ktmexpress"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "📥 Cloning repository into $DEPLOY_DIR..."
    mkdir -p /var/www
    git clone https://github.com/Tester10-lab/Ktmexpress.git "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
else
    echo "🔄 Pulling latest changes in $DEPLOY_DIR..."
    cd "$DEPLOY_DIR"
    git fetch origin main
    git reset --hard origin/main
fi

# Launch Docker containers (MongoDB + Backend + Frontend)
echo "🐳 Building and starting Docker containers..."
docker compose down || true
docker compose build --no-cache
docker compose up -d

echo "✅ Containers running! Checking status:"
docker compose ps

echo "======================================================="
echo "🎉 Deployment successful!"
echo "Your app is live on http://200.141.11.152"
echo "Make sure your domain kdmexpress.com points its A Record to 200.141.11.152"
echo "======================================================="
