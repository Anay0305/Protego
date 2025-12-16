# Protego: AI-Powered Personal Safety Companion

![Protego Logo](https://img.shields.io/badge/Protego-Safety%20First-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18.2-blue)

A production-quality full-stack application for personal safety monitoring with AI-powered distress detection, real-time alerts, and emergency contact notifications.

## 🚀 Features

### Authentication & User Management
- **Secure Sign Up/Sign In**: JWT-based authentication with bcrypt password hashing
- **Trusted Contacts Management**: Add/remove emergency contacts with country code selector
- **Profile Management**: Update user information and settings

### Safety Features
- **Walk Mode Safety Monitoring**: Start/stop safety sessions with real-time tracking
- **AI Distress Detection**: Detect screams, falls, and distress signals (ML stub included)
- **Smart Alert System**: 5-second countdown with user cancellation option
- **Voice Activation**: Say "help me" to trigger instant emergency alert
- **SOS Emergency Button**: One-tap instant alert to all trusted contacts
- **Emergency Notifications**: Automatic SMS alerts to trusted contacts via Twilio
- **Location Tracking**: GPS integration for precise emergency location sharing

### UI/UX
- **Modern Design**: Beautiful gradient-based UI with smooth animations
- **Country Code Selector**: Easy phone number entry for 10 major countries
- **Responsive Layout**: Works seamlessly on mobile and desktop
- **Real-time Updates**: Live status indicators and alerts
- **Dashboard Analytics**: Safety score and walk session tracking

### Technical
- **RESTful API**: FastAPI backend with auto-generated Swagger documentation
- **CORS Configuration**: Environment-based origin management
- **Protected Routes**: JWT middleware for secure API access

## 🏗️ Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   React Web     │─────▶│   FastAPI       │─────▶│  PostgreSQL     │
│   Frontend      │      │   Backend       │      │  Database       │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │
         │                        ▼
         │               ┌─────────────────┐
         │               │  Twilio API     │
         │               │  (SMS/Calls)    │
         │               └─────────────────┘
         │                        │
         └────────────────────────┴──────────────────────▶
                    ML Inference Stub
                 (Audio/Motion Analysis)
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **State Management** | Zustand |
| **Backend** | Python 3.11 + FastAPI |
| **Database** | PostgreSQL 15 + SQLAlchemy |
| **Messaging** | Twilio REST API |
| **AI/ML** | Python stub (ready for TensorFlow/PyTorch) |
| **Containerization** | Docker + Docker Compose |
| **Testing** | Pytest + Jest + React Testing Library |

## 📦 Installation

### Prerequisites

- PostgreSQL 15+
- Python 3.11+
- Node.js 20+
- Twilio Account (for SMS alerts)

### Quick Start (3 Steps)

#### 1. Setup Database
```bash
cd backend

# Create database and user
sudo -u postgres createdb protego
sudo -u postgres psql -c "CREATE USER protego_user WITH PASSWORD 'protego_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE protego TO protego_user;"

# Run migration to add password_hash column
PGPASSWORD=protego_pass psql -U protego_user -d protego -h localhost -f migrate_add_password.sql
```

#### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs on **http://localhost:8000**

#### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

### Access Points
- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

## 🎯 Usage

### Getting Started

1. **Sign Up**
   - Open http://localhost:5173
   - Click "Sign Up" tab
   - Fill in:
     - Full Name
     - Phone Number (select country code from dropdown)
     - Email Address
     - Password (minimum 8 characters)
   - Add trusted emergency contacts:
     - Select country code
     - Enter phone number
     - Click "+" to add (can add multiple)
   - Click "Create Account"
   - Automatically logged in with JWT token

2. **Sign In**
   - Click "Sign In" tab
   - Enter email and password
   - Click "Sign In"

3. **Start Walk Mode**
   - From Dashboard, click "Start Walk Mode"
   - Grant location permissions when prompted
   - Walk session begins monitoring
   - Safety score updates in real-time

4. **Emergency Features**
   - **SOS Button**: Tap the red SOS button for instant alert
   - **Voice Activation**: Enable voice mode and say "help me"
   - Both trigger immediate SMS to all trusted contacts with your location

5. **Manage Trusted Contacts**
   - Go to "Contacts" tab
   - View all emergency contacts
   - Add new contacts with country code selector
   - Remove contacts by clicking the X button

6. **Location Tracking**
   - Go to "Tracking" tab
   - Start live tracking for continuous location updates
   - View current coordinates and accuracy

## 🔧 Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn main:app --reload

# Run tests
pytest
pytest --cov=. --cov-report=html
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📊 Database Schema

```sql
Users
├── id (PK)
├── name
├── phone (unique)
├── email (unique, not null)
├── password_hash (bcrypt hashed)
├── trusted_contacts (JSON array of phone numbers)
├── created_at
└── updated_at

WalkSessions
├── id (PK)
├── user_id (FK)
├── start_time
├── end_time
├── active (boolean)
├── location_lat
└── location_lng

Alerts
├── id (PK)
├── user_id (FK)
├── session_id (FK)
├── type (enum: SCREAM, FALL, SOS, VOICE_ACTIVATION, etc.)
├── confidence (0.0 to 1.0)
├── status (enum: PENDING, TRIGGERED, CANCELLED, SAFE)
├── location_lat
├── location_lng
├── snapshot_url
├── created_at
├── triggered_at
└── cancelled_at
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest -v
pytest tests/test_users.py -v
pytest tests/test_alerts.py -v
```

### Frontend Tests

```bash
cd frontend
npm test
npm test -- --coverage
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `TEST_MODE=false` in backend/.env
- [ ] Configure real Twilio credentials
- [ ] Update `ALLOWED_ORIGINS` for production domain
- [ ] Set strong `SECRET_KEY` (32+ characters)
- [ ] Use production PostgreSQL database
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Replace ML stub with trained model

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://protego_user:protego_pass@db:5432/protego` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Required |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Required |
| `TWILIO_FROM` | Twilio phone number | Required |
| `TEST_MODE` | Enable test mode (no SMS sent) | `true` |
| `ALERT_CONFIDENCE_THRESHOLD` | Minimum confidence for alerts | `0.8` |
| `ALERT_COUNTDOWN_SECONDS` | Countdown duration | `5` |
| `SECRET_KEY` | JWT secret key | Change in production |

## 🤖 ML Integration

The current implementation includes an ML inference stub. To integrate a real model:

1. Train your distress detection model (TensorFlow/PyTorch)
2. Export model to `ml/models/`
3. Update `ml/inference.py` to load and use your model
4. See [ml/README.md](ml/README.md) for detailed instructions

## 🔒 Security Features

✅ **JWT Authentication**: Secure token-based auth with 7-day expiration
✅ **Password Hashing**: Bcrypt with 12 rounds for password security
✅ **Protected Routes**: All user endpoints require valid JWT token
✅ **Input Validation**: Pydantic schemas validate all inputs
✅ **SQL Injection Protection**: SQLAlchemy ORM prevents injection attacks
✅ **CORS Configuration**: Environment-based origin whitelisting
✅ **Phone Validation**: E.164 format enforcement (+country code)
✅ **HTTPS Ready**: Enable SSL/TLS for production deployment
✅ **Secrets Management**: All credentials via environment variables
✅ **XSS Protection**: React automatic escaping prevents XSS attacks

## 📝 API Endpoints

### Authentication
- `POST /api/users/signup` - Register new user with trusted contacts
- `POST /api/users/signin` - Login and receive JWT token
- `GET /api/users/me` - Get current user profile (requires JWT)

### User Management
- `PUT /api/users/me` - Update current user profile (requires JWT)

### Trusted Contacts
- `GET /api/users/me/trusted-contacts` - List trusted contacts (requires JWT)
- `POST /api/users/me/trusted-contacts` - Add trusted contact (requires JWT)
- `DELETE /api/users/me/trusted-contacts` - Remove trusted contact (requires JWT)

### Walk Sessions
- `POST /api/walk/start` - Start walk session
- `POST /api/walk/stop` - Stop walk session
- `GET /api/walk/active/{user_id}` - Get active session

### Alerts
- `POST /api/alerts/` - Create alert
- `POST /api/alerts/instant` - Create instant alert (SOS/Voice)
- `POST /api/alerts/{id}/cancel` - Cancel pending alert
- `GET /api/alerts/{id}` - Get alert details

### Admin
- `GET /api/admin/alerts` - List all alerts
- `GET /api/admin/stats` - System statistics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FastAPI framework for excellent async API support
- Twilio for reliable messaging infrastructure
- React and Vite for modern frontend development
- Tailwind CSS for beautiful, responsive UI

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: me@anaygupta.xyz
- Documentation: http://localhost:8000/docs

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time WebSocket updates
- [ ] Voice calls in addition to SMS
- [ ] Geofencing and route tracking
- [ ] Integration with wearable devices
- [ ] Multi-language support
- [ ] Advanced ML models for better detection
- [ ] Video recording capability
- [ ] Emergency services integration

---

**Built with ❤️ for personal safety**
