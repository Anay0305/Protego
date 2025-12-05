# Protego Backend API

FastAPI backend for Protego AI-Powered Personal Safety Companion.

## Development

### Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Running Locally

```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 8000

# Or using Python
python main.py
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_users.py -v
```

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration management
├── database.py          # Database session & setup
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic validation schemas
├── routers/             # API route handlers
│   ├── users.py
│   ├── walk.py
│   ├── alerts.py
│   └── admin.py
├── services/            # Business logic services
│   ├── twilio_service.py
│   └── alert_manager.py
└── tests/               # Test suite
    ├── conftest.py
    ├── test_users.py
    └── test_alerts.py
```

## Configuration

Edit `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/protego

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM=+1234567890
TEST_MODE=true

# Alert settings
ALERT_CONFIDENCE_THRESHOLD=0.8
ALERT_COUNTDOWN_SECONDS=5
```

## Database Migrations

Currently using `Base.metadata.create_all()` for simplicity.

For production, consider using Alembic:

```bash
# Install Alembic
pip install alembic

# Initialize
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

## Production Deployment

1. Set `ENVIRONMENT=production` in .env
2. Use a production WSGI server (Gunicorn + Uvicorn workers)
3. Configure proper PostgreSQL database
4. Enable HTTPS
5. Set up logging and monitoring

Example production command:

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
