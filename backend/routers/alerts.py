"""
Alert management router.
Handles alert creation, cancellation, and retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Alert, User, AlertStatus
from schemas import AlertCreate, AlertCancel, AlertResponse
from services.alert_manager import alert_manager
from config import settings

router = APIRouter()


@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new alert from anomaly detection.
    If confidence >= threshold, starts countdown timer.

    Args:
        alert_data: Alert creation data
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        Created alert object

    Raises:
        HTTPException: If user not found
    """
    # Verify user exists
    user = db.query(User).filter(User.id == alert_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {alert_data.user_id} not found"
        )

    # Create new alert
    new_alert = Alert(
        user_id=alert_data.user_id,
        session_id=alert_data.session_id,
        type=alert_data.type,
        confidence=alert_data.confidence,
        status=AlertStatus.PENDING,
        location_lat=alert_data.location_lat,
        location_lng=alert_data.location_lng,
        snapshot_url=alert_data.snapshot_url
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    # Check if confidence meets threshold
    if alert_data.confidence >= settings.alert_confidence_threshold:
        # Start countdown in background
        # Note: Pass only alert_id, not db session (will create fresh session)
        background_tasks.add_task(
            alert_manager.start_alert_countdown,
            new_alert.id
        )

    return new_alert


@router.post("/cancel", status_code=status.HTTP_200_OK)
async def cancel_alert(
    cancel_data: AlertCancel,
    db: Session = Depends(get_db)
):
    """
    Cancel a pending alert countdown.

    Args:
        cancel_data: Alert cancellation data
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If alert not found or cannot be cancelled
    """
    # Verify alert exists
    alert = db.query(Alert).filter(Alert.id == cancel_data.alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {cancel_data.alert_id} not found"
        )

    # Check if alert is in cancellable state
    if alert.status != AlertStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Alert cannot be cancelled (current status: {alert.status})"
        )

    # Cancel the alert
    success = await alert_manager.cancel_alert(cancel_data.alert_id, db)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to cancel alert (countdown may have already completed)"
        )

    return {
        "success": True,
        "message": f"Alert {cancel_data.alert_id} cancelled successfully"
    }


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    """
    Get alert by ID.

    Args:
        alert_id: Alert ID
        db: Database session

    Returns:
        Alert object

    Raises:
        HTTPException: If alert not found
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found"
        )

    return alert


@router.get("/user/{user_id}", response_model=List[AlertResponse])
def get_user_alerts(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all alerts for a user.

    Args:
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List of alerts

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

    # Query alerts
    alerts = db.query(Alert).filter(
        Alert.user_id == user_id
    ).order_by(
        Alert.created_at.desc()
    ).offset(skip).limit(limit).all()

    return alerts


@router.get("/session/{session_id}", response_model=List[AlertResponse])
def get_session_alerts(
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all alerts for a walk session.

    Args:
        session_id: Walk session ID
        db: Database session

    Returns:
        List of alerts
    """
    alerts = db.query(Alert).filter(
        Alert.session_id == session_id
    ).order_by(
        Alert.created_at.desc()
    ).all()

    return alerts


@router.get("/pending/list", response_model=List[int])
def get_pending_alerts():
    """
    Get list of alert IDs with active countdowns.

    Returns:
        List of pending alert IDs
    """
    return alert_manager.get_pending_alert_ids()


@router.post("/instant", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_instant_alert(
    alert_data: AlertCreate,
    db: Session = Depends(get_db)
):
    """
    Create an instant emergency alert that triggers immediately without countdown.
    Used for voice-activated emergencies where user says "help me".

    Args:
        alert_data: Alert creation data
        db: Database session

    Returns:
        Created and triggered alert object

    Raises:
        HTTPException: If user not found or notification fails
    """
    # Verify user exists
    user = db.query(User).filter(User.id == alert_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {alert_data.user_id} not found"
        )

    # Create new alert
    new_alert = Alert(
        user_id=alert_data.user_id,
        session_id=alert_data.session_id,
        type=alert_data.type,
        confidence=alert_data.confidence,
        status=AlertStatus.PENDING,
        location_lat=alert_data.location_lat,
        location_lng=alert_data.location_lng,
        snapshot_url=alert_data.snapshot_url
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    # Trigger immediately without countdown
    # Create a fresh session to ensure we get latest user data
    from database import SessionLocal
    trigger_db = SessionLocal()
    try:
        await alert_manager._trigger_alert(new_alert.id, trigger_db)
    finally:
        trigger_db.close()

    return new_alert
