"""
User management router.
Handles user registration, authentication, and profile management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User
from schemas import (
    UserCreate, UserLogin, UserUpdate, UserResponse, AuthResponse,
    TrustedContactAdd, TrustedContactRemove
)
from auth import get_password_hash, authenticate_user, create_access_token, get_current_user, decode_access_token
from config import settings

router = APIRouter()


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user and return authentication token.

    Args:
        user_data: User registration data including trusted contacts
        db: Database session

    Returns:
        Access token and user object

    Raises:
        HTTPException: If phone or email already exists
    """
    # Check if phone already exists
    existing_phone = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user with hashed password
    new_user = User(
        name=user_data.name,
        phone=user_data.phone,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        trusted_contacts=user_data.trusted_contacts
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token - sub must be a string per JWT spec
    access_token = create_access_token(data={"sub": str(new_user.id)})

    return AuthResponse(
        access_token=access_token,
        user=UserResponse.from_orm(new_user)
    )


@router.post("/signin", response_model=AuthResponse)
def signin(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return access token.

    Args:
        credentials: User login credentials
        db: Database session

    Returns:
        Access token and user object

    Raises:
        HTTPException: If authentication fails
    """
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token - sub must be a string per JWT spec
    access_token = create_access_token(data={"sub": str(user.id)})

    return AuthResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.

    Args:
        current_user: Current authenticated user

    Returns:
        User profile
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.

    Args:
        user_data: Updated user data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user profile
    """
    if user_data.name is not None:
        current_user.name = user_data.name
    if user_data.email is not None:
        # Check if email is already taken
        existing = db.query(User).filter(
            User.email == user_data.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = user_data.email
    if user_data.trusted_contacts is not None:
        current_user.trusted_contacts = user_data.trusted_contacts

    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/me/trusted-contacts", response_model=UserResponse)
def add_trusted_contact(
    contact: TrustedContactAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a trusted contact to the current user's profile.

    Args:
        contact: Contact information
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user profile

    Raises:
        HTTPException: If contact already exists
    """
    if contact.phone in current_user.trusted_contacts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact already exists"
        )

    current_user.trusted_contacts.append(contact.phone)
    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/me/trusted-contacts", response_model=UserResponse)
def remove_trusted_contact(
    contact: TrustedContactRemove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a trusted contact from the current user's profile.

    Args:
        contact: Contact information
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user profile

    Raises:
        HTTPException: If contact not found
    """
    if contact.phone not in current_user.trusted_contacts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    current_user.trusted_contacts.remove(contact.phone)
    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/me/trusted-contacts", response_model=List[str])
def get_trusted_contacts(current_user: User = Depends(get_current_user)):
    """
    Get current user's trusted contacts.

    Args:
        current_user: Current authenticated user

    Returns:
        List of trusted contact phone numbers
    """
    return current_user.trusted_contacts


@router.post("/debug-token")
def debug_token(token_data: dict, db: Session = Depends(get_db)):
    """
    Debug endpoint to test token validation.
    This is a temporary endpoint for debugging purposes.
    """
    from jose import jwt, JWTError

    token = token_data.get("token", "")
    result = {
        "token_received": token[:50] + "..." if len(token) > 50 else token,
        "secret_key_prefix": settings.secret_key[:20] + "...",
        "algorithm": settings.algorithm,
    }

    # Try to decode without verification first
    try:
        unverified = jwt.get_unverified_claims(token)
        result["unverified_claims"] = unverified
    except Exception as e:
        result["unverified_error"] = str(e)

    # Try to decode with verification
    try:
        verified = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        result["verified_claims"] = verified
        result["verification_success"] = True
    except JWTError as e:
        result["verification_error"] = str(e)
        result["verification_success"] = False
    except Exception as e:
        result["verification_error"] = f"Unexpected: {str(e)}"
        result["verification_success"] = False

    # If we got a user_id, try to look up the user
    if result.get("verified_claims"):
        user_id = result["verified_claims"].get("sub")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            result["user_found"] = user is not None
            if user:
                result["user_email"] = user.email

    return result
