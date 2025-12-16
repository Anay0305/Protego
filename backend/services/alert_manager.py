"""
Alert manager service for handling alert lifecycle.
Manages countdown timers, cancellation, and notification triggers.
"""

import asyncio
from datetime import datetime
from typing import Optional, Dict
import logging

from sqlalchemy.orm import Session
from models import Alert, User, AlertStatus
from services.twilio_service import twilio_service
from config import settings

logger = logging.getLogger(__name__)


class AlertManager:
    """
    Manages alert countdown timers and notification triggers.
    Maintains a registry of pending alerts and their countdown tasks.
    """

    def __init__(self):
        """Initialize alert manager with empty pending alerts registry."""
        self.pending_alerts: Dict[int, asyncio.Task] = {}

    async def start_alert_countdown(
        self,
        alert_id: int
    ) -> bool:
        """
        Start countdown timer for an alert.
        If not cancelled within countdown period, triggers notifications.

        Args:
            alert_id: ID of the alert to start countdown for

        Returns:
            True if countdown started successfully
        """
        # Check if alert already has a pending countdown
        if alert_id in self.pending_alerts:
            logger.warning(f"Alert {alert_id} already has pending countdown")
            return False

        # Create countdown task (will create its own db session)
        task = asyncio.create_task(
            self._countdown_and_trigger(alert_id)
        )
        self.pending_alerts[alert_id] = task

        logger.info(
            f"Started {settings.alert_countdown_seconds}s countdown for alert {alert_id}"
        )
        return True

    async def cancel_alert(
        self,
        alert_id: int,
        db: Session
    ) -> bool:
        """
        Cancel a pending alert countdown.

        Args:
            alert_id: ID of the alert to cancel
            db: Database session

        Returns:
            True if alert was cancelled, False if not found or already triggered
        """
        # Cancel the countdown task if it exists
        if alert_id in self.pending_alerts:
            task = self.pending_alerts[alert_id]
            task.cancel()
            del self.pending_alerts[alert_id]

            # Update alert status in database
            alert = db.query(Alert).filter(Alert.id == alert_id).first()
            if alert:
                alert.status = AlertStatus.CANCELLED
                alert.cancelled_at = datetime.utcnow()
                db.commit()
                db.refresh(alert)

                logger.info(f"Alert {alert_id} cancelled by user")
                return True

        logger.warning(f"Alert {alert_id} not found in pending alerts")
        return False

    async def _countdown_and_trigger(
        self,
        alert_id: int
    ) -> None:
        """
        Internal method to handle countdown and trigger notifications.
        Creates its own database session to avoid stale session issues.

        Args:
            alert_id: ID of the alert
        """
        from database import SessionLocal

        try:
            # Wait for countdown period
            await asyncio.sleep(settings.alert_countdown_seconds)

            # Create fresh database session for the background task
            db = SessionLocal()
            try:
                # After countdown, trigger the alert
                await self._trigger_alert(alert_id, db)
            finally:
                db.close()

        except asyncio.CancelledError:
            logger.info(f"Countdown for alert {alert_id} was cancelled")
        except Exception as e:
            logger.error(f"Error in countdown for alert {alert_id}: {e}")
        finally:
            # Remove from pending alerts
            if alert_id in self.pending_alerts:
                del self.pending_alerts[alert_id]

    async def _trigger_alert(
        self,
        alert_id: int,
        db: Session
    ) -> None:
        """
        Trigger an alert by sending notifications to trusted contacts.

        Args:
            alert_id: ID of the alert to trigger
            db: Database session
        """
        # Fetch alert from database
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            logger.error(f"Alert {alert_id} not found in database")
            return

        # Fetch user and trusted contacts
        user = db.query(User).filter(User.id == alert.user_id).first()
        if not user:
            logger.error(f"User {alert.user_id} not found for alert {alert_id}")
            return

        # Prepare location data
        location = None
        if alert.location_lat and alert.location_lng:
            location = {
                "lat": alert.location_lat,
                "lng": alert.location_lng
            }

        logger.info(
            f"Triggering alert {alert_id} for user {user.name} (type: {alert.type})"
        )

        # Send emergency alerts via Twilio
        notification_result = twilio_service.send_emergency_alerts(
            user_name=user.name,
            user_phone=user.phone,
            trusted_contacts=user.trusted_contacts,
            alert_type=alert.type.value,
            location=location
        )

        # Update alert status
        alert.status = AlertStatus.TRIGGERED
        alert.triggered_at = datetime.utcnow()
        db.commit()
        db.refresh(alert)

        logger.info(
            f"Alert {alert_id} triggered successfully. "
            f"Notified {notification_result.get('contacts_notified', 0)} contacts."
        )

    def get_pending_alert_ids(self) -> list[int]:
        """
        Get list of all pending alert IDs.

        Returns:
            List of alert IDs with active countdowns
        """
        return list(self.pending_alerts.keys())


# Global alert manager instance
alert_manager = AlertManager()
