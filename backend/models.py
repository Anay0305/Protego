"""
SQLAlchemy ORM models for Protego.
Defines User, WalkSession, and Alert database tables.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from database import Base


class AlertStatus(str, enum.Enum):
    """Enum for alert status values."""
    PENDING = "pending"
    CANCELLED = "cancelled"
    TRIGGERED = "triggered"
    SAFE = "safe"


class AlertType(str, enum.Enum):
    """Enum for alert type values."""
    SCREAM = "SCREAM"
    FALL = "FALL"
    DISTRESS = "DISTRESS"
    PANIC = "PANIC"
    MOTION_ANOMALY = "MOTION_ANOMALY"
    SOUND_ANOMALY = "SOUND_ANOMALY"
    VOICE_ACTIVATION = "VOICE_ACTIVATION"
    SOS = "SOS"


class User(Base):
    """
    User model representing a Protego user.

    Attributes:
        id: Primary key
        name: User's full name
        phone: User's phone number
        email: User's email address
        emergency_contact_number: Emergency contact phone number
        trusted_contacts: JSON array of trusted contact phone numbers
        created_at: Timestamp when user was created
        updated_at: Timestamp when user was last updated
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    emergency_contact_number = Column(String, nullable=False)  # Primary emergency contact
    trusted_contacts = Column(JSON, default=list, nullable=False)  # Array of phone numbers
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    walk_sessions = relationship("WalkSession", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', phone='{self.phone}')>"


class WalkSession(Base):
    """
    Walk session model representing a user's active safety monitoring session.

    Attributes:
        id: Primary key
        user_id: Foreign key to User
        start_time: When the walk session started
        end_time: When the walk session ended (null if active)
        active: Whether the session is currently active
        location_lat: Starting latitude
        location_lng: Starting longitude
    """
    __tablename__ = "walk_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    active = Column(Boolean, default=True, nullable=False, index=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)

    # Relationships
    user = relationship("User", back_populates="walk_sessions")
    alerts = relationship("Alert", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WalkSession(id={self.id}, user_id={self.user_id}, active={self.active})>"


class Alert(Base):
    """
    Alert model representing a distress detection event.

    Attributes:
        id: Primary key
        user_id: Foreign key to User
        session_id: Foreign key to WalkSession
        type: Type of alert (scream, fall, etc.)
        confidence: AI model confidence score (0.0 to 1.0)
        status: Alert status (pending, triggered, cancelled, safe)
        location_lat: Latitude where alert occurred
        location_lng: Longitude where alert occurred
        snapshot_url: Optional URL to image/video snapshot
        created_at: When the alert was created
        triggered_at: When the alert was actually triggered (SMS sent)
        cancelled_at: When the alert was cancelled by user
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("walk_sessions.id"), nullable=True, index=True)
    type = Column(SQLEnum(AlertType), nullable=False)
    confidence = Column(Float, nullable=False)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.PENDING, nullable=False, index=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    snapshot_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    triggered_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="alerts")
    session = relationship("WalkSession", back_populates="alerts")

    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.type}, confidence={self.confidence}, status={self.status})>"
