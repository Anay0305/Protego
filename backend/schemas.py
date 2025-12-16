"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from models import AlertStatus, AlertType


# ==================== User Schemas ====================

class UserCreate(BaseModel):
    """Schema for creating a new user (sign up)."""
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$")  # E.164 format
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password: str = Field(..., min_length=8, max_length=100)
    trusted_contacts: List[str] = Field(default_factory=list)

    @validator("trusted_contacts")
    def validate_contacts(cls, v):
        """Validate that trusted contacts are valid phone numbers."""
        for contact in v:
            if not contact.startswith("+"):
                raise ValueError("Phone numbers must be in E.164 format (e.g., +1234567890)")
        return v


# Alias for compatibility with auth router
UserRegister = UserCreate


class UserLogin(BaseModel):
    """Schema for user login."""
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password: str = Field(..., min_length=1)


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = None
    trusted_contacts: Optional[List[str]] = None


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    name: str
    phone: str
    email: str
    trusted_contacts: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AuthResponse(BaseModel):
    """Schema for authentication response (alias for Token)."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TrustedContactAdd(BaseModel):
    """Schema for adding a trusted contact."""
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$")
    name: Optional[str] = None


class TrustedContactRemove(BaseModel):
    """Schema for removing a trusted contact."""
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$")


# ==================== Walk Session Schemas ====================

class WalkSessionStart(BaseModel):
    """Schema for starting a walk session."""
    user_id: int
    location_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_lng: Optional[float] = Field(None, ge=-180, le=180)


class WalkSessionStop(BaseModel):
    """Schema for stopping a walk session."""
    session_id: int


class WalkSessionResponse(BaseModel):
    """Schema for walk session response."""
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    active: bool
    location_lat: Optional[float]
    location_lng: Optional[float]

    class Config:
        from_attributes = True


# ==================== Alert Schemas ====================

class AlertCreate(BaseModel):
    """Schema for creating an alert."""
    user_id: int
    session_id: Optional[int] = None
    type: AlertType
    confidence: float = Field(..., ge=0.0, le=1.0)
    location_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_lng: Optional[float] = Field(None, ge=-180, le=180)
    snapshot_url: Optional[str] = None


class AlertCancel(BaseModel):
    """Schema for cancelling an alert."""
    alert_id: int


class AlertResponse(BaseModel):
    """Schema for alert response."""
    id: int
    user_id: int
    session_id: Optional[int]
    type: AlertType
    confidence: float
    status: AlertStatus
    location_lat: Optional[float]
    location_lng: Optional[float]
    snapshot_url: Optional[str]
    created_at: datetime
    triggered_at: Optional[datetime]
    cancelled_at: Optional[datetime]

    class Config:
        from_attributes = True


class AlertWithUser(AlertResponse):
    """Schema for alert response with user details."""
    user_name: str
    user_phone: str

    class Config:
        from_attributes = True
