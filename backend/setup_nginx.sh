#!/bin/bash
# Nginx Configuration Setup Script

set -e

echo "🌐 Setting up Nginx reverse proxy..."

# Get domain name from user
read -p "Enter your domain name (e.g., api.yourdomain.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Domain name is required!"
    exit 1
fi

# Create Nginx configuration
NGINX_CONFIG="/etc/nginx/sites-available/protego"

echo "Creating Nginx configuration..."
sudo tee $NGINX_CONFIG > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Increase buffer sizes for large requests
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

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}
EOF

# Enable the site
echo "Enabling Nginx site..."
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Nginx setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your domain $DOMAIN_NAME points to this server's IP"
echo "2. Run: sudo certbot --nginx -d $DOMAIN_NAME"
echo "   This will set up SSL certificate automatically"
