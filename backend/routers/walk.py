"""
Walk session management router.
Handles starting and stopping walk mode sessions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import User, WalkSession
from schemas import WalkSessionStart, WalkSessionStop, WalkSessionResponse

router = APIRouter()


@router.post("/start", response_model=WalkSessionResponse, status_code=status.HTTP_201_CREATED)
def start_walk_session(
    session_data: WalkSessionStart,
    db: Session = Depends(get_db)
):
    """
    Start a new walk mode session for a user.

    Args:
        session_data: Walk session start data
        db: Database session

    Returns:
        Created walk session object

    Raises:
        HTTPException: If user not found or already has active session
    """
    # Verify user exists
    user = db.query(User).filter(User.id == session_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {session_data.user_id} not found"
        )

    # Check if user already has an active session
    active_session = db.query(WalkSession).filter(
        WalkSession.user_id == session_data.user_id,
        WalkSession.active == True
    ).first()

    if active_session:
        # Automatically stop the old session instead of rejecting
        active_session.active = False
        active_session.end_time = datetime.now()
        db.commit()

    # Create new walk session
    new_session = WalkSession(
        user_id=session_data.user_id,
        location_lat=session_data.location_lat,
        location_lng=session_data.location_lng,
        active=True
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


@router.post("/stop", response_model=WalkSessionResponse)
def stop_walk_session(
    session_data: WalkSessionStop,
    db: Session = Depends(get_db)
):
    """
    Stop an active walk mode session.

    Args:
        session_data: Walk session stop data
        db: Database session

    Returns:
        Updated walk session object

    Raises:
        HTTPException: If session not found or already stopped
    """
    # Find the session
    session = db.query(WalkSession).filter(
        WalkSession.id == session_data.session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Walk session with ID {session_data.session_id} not found"
        )

    if not session.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Walk session is already stopped"
        )

    # Stop the session
    session.active = False
    session.end_time = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return session


@router.get("/{session_id}", response_model=WalkSessionResponse)
def get_walk_session(session_id: int, db: Session = Depends(get_db)):
    """
    Get walk session by ID.

    Args:
        session_id: Walk session ID
        db: Database session

    Returns:
        Walk session object

    Raises:
        HTTPException: If session not found
    """
    session = db.query(WalkSession).filter(WalkSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Walk session with ID {session_id} not found"
        )

    return session


@router.get("/user/{user_id}", response_model=List[WalkSessionResponse])
def get_user_walk_sessions(
    user_id: int,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all walk sessions for a user.

    Args:
        user_id: User ID
        active_only: If True, only return active sessions
        db: Database session

    Returns:
        List of walk sessions

    Raises:
        HTTPException: If user not found
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Query sessions
    query = db.query(WalkSession).filter(WalkSession.user_id == user_id)

    if active_only:
        query = query.filter(WalkSession.active == True)

    sessions = query.order_by(WalkSession.start_time.desc()).all()

    return sessions


@router.get("/user/{user_id}/active", response_model=WalkSessionResponse)
def get_active_walk_session(user_id: int, db: Session = Depends(get_db)):
    """
    Get the active walk session for a user.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        Active walk session object

    Raises:
        HTTPException: If user not found or no active session
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Find active session
    active_session = db.query(WalkSession).filter(
        WalkSession.user_id == user_id,
        WalkSession.active == True
    ).first()

    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active walk session for user {user_id}"
        )

    return active_session
