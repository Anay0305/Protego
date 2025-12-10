# Complete Protego Deployment Guide
## Backend + Frontend with Authentication

This guide covers deploying the completely refactored Protego system with proper authentication, separate pages, and emergency contacts management.

## What's Changed

### Backend:
- ✅ Added password-based authentication with JWT tokens
- ✅ Separate EmergencyContact model/table
- ✅ Auth endpoints: `/api/auth/register` and `/api/auth/login`
- ✅ Emergency contacts API: `/api/emergency-contacts/`
- ✅ Protected routes requiring authentication
- ✅ Proper password hashing with bcrypt

### Frontend (Coming):
- React Router for multiple pages
- Login/Signup pages
- Dashboard page
- Emergency Contacts management page
- Walk Session page
- Authentication context with protected routes

## Backend Deployment (VPS)

### Step 1: Push Backend Changes

```bash
# On your local machine
cd /home/anay/Desktop/Projects/Protego
git add .
git commit -m "Add authentication system and emergency contacts"
git push origin main
```

### Step 2: Update VPS Backend

```bash
# SSH to your VPS
ssh anay@YOUR_VPS_IP

# Pull latest changes
cd ~/Protego/backend
git pull origin main

# Stop the service
sudo systemctl stop protego

# Backup current database (IMPORTANT!)
sudo -u postgres pg_dump protego > ~/protego_backup_$(date +%Y%m%d).sql

# Run database migration
python3 migrate_database.py

# Restart the service
sudo systemctl start protego
sudo systemctl status protego

# Check logs
sudo journalctl -u protego -f
```

### Step 3: Test New Endpoints

```bash
# Test registration
curl -k -X POST https://YOUR_VPS_IP/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'

# You should get back a token and user object

# Test login
curl -k -X POST https://YOUR_VPS_IP/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Test protected endpoint (emergency contacts)
# Replace YOUR_TOKEN with the token from login
curl -k -X GET https://YOUR_VPS_IP/api/emergency-contacts/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Deployment (Coming Next)

The frontend refactoring is extensive and includes:

1. **React Router** - Multiple pages instead of single page
2. **Authentication Pages** - Login/Signup with form validation
3. **Dashboard** - Main hub after login
4. **Emergency Contacts Page** - Manage emergency contacts
5. **Walk Session Page** - Start/stop walk mode
6. **Protected Routes** - Redirect to login if not authenticated
7. **Auth Context** - Global authentication state

### Changes Required:

- Install dependencies: `react-router-dom`, `@tanstack/react-query`
- Create new page components
- Add authentication context
- Update API service to include auth token
- Create protected route wrapper
- Update navigation

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Emergency Contacts (Protected)
- `GET /api/emergency-contacts/` - List all contacts
- `POST /api/emergency-contacts/` - Create contact
- `GET /api/emergency-contacts/{id}` - Get specific contact
- `PUT /api/emergency-contacts/{id}` - Update contact
- `DELETE /api/emergency-contacts/{id}` - Delete contact

### Walk Sessions (Protected - coming)
- `POST /api/walk/start` - Start walk session
- `POST /api/walk/stop` - Stop walk session

### Alerts (Protected - coming)
- `POST /api/alerts/` - Create alert
- `POST /api/alerts/instant` - Create instant alert

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    phone VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Emergency Contacts Table
```sql
CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    relationship VARCHAR,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Troubleshooting

### Backend won't start after migration
```bash
# Check logs
sudo journalctl -u protego -n 100

# Common issues:
# 1. Import errors - Make sure auth.py and emergency_contacts.py exist
# 2. Database migration failed - Restore backup and try again
# 3. Missing dependencies - Run: pip install python-jose passlib[bcrypt]
```

### Can't register users
```bash
# Check if database migration completed
sudo -u postgres psql protego -c "\d users"

# Should show password_hash column
```

### Authentication not working
```bash
# Verify SECRET_KEY is set in .env
grep SECRET_KEY ~/Protego/backend/.env

# Test endpoint directly
curl -k https://YOUR_VPS_IP/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123","phone":"+1234567890"}'
```

## Next Steps

1. ✅ Deploy backend changes (follow steps above)
2. ⏳ Create frontend pages (I'll help with this next)
3. ⏳ Deploy frontend to Vercel
4. ⏳ Test end-to-end flow

## Rollback Plan

If something goes wrong:

```bash
# On VPS
sudo systemctl stop protego

# Restore database
sudo -u postgres psql protego < ~/protego_backup_YYYYMMDD.sql

# Revert code
cd ~/Protego/backend
git reset --hard PREVIOUS_COMMIT_HASH

# Restart
sudo systemctl start protego
```

---

**Ready to proceed?** Let me know when the backend is deployed and I'll create the complete frontend with all the pages!
