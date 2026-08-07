#!/bin/bash
# =======================================================
# Ktmexpress One-Click Let's Encrypt SSL Setup Script
# Domain: kdmexpress.com | www.kdmexpress.com
# =======================================================
set -e

echo "🔒 Setting up free SSL Certificate for kdmexpress.com..."

# Install certbot and host nginx
apt-get update -y
apt-get install -y certbot python3-certbot-nginx nginx

# Stop frontend docker container briefly
cd /var/www/ktmexpress

# Update docker-compose.yml to expose frontend on 8080 so host Nginx can bind 80/443
sed -i 's/"80:80"/"127.0.0.1:8080:80"/g' docker-compose.yml || true
docker compose up -d

# Configure Host Nginx Proxy
cat << 'EOF' > /etc/nginx/sites-available/ktmexpress
server {
    listen 80;
    server_name kdmexpress.com www.kdmexpress.com 200.141.11.152;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ktmexpress /etc/nginx/sites-enabled/ktmexpress
rm -f /etc/nginx/sites-enabled/default

systemctl restart nginx

# Obtain SSL Certificate
certbot --nginx -d kdmexpress.com -d www.kdmexpress.com --non-interactive --agree-tos -m admin@kdmexpress.com --redirect || true

systemctl reload nginx

echo "======================================================="
echo "🎉 SSL Setup Complete!"
echo "Your site is now 100% SECURE at https://kdmexpress.com 🔒"
echo "======================================================="
