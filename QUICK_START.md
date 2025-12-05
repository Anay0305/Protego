# Protego - Quick Start Guide

## ✅ Setup Complete! 

All dependencies installed and configured.

## 🚀 Start Development

### Option 1: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd /home/anay/Desktop/Projects/Protego
source backend/.venv/bin/activate
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /home/anay/Desktop/Projects/Protego/frontend
npm run dev
```

### Option 2: Run Automated Script

```bash
cd /home/anay/Desktop/Projects/Protego
python3 runner.py
```

## 📍 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger documentation |
| ReDoc | http://localhost:8000/redoc | Alternative API docs |

## ✅ Fixed Issues

✓ Backend venv recreated (Python 3.12)
✓ Certifi SSL certificates updated
✓ All pip packages installed successfully
✓ Frontend Dockerfile updated (node:20-slim)
✓ Database schema ready (PostgreSQL)

## 📋 Installed Packages

**Backend (Python 3.12):**
- FastAPI 0.115.6
- Uvicorn 0.34.0
- SQLAlchemy 2.0.36
- Psycopg2-binary 2.9.10
- Pydantic 2.10.6
- Twilio 9.4.2
- Pytest 8.3.4
- + 30+ more dependencies

**Frontend (Node 25.2.1):**
- React 19.2.0
- Vite 5.1.0
- TypeScript 5.3.3
- Tailwind CSS 3.4.1
- Zustand 4.4.7
- Axios 1.6.5
- Lucide React (icons)

## 🧪 Test Backend

```bash
source backend/.venv/bin/activate
cd backend
pytest tests/
```

## 🐳 Docker Option

```bash
docker-compose up --build
```

## 📚 Documentation

- README.md - Full project documentation
- SETUP.md - Detailed setup instructions
- DOCKER_FIX.md - Docker troubleshooting

## 🔧 Troubleshooting

**Backend won't start:**
```bash
rm -rf backend/.venv
python3.12 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

**Frontend build fails:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Port in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

---

**Ready to go! 🚀**

Start with either:
- `python3 runner.py` (automated)
- Manual terminals with npm/python commands (manual)

