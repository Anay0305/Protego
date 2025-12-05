"""
Database setup and session management.
Provides SQLAlchemy engine, session maker, and base model class.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import psycopg2
from psycopg2 import sql

from config import settings

# Create SQLAlchemy engine
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # Verify connections before using
    echo=not settings.is_production  # Log SQL in development
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    Automatically closes the session after use.

    Usage:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize the database by creating all tables.
    Should be called on application startup.
    """
    from models import User, WalkSession, Alert  # Import models to register them
    Base.metadata.create_all(bind=engine)
    
    # Add SOS to AlertType enum if it doesn't exist
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TYPE alerttype ADD VALUE 'SOS'"))
    except Exception as e:
        # Type already exists or error occurred, continue silently
        pass
    
    # Add emergency_contact_number column if it doesn't exist
    try:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN emergency_contact_number VARCHAR NOT NULL DEFAULT '+1234567890'"
            ))
    except Exception as e:
        # Column already exists or error occurred, continue silently
        pass
