# Protego Local Development Setup

This guide will help you run Protego without Docker using the `runner.py` script.

## Prerequisites

- **Python 3.11+** - Check with `python3 --version`
- **Node.js 20+** - Check with `node --version`
- **PostgreSQL 15+** - Must be running on port 5432

## Step 1: Setup PostgreSQL Database

You need to create a database and user for Protego:

```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Access PostgreSQL as postgres user
sudo -u postgres psql

# In the PostgreSQL prompt, run:
CREATE USER protego_user WITH PASSWORD 'protego_pass';
CREATE DATABASE protego OWNER protego_user;
GRANT ALL PRIVILEGES ON DATABASE protego TO protego_user;
\q
```

**Alternative**: If you prefer different credentials, update them in `backend/.env` after setup.

## Step 2: Configure Backend Environment

The runner script will automatically copy `.env.example` to `.env` if it doesn't exist. You can customize it:

```bash
# Edit the configuration
nano backend/.env
```

Key settings:
- `DATABASE_URL`: PostgreSQL connection string (default uses localhost:5432)
- `TWILIO_*`: Add your Twilio credentials (or leave `TEST_MODE=true`)
- `SECRET_KEY`: Change in production

## Step 3: Run Protego

Simply run the runner script:

```bash
# Make it executable (first time only)
chmod +x runner.py

# Run Protego
python3 runner.py
```

Or directly:

```bash
python3 runner.py
```

## What the Runner Does

The `runner.py` script automatically:

1. ✅ Checks Python version (requires 3.11+)
2. ✅ Checks Node.js installation
3. ✅ Checks PostgreSQL is running
4. ✅ Creates Python virtual environment in `backend/venv`
5. ✅ Installs Python dependencies from `requirements.txt`
6. ✅ Installs Node.js dependencies with `npm install`
7. ✅ Starts FastAPI backend on http://localhost:8000
8. ✅ Starts Vite frontend on http://localhost:5173

## Access Points

Once running:

- **Frontend Application**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health Check**: http://localhost:8000/health

## Stopping the Servers

Press `Ctrl+C` in the terminal where `runner.py` is running. It will gracefully shut down both servers.

## Troubleshooting

### PostgreSQL Not Running

```bash
# Check status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Enable on boot
sudo systemctl enable postgresql
```

### Database Connection Error

If you see "database does not exist":

```bash
sudo -u postgres createdb -O protego_user protego
```

If you see "authentication failed":
- Check credentials in `backend/.env`
- Match them with your PostgreSQL user

### Port Already in Use

If port 8000 or 5173 is already in use:

**Backend (8000)**:
Edit `runner.py` line with `--port 8000` to use a different port.

**Frontend (5173)**:
Frontend will automatically try the next available port (5174, etc.).

### Python Version Error

Ensure you're using Python 3.11+:

```bash
python3 --version

# If too old, install Python 3.11+
# Ubuntu/Debian:
sudo apt update
sudo apt install python3.11

# Fedora:
sudo dnf install python3.11
```

### Missing Dependencies

If you get import errors:

```bash
# Reinstall backend dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Reinstall frontend dependencies
cd ../frontend
npm install
```

## Development Workflow

### Hot Reload

Both servers support hot reload:

- **Backend**: Edit Python files → server automatically reloads
- **Frontend**: Edit React files → browser automatically updates

### Running Tests

**Backend Tests**:
```bash
cd backend
source venv/bin/activate
pytest
pytest --cov=. --cov-report=html
```

**Frontend Tests**:
```bash
cd frontend
npm test
npm test -- --coverage
```

### Database Migrations

Currently using SQLAlchemy's `create_all()`. For production, consider Alembic:

```bash
cd backend
source venv/bin/activate
pip install alembic
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Manual Setup (Alternative)

If you prefer to run servers manually:

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Next Steps

1. Open http://localhost:5173
2. Register a new user
3. Add trusted contacts
4. Test Walk Mode
5. Try the alert system

## Support

- Check logs in the terminal where `runner.py` is running
- API documentation: http://localhost:8000/docs
- See main [README.md](README.md) for more details
