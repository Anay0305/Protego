#!/bin/bash
# Systemd Service Setup Script

set -e

echo "⚙️  Setting up systemd service..."

APP_DIR="/opt/protego"
USER=$(whoami)

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/protego.service"

echo "Creating systemd service..."
sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=Protego Backend API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=notify
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/gunicorn main:app \\
    --workers 4 \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --bind 0.0.0.0:8000 \\
    --access-logfile /var/log/protego/access.log \\
    --error-logfile /var/log/protego/error.log \\
    --log-level info

# Restart policy
Restart=always
RestartSec=10

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Create log directory
echo "Creating log directory..."
sudo mkdir -p /var/log/protego
sudo chown $USER:$USER /var/log/protego

# Reload systemd
echo "Reloading systemd..."
sudo systemctl daemon-reload

# Enable service
echo "Enabling Protego service..."
sudo systemctl enable protego

echo "✅ Systemd service setup complete!"
echo ""
echo "Service commands:"
echo "  Start:   sudo systemctl start protego"
echo "  Stop:    sudo systemctl stop protego"
echo "  Restart: sudo systemctl restart protego"
echo "  Status:  sudo systemctl status protego"
echo "  Logs:    sudo journalctl -u protego -f"
