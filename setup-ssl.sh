#!/bin/bash
# =======================================================
# Ktmexpress One-Click Let's Encrypt SSL & Cloudflare Setup
# Domain: kdmexpress.com | www.kdmexpress.com
# =======================================================
set -e

echo "🔒 Configuring Host Nginx & SSL for kdmexpress.com..."

# Install certbot and host nginx
apt-get update -y
apt-get install -y certbot python3-certbot-nginx nginx

# Stop default nginx site
rm -f /etc/nginx/sites-enabled/default

cd /var/www/ktmexpress

# Ensure docker frontend is running on 127.0.0.1:8080
sed -i 's/"80:80"/"127.0.0.1:8080:80"/g' docker-compose.yml || true
docker compose up -d

# Step 1: Initial HTTP config for certificate acquisition
cat << 'EOF' > /etc/nginx/sites-available/ktmexpress
server {
    listen 80;
    server_name kdmexpress.com www.kdmexpress.com 200.141.11.152;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ktmexpress /etc/nginx/sites-enabled/ktmexpress
systemctl restart nginx

# Obtain SSL Certificate if not already present
certbot certonly --nginx -d kdmexpress.com -d www.kdmexpress.com --non-interactive --agree-tos -m admin@kdmexpress.com || true

# Step 2: Full Dual HTTP/HTTPS Proxy (Compatible with Cloudflare Flexible, Full & Direct)
cat << 'EOF' > /etc/nginx/sites-available/ktmexpress
server {
    listen 80;
    listen 443 ssl http2;
    server_name kdmexpress.com www.kdmexpress.com 200.141.11.152;

    ssl_certificate /etc/letsencrypt/live/kdmexpress.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kdmexpress.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

systemctl restart nginx

echo "======================================================="
echo "🎉 SSL & Cloudflare-compatible Setup Complete!"
echo "Your site works on both https://kdmexpress.com and http://200.141.11.152"
echo "======================================================="
