"""
Pytest configuration file for Protego backend tests.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from fastapi.testclient import TestClient

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "john@example.com",
        "trusted_contacts": ["+1987654321", "+1555555555"]
    }


@pytest.fixture
def sample_alert_data():
    """Sample alert data for testing."""
    return {
        "user_id": 1,
        "session_id": None,
        "type": "scream",
        "confidence": 0.85,
        "location_lat": 40.7128,
        "location_lng": -74.0060
    }
