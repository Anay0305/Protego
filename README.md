# Protego: AI-Powered Personal Safety Companion

![Protego Logo](https://img.shields.io/badge/Protego-Safety%20First-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18.2-blue)

A production-quality full-stack application for personal safety monitoring with AI-powered distress detection, real-time alerts, and emergency contact notifications.

## 🚀 Features

- **Walk Mode Safety Monitoring**: Start/stop safety sessions with real-time tracking
- **AI Distress Detection**: Detect screams, falls, and distress signals (ML stub included)
- **Smart Alert System**: 5-second countdown with user cancellation option
- **Emergency Notifications**: Automatic SMS alerts to trusted contacts via Twilio
- **Location Tracking**: GPS integration for precise emergency location sharing
- **Admin Dashboard**: System-wide monitoring and analytics
- **Responsive UI**: Modern React interface with Tailwind CSS
- **RESTful API**: FastAPI backend with auto-generated Swagger documentation

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

- Docker & Docker Compose
- Git
- (Optional) Node.js 20+ and Python 3.11+ for local development

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/protego.git
   cd protego
   ```

2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Update Twilio credentials in `backend/.env`**
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_FROM=+1234567890
   TEST_MODE=true  # Set to false for production
   ```

4. **Start all services**
   ```bash
   docker-compose up --build
   ```

5. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs
   - **Database**: localhost:5432

## 🎯 Usage

### User Flow

1. **Registration**
   - Navigate to http://localhost:5173
   - Create account with name, phone, and trusted contacts
   - Phone numbers must be in E.164 format (e.g., +1234567890)

2. **Start Walk Mode**
   - Click "Start Walk Mode" on home page
   - Grant location permissions
   - Walk session begins monitoring

3. **Alert Handling**
   - If distress detected (confidence ≥ 80%), countdown starts
   - User has 5 seconds to cancel
   - If not cancelled, SMS sent to trusted contacts with location

4. **Stop Walk Mode**
   - Click "Stop Walk Mode" when safe
   - Session ends, monitoring stops

### Admin Dashboard

Access admin features at http://localhost:5173/admin to:
- View system-wide statistics
- Monitor all alerts across users
- Track active walk sessions
- Analyze alert trends

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
├── email
├── trusted_contacts (JSON)
└── created_at

WalkSessions
├── id (PK)
├── user_id (FK)
├── start_time
├── end_time
├── active
├── location_lat
└── location_lng

Alerts
├── id (PK)
├── user_id (FK)
├── session_id (FK)
├── type (enum)
├── confidence
├── status (enum)
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

## 🔒 Security Considerations

- **Authentication**: Currently basic. Implement JWT tokens for production
- **HTTPS**: Enable SSL/TLS for all communications
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection**: Protected by SQLAlchemy ORM
- **Rate Limiting**: Implement for API endpoints
- **Secrets Management**: Use environment variables, never commit credentials
- **CORS**: Configure allowed origins properly

## 📝 API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Walk Sessions
- `POST /api/walk/start` - Start walk session
- `POST /api/walk/stop` - Stop walk session
- `GET /api/walk/{id}` - Get session details
- `GET /api/walk/user/{user_id}/active` - Get active session

### Alerts
- `POST /api/alerts/` - Create alert
- `POST /api/alerts/cancel` - Cancel pending alert
- `GET /api/alerts/{id}` - Get alert details
- `GET /api/alerts/user/{user_id}` - Get user alerts

### Admin
- `GET /api/admin/alerts` - List all alerts
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users/active` - Active users

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
- Email: support@protego.example.com
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
