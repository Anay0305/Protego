"""
Admin router for monitoring and management.
Provides administrative endpoints for viewing all alerts and system status.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from models import Alert, User, WalkSession, AlertStatus
from schemas import AlertResponse

router = APIRouter()


@router.get("/alerts", response_model=List[AlertResponse])
def list_all_alerts(
    status_filter: Optional[AlertStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Admin endpoint: List all alerts with optional status filter.

    Args:
        status_filter: Filter by alert status (safe, triggered, cancelled, pending)
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List of alerts
    """
    query = db.query(Alert)

    # Apply status filter if provided
    if status_filter:
        query = query.filter(Alert.status == status_filter)

    # Order by creation time (most recent first)
    alerts = query.order_by(
        Alert.created_at.desc()
    ).offset(skip).limit(limit).all()

    return alerts


@router.get("/alerts/{alert_id}/details")
def get_alert_details(alert_id: int, db: Session = Depends(get_db)):
    """
    Admin endpoint: Get detailed alert information including user data.

    Args:
        alert_id: Alert ID
        db: Database session

    Returns:
        Detailed alert information

    Raises:
        HTTPException: If alert not found
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found"
        )

    user = db.query(User).filter(User.id == alert.user_id).first()
    session = None
    if alert.session_id:
        session = db.query(WalkSession).filter(WalkSession.id == alert.session_id).first()

    return {
        "alert": {
            "id": alert.id,
            "type": alert.type,
            "confidence": alert.confidence,
            "status": alert.status,
            "location_lat": alert.location_lat,
            "location_lng": alert.location_lng,
            "snapshot_url": alert.snapshot_url,
            "created_at": alert.created_at,
            "triggered_at": alert.triggered_at,
            "cancelled_at": alert.cancelled_at
        },
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "trusted_contacts": user.trusted_contacts
        },
        "session": {
            "id": session.id,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "active": session.active
        } if session else None
    }


@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):
    """
    Admin endpoint: Get system statistics.

    Args:
        db: Database session

    Returns:
        System statistics
    """
    # Get counts
    total_users = db.query(func.count(User.id)).scalar()
    active_sessions = db.query(func.count(WalkSession.id)).filter(
        WalkSession.active == True
    ).scalar()
    total_alerts = db.query(func.count(Alert.id)).scalar()

    # Alert breakdown by status
    alert_stats = {}
    for status_enum in AlertStatus:
        count = db.query(func.count(Alert.id)).filter(
            Alert.status == status_enum
        ).scalar()
        alert_stats[status_enum.value] = count

    # Alerts in last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_alerts = db.query(func.count(Alert.id)).filter(
        Alert.created_at >= yesterday
    ).scalar()

    # Triggered alerts in last 24 hours
    recent_triggered = db.query(func.count(Alert.id)).filter(
        Alert.created_at >= yesterday,
        Alert.status == AlertStatus.TRIGGERED
    ).scalar()

    return {
        "total_users": total_users,
        "active_walk_sessions": active_sessions,
        "total_alerts": total_alerts,
        "alert_breakdown": alert_stats,
        "alerts_last_24h": recent_alerts,
        "triggered_last_24h": recent_triggered
    }


@router.get("/users/active", response_model=List[dict])
def get_active_users(db: Session = Depends(get_db)):
    """
    Admin endpoint: Get all users with active walk sessions.

    Args:
        db: Database session

    Returns:
        List of users with their active sessions
    """
    active_sessions = db.query(WalkSession).filter(
        WalkSession.active == True
    ).all()

    result = []
    for session in active_sessions:
        user = db.query(User).filter(User.id == session.user_id).first()
        if user:
            result.append({
                "user_id": user.id,
                "user_name": user.name,
                "user_phone": user.phone,
                "session_id": session.id,
                "start_time": session.start_time,
                "location_lat": session.location_lat,
                "location_lng": session.location_lng
            })

    return result


@router.get("/alerts/recent")
def get_recent_alerts(
    hours: int = Query(default=24, ge=1, le=168),  # 1 hour to 1 week
    db: Session = Depends(get_db)
):
    """
    Admin endpoint: Get recent alerts within specified hours.

    Args:
        hours: Number of hours to look back (default: 24, max: 168)
        db: Database session

    Returns:
        List of recent alerts with user information
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)

    alerts = db.query(Alert).filter(
        Alert.created_at >= cutoff_time
    ).order_by(Alert.created_at.desc()).all()

    result = []
    for alert in alerts:
        user = db.query(User).filter(User.id == alert.user_id).first()
        result.append({
            "alert_id": alert.id,
            "type": alert.type,
            "confidence": alert.confidence,
            "status": alert.status,
            "created_at": alert.created_at,
            "user_name": user.name if user else "Unknown",
            "user_phone": user.phone if user else "Unknown",
            "location_lat": alert.location_lat,
            "location_lng": alert.location_lng
        })

    return {
        "hours": hours,
        "count": len(result),
        "alerts": result
    }
