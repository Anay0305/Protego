#!/bin/bash
# Protego Backend Deployment Script
# This script sets up and deploys the Protego backend on a VPS

set -e  # Exit on error

echo "🚀 Starting Protego Backend Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+ if not installed
echo "🐍 Installing Python..."
sudo apt install -y python3 python3-pip python3-venv

# Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create application directory
APP_DIR="/opt/protego"
echo "📁 Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Create virtual environment
echo "🔧 Creating Python virtual environment..."
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate

echo "✅ Basic setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy your backend files to $APP_DIR"
echo "   scp -r backend/* user@your-vps-ip:$APP_DIR/"
echo "2. Run ./setup_database.sh to set up PostgreSQL"
echo "3. Install dependencies: source venv/bin/activate && pip install -r requirements.txt && pip install gunicorn"
echo "4. Configure .env file with production values"
echo "5. Run ./setup_nginx.sh to configure Nginx"
echo "6. Run ./setup_service.sh to create systemd service"
