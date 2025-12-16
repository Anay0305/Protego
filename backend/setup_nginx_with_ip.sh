#!/bin/bash
# Nginx Configuration for IP-based access with self-signed SSL

set -e

echo "🌐 Setting up Nginx reverse proxy with SSL..."

# Get VPS IP
read -p "Enter your VPS IP address: " VPS_IP

if [ -z "$VPS_IP" ]; then
    echo "❌ VPS IP is required!"
    exit 1
fi

echo "Creating self-signed SSL certificate..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/protego.key \
    -out /etc/nginx/ssl/protego.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$VPS_IP"

# Create Nginx configuration
NGINX_CONFIG="/etc/nginx/sites-available/protego"

echo "Creating Nginx configuration..."
sudo tee $NGINX_CONFIG > /dev/null << EOF
server {
    listen 80;
    server_name $VPS_IP;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name $VPS_IP;

    ssl_certificate /etc/nginx/ssl/protego.crt;
    ssl_certificate_key /etc/nginx/ssl/protego.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

        if (\$request_method = 'OPTIONS') {
            return 204;
        }

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}
EOF

# Enable the site
echo "Enabling Nginx site..."
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

# Open firewall ports
echo "Opening firewall ports..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

echo "✅ Nginx setup complete!"
echo ""
echo "Your API is now accessible at: https://$VPS_IP/api"
echo ""
echo "⚠️  Note: This uses a self-signed certificate. Users will see a security warning."
echo "Update your Vercel environment variable to: https://$VPS_IP/api"
