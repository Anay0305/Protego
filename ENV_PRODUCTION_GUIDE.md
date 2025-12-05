# Production Environment Configuration Guide

This file provides guidance on configuring environment variables for production deployment.

## Environment Variables Reference

### Database Configuration

```env
# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://protego_user:your_secure_password@db:5432/protego
```

**In Docker Compose:**
- `db` = PostgreSQL container hostname
- `5432` = PostgreSQL port (internal)
- External port is `5433:5432` (only accessible from localhost via 127.0.0.1)

---

### Twilio Configuration

Get these from [Twilio Console](https://www.twilio.com/console):

```env
# Your Twilio Account SID
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Your Twilio Auth Token
TWILIO_AUTH_TOKEN=your_auth_token_here

# Your Twilio phone number (SMS sender)
TWILIO_FROM=+1234567890
```

**Obtain Twilio Credentials:**

1. Go to [twilio.com/console](https://www.twilio.com/console)
2. Sign in or create account
3. Copy "Account SID" and "Auth Token"
4. Go to "Phone Numbers" → "Manage Numbers"
5. Copy your Twilio phone number (starts with +1)

**Test Mode:**
```env
# Set to false in production (actual SMS will be sent)
TEST_MODE=false

# In test mode, SMS are logged but not sent
TEST_MODE=true
```

---

### Security Configuration

**Generate Strong SECRET_KEY:**

```bash
# On your VPS, run:
openssl rand -base64 32
# Output: QkRmFzx8rL2pN9vK5mJ3x...

# Use the output in .env
SECRET_KEY=QkRmFzx8rL2pN9vK5mJ3x...
```

**Algorithm** (don't change):
```env
ALGORITHM=HS256
```

**CORS Origins** (adjust for your domain):
```env
# Allow requests from these origins
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com,http://localhost:5173

# For development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# For production with subdomain
ALLOWED_ORIGINS=https://protego.example.com,https://www.protego.example.com
```

---

### Alert Configuration

```env
# Confidence threshold for triggering alerts (0.0 to 1.0)
# Higher = fewer false positives but might miss real alerts
ALERT_CONFIDENCE_THRESHOLD=0.8

# Time (in seconds) before alert is auto-sent if not cancelled
ALERT_COUNTDOWN_SECONDS=5
```

---

### Environment Flag

```env
# Determines behavior and logging level
ENVIRONMENT=production

# Alternative: development (for debugging)
ENVIRONMENT=development
```

---

## Complete Production .env Example

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://protego_user:Ch4ngeM3Secure!Pwd@db:5432/protego

# ============================================
# TWILIO (SMS/WhatsApp Alerts)
# ============================================
TWILIO_ACCOUNT_SID=ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TWILIO_AUTH_TOKEN=your_auth_token_here_change_this
TWILIO_FROM=+12025551234
TEST_MODE=false

# ============================================
# ALERT CONFIGURATION
# ============================================
ALERT_CONFIDENCE_THRESHOLD=0.8
ALERT_COUNTDOWN_SECONDS=5

# ============================================
# SECURITY
# ============================================
SECRET_KEY=QkRmFzx8rL2pN9vK5mJ3xW9yZaB1cD2eF3gH4iJ5kL6m
ALGORITHM=HS256

# ============================================
# CORS (Adjust for your domain)
# ============================================
ALLOWED_ORIGINS=https://protego.example.com,https://www.protego.example.com

# ============================================
# ENVIRONMENT
# ============================================
ENVIRONMENT=production
```

---

## Docker Compose Environment Override

You can also override variables in `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_FROM=${TWILIO_FROM}
      - TEST_MODE=${TEST_MODE:-false}
      - ALERT_CONFIDENCE_THRESHOLD=${ALERT_CONFIDENCE_THRESHOLD:-0.8}
      - ALERT_COUNTDOWN_SECONDS=${ALERT_COUNTDOWN_SECONDS:-5}
      - SECRET_KEY=${SECRET_KEY}
      - ALGORITHM=${ALGORITHM:-HS256}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
      - ENVIRONMENT=${ENVIRONMENT:-production}
```

---

## Setting Environment Variables on VPS

### Option 1: `.env` File (Recommended)

```bash
# Create .env file
cd /opt/protego
cat > .env << 'EOF'
DATABASE_URL=postgresql://protego_user:password@db:5432/protego
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM=+1234567890
TEST_MODE=false
SECRET_KEY=$(openssl rand -base64 32)
ALGORITHM=HS256
ALLOWED_ORIGINS=https://your-domain.com
ENVIRONMENT=production
EOF

# Start with .env
docker-compose up -d
```

### Option 2: `.env.production` File

```bash
cd /opt/protego
cp .env .env.production

# Use it
docker-compose --env-file .env.production up -d
```

### Option 3: System Environment Variables

```bash
# Set in shell
export DATABASE_URL=postgresql://protego_user:password@db:5432/protego
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
export TWILIO_FROM=+1234567890

# Set in /etc/environment (persistent)
echo "DATABASE_URL=postgresql://protego_user:password@db:5432/protego" >> /etc/environment
```

---

## Validating Configuration

### Check if .env is Loaded

```bash
cd /opt/protego

# View all environment variables in backend container
docker-compose exec backend env | grep PROTEGO

# Check specific variable
docker-compose exec backend env | grep TWILIO_ACCOUNT_SID
```

### Test Database Connection

```bash
cd /opt/protego

# Connect to database
docker-compose exec db psql -U protego_user -d protego -c "SELECT version();"

# If successful, you'll see PostgreSQL version
```

### Test Twilio Integration

```bash
cd /opt/protego

# Check if Twilio credentials are valid by viewing backend logs
docker-compose logs backend | grep -i twilio

# Or test directly
docker-compose exec backend python -c "from services.twilio_service import TwilioService; print('Twilio OK')"
```

### Test API Connection

```bash
# From VPS
curl http://localhost:8000/health

# From external
curl https://your-domain.com/api/health
```

---

## Security Best Practices

### 1. **Never Commit Secrets**

```bash
# Add to .gitignore
echo ".env" >> /opt/protego/.gitignore
echo ".env.*" >> /opt/protego/.gitignore
echo "!.env.example" >> /opt/protego/.gitignore

# Create example (no secrets)
cat > .env.example << 'EOF'
DATABASE_URL=postgresql://protego_user:PASSWORD@db:5432/protego
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_FROM=+1234567890
TEST_MODE=false
SECRET_KEY=generate_with_openssl_rand_-base64_32
ALGORITHM=HS256
ALLOWED_ORIGINS=https://your-domain.com
ENVIRONMENT=production
EOF
```

### 2. **Rotate Secrets Regularly**

```bash
# Generate new SECRET_KEY quarterly
openssl rand -base64 32

# Update in .env and restart
nano /opt/protego/.env
docker-compose restart backend
```

### 3. **Restrict File Permissions**

```bash
# Only owner can read
chmod 600 /opt/protego/.env

# Only root/docker can access
sudo chown root:docker /opt/protego/.env
```

### 4. **Use Secrets Management** (Advanced)

For large deployments, use Docker Secrets or HashiCorp Vault:

```yaml
# Docker Compose with secrets
services:
  backend:
    secrets:
      - db_password
      - twilio_token

secrets:
  db_password:
    file: ./secrets/db_password.txt
  twilio_token:
    file: ./secrets/twilio_token.txt
```

---

## Environment Variables by Stage

### Development
```env
ENVIRONMENT=development
TEST_MODE=true
ALERT_CONFIDENCE_THRESHOLD=0.5
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Staging
```env
ENVIRONMENT=staging
TEST_MODE=true
ALERT_CONFIDENCE_THRESHOLD=0.8
ALLOWED_ORIGINS=https://staging.your-domain.com
```

### Production
```env
ENVIRONMENT=production
TEST_MODE=false
ALERT_CONFIDENCE_THRESHOLD=0.8
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

## Troubleshooting Configuration

### Issue: "DATABASE_URL not found"

```bash
# Check if .env exists
ls -la /opt/protego/.env

# Verify format
cat /opt/protego/.env | grep DATABASE_URL

# Ensure no extra spaces
DATABASE_URL=postgresql://...  # ✓ Correct
DATABASE_URL = postgresql://...  # ✗ Incorrect (space after =)
```

### Issue: "Twilio credentials invalid"

```bash
# Verify credentials
docker-compose logs backend | grep -i "twilio\|auth"

# Test with curl
docker-compose exec backend curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  -d "To=+12025551234&From=$TWILIO_FROM&Body=Test" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

### Issue: "CORS blocked"

```bash
# Check configured origins
docker-compose exec backend env | grep ALLOWED_ORIGINS

# Verify your domain is listed
# Add your domain: ALLOWED_ORIGINS=https://your-domain.com,https://existing.com

# Restart
docker-compose restart backend
```

---

## Reference Links

- [Twilio Console](https://www.twilio.com/console)
- [Twilio Pricing](https://www.twilio.com/pricing)
- [PostgreSQL Environment Variables](https://www.postgresql.org/docs/15/libpq-envars.html)
- [OpenSSL Random](https://www.openssl.org/docs/man1.1.1/man1/rand.html)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)

---

**Last Updated**: December 2025  
**Protego Configuration v1.0**
