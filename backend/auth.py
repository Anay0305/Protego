"""
Authentication utilities for JWT token generation and password hashing.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token
        expires_delta: Token expiration time

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)  # Default 7 days

    to_encode.update({"exp": expire})
    print(f"[AUTH DEBUG] Creating token with secret_key: {settings.secret_key[:20]}...")
    print(f"[AUTH DEBUG] Creating token with algorithm: {settings.algorithm}")
    print(f"[AUTH DEBUG] Token payload: {to_encode}")
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    print(f"[AUTH DEBUG] Created token: {encoded_jwt[:50]}...")
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode a JWT access token.

    Args:
        token: JWT token to decode

    Returns:
        Decoded token data

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        print(f"[AUTH DEBUG] Decoding token: {token[:50]}...")
        print(f"[AUTH DEBUG] Using secret_key: {settings.secret_key[:20]}...")
        print(f"[AUTH DEBUG] Using algorithm: {settings.algorithm}")
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        print(f"[AUTH DEBUG] Decoded payload: {payload}")
        return payload
    except JWTError as e:
        print(f"[AUTH DEBUG] JWTError: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from the JWT token.

    Args:
        credentials: HTTP Bearer credentials
        db: Database session

    Returns:
        Current user object

    Raises:
        HTTPException: If authentication fails
    """
    print(f"[AUTH DEBUG] get_current_user called")
    print(f"[AUTH DEBUG] credentials: {credentials}")
    token = credentials.credentials
    print(f"[AUTH DEBUG] token from credentials: {token[:50] if token else 'None'}...")
    payload = decode_access_token(token)

    user_id_raw = payload.get("sub")
    print(f"[AUTH DEBUG] user_id_raw from payload: {user_id_raw}, type: {type(user_id_raw)}")
    if user_id_raw is None:
        print("[AUTH DEBUG] user_id_raw is None!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Convert to int (JWT returns strings)
    try:
        user_id = int(user_id_raw)
        print(f"[AUTH DEBUG] converted user_id: {user_id}")
    except (ValueError, TypeError) as e:
        print(f"[AUTH DEBUG] Failed to convert user_id: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"[AUTH DEBUG] Looking up user with id={user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    print(f"[AUTH DEBUG] User lookup result: {user}")
    if user is None:
        print(f"[AUTH DEBUG] User with id={user_id} not found!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"[AUTH DEBUG] Successfully authenticated user: {user.email}")
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user with email and password.

    Args:
        db: Database session
        email: User's email
        password: User's password

    Returns:
        User object if authentication successful, None otherwise
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
