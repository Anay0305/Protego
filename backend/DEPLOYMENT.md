# Protego Backend VPS Deployment Guide

Complete guide to deploy your Protego backend on a VPS with Nginx reverse proxy and SSL.

## Prerequisites

- A VPS (Ubuntu 20.04+ or Debian 11+)
- Root or sudo access
- A domain name pointing to your VPS IP
- Twilio account with credentials

## Quick Start

### 1. Initial VPS Setup

SSH into your VPS:
```bash
ssh root@your-vps-ip
```

Copy the backend files to your VPS:
```bash
# From your local machine
cd /home/anay/Desktop/Projects/Protego
scp -r backend/* root@your-vps-ip:/tmp/protego-backend/
```

### 2. Run Deployment Script

On your VPS:
```bash
cd /tmp/protego-backend
chmod +x deploy.sh setup_database.sh setup_nginx.sh setup_service.sh
./deploy.sh
```

This will install:
- Python 3 and pip
- PostgreSQL database
- Nginx web server
- Certbot for SSL certificates

### 3. Copy Application Files

```bash
sudo cp -r /tmp/protego-backend/* /opt/protego/
cd /opt/protego
```

### 4. Setup Database

```bash
./setup_database.sh
```

**IMPORTANT:** Save the database credentials that are displayed!

### 5. Install Python Dependencies

```bash
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 6. Configure Environment Variables

```bash
cd /opt/protego
cp .env.production .env
nano .env
```

Update these values:
- `DATABASE_URL`: Use credentials from step 4
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `TWILIO_FROM`: Your Twilio phone number
- `SECRET_KEY`: Generate with `openssl rand -base64 32`
- `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

### 7. Initialize Database Tables

```bash
source venv/bin/activate
python -c "from database import init_db; init_db()"
```

### 8. Setup Nginx Reverse Proxy

```bash
./setup_nginx.sh
```

Enter your domain name when prompted (e.g., `api.yourdomain.com`)

### 9. Setup SSL Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts. Certbot will automatically configure SSL.

### 10. Setup Systemd Service

```bash
./setup_service.sh
```

### 11. Start the Service

```bash
sudo systemctl start protego
sudo systemctl status protego
```

Check logs:
```bash
sudo journalctl -u protego -f
```

## Verify Deployment

Test your API:
```bash
curl https://api.yourdomain.com/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "test_mode": false
}
```

## Updating the Application

When you need to update your code:

```bash
# On your local machine
scp -r backend/* user@your-vps-ip:/opt/protego/

# On your VPS
sudo systemctl restart protego
```

## Useful Commands

### Service Management
```bash
sudo systemctl start protego      # Start service
sudo systemctl stop protego       # Stop service
sudo systemctl restart protego    # Restart service
sudo systemctl status protego     # Check status
```

### View Logs
```bash
sudo journalctl -u protego -f                    # Follow logs
sudo journalctl -u protego --since "1 hour ago"  # Last hour
tail -f /var/log/protego/access.log              # Access logs
tail -f /var/log/protego/error.log               # Error logs
```

### Database
```bash
sudo -u postgres psql protego     # Connect to database
```

### Nginx
```bash
sudo nginx -t                     # Test config
sudo systemctl reload nginx       # Reload config
sudo systemctl status nginx       # Check status
```

## Security Checklist

- [ ] Updated SECRET_KEY in .env
- [ ] Set ENVIRONMENT=production
- [ ] Set TEST_MODE=false
- [ ] Updated ALLOWED_ORIGINS with your Vercel domain
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Database password is strong and secured
- [ ] Firewall configured (UFW):
  ```bash
  sudo ufw allow 22/tcp     # SSH
  sudo ufw allow 80/tcp     # HTTP
  sudo ufw allow 443/tcp    # HTTPS
  sudo ufw enable
  ```
- [ ] PostgreSQL only accepts local connections (default)
- [ ] Regular backups configured

## Troubleshooting

### Service won't start
```bash
sudo journalctl -u protego -n 50
```

### Database connection errors
Check DATABASE_URL in .env and test connection:
```bash
psql "postgresql://protego_user:password@localhost:5432/protego"
```

### CORS errors from frontend
Add your Vercel domain to ALLOWED_ORIGINS in .env:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```
Then restart: `sudo systemctl restart protego`

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

## Monitoring

Set up monitoring for:
- Disk space: `df -h`
- Memory usage: `free -h`
- CPU usage: `top`
- Service uptime: `systemctl status protego`

Consider setting up:
- Uptime monitoring (UptimeRobot, Pingdom)
- Log aggregation (Papertrail, Loggly)
- Error tracking (Sentry)

## Backup Strategy

### Database Backup
```bash
# Create backup
sudo -u postgres pg_dump protego > backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql protego < backup_20240101.sql
```

Set up automated daily backups with cron:
```bash
sudo crontab -e
```

Add:
```
0 2 * * * sudo -u postgres pg_dump protego > /backups/protego_$(date +\%Y\%m\%d).sql
```

## Next Steps

1. Update your frontend environment variables on Vercel with your API URL
2. Test the integration between frontend and backend
3. Set up monitoring and alerts
4. Configure automated backups
5. Set up CI/CD for automated deployments (optional)
