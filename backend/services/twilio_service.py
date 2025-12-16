"""
Twilio service for SMS and voice call notifications.
Handles sending alerts to trusted contacts.
"""

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from typing import List, Dict, Optional
import logging

from config import settings

logger = logging.getLogger(__name__)


class TwilioService:
    """
    Service for sending SMS and voice calls via Twilio.
    Supports test mode for development without actually sending messages.
    """

    def __init__(self):
        """Initialize Twilio client."""
        self.test_mode = settings.test_mode

        if not self.test_mode:
            try:
                self.client = Client(
                    settings.twilio_account_sid,
                    settings.twilio_auth_token
                )
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
                self.client = None
        else:
            self.client = None
            logger.info("Twilio service running in TEST MODE")

    def send_sms(
        self,
        to: str,
        message: str
    ) -> Dict[str, any]:
        """
        Send an SMS message to a phone number.

        Args:
            to: Recipient phone number (E.164 format, e.g., +1234567890)
            message: Message body

        Returns:
            Dictionary with status and message_sid or error
        """
        if self.test_mode:
            logger.info(f"[TEST MODE] SMS to {to}: {message}")
            return {
                "success": True,
                "message_sid": "TEST_SID_" + str(hash(to + message)),
                "test_mode": True
            }

        if not self.client:
            logger.error("Twilio client not initialized")
            return {"success": False, "error": "Twilio client not initialized"}

        try:
            message_obj = self.client.messages.create(
                body=message,
                from_=settings.twilio_from,
                to=to
            )
            logger.info(f"SMS sent successfully to {to}. SID: {message_obj.sid}")
            return {
                "success": True,
                "message_sid": message_obj.sid,
                "test_mode": False
            }
        except TwilioRestException as e:
            logger.error(f"Twilio error sending SMS to {to}: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {to}: {e}")
            return {"success": False, "error": str(e)}

    def send_whatsapp(
        self,
        to: str,
        message: str
    ) -> Dict[str, any]:
        """
        Send a WhatsApp message to a phone number.

        Args:
            to: Recipient phone number (E.164 format, e.g., +1234567890)
            message: Message body

        Returns:
            Dictionary with status and message_sid or error
        """
        if self.test_mode:
            logger.info(f"[TEST MODE] WhatsApp to {to}: {message}")
            return {
                "success": True,
                "message_sid": "TEST_WHATSAPP_SID_" + str(hash(to + message)),
                "test_mode": True
            }

        if not self.client:
            logger.error("Twilio client not initialized")
            return {"success": False, "error": "Twilio client not initialized"}

        try:
            # Format numbers for WhatsApp (add whatsapp: prefix)
            whatsapp_to = f"whatsapp:{to}"
            whatsapp_from = f"whatsapp:{settings.twilio_from}"

            message_obj = self.client.messages.create(
                body=message,
                from_=whatsapp_from,
                to=whatsapp_to
            )
            logger.info(f"WhatsApp sent successfully to {to}. SID: {message_obj.sid}")
            return {
                "success": True,
                "message_sid": message_obj.sid,
                "test_mode": False
            }
        except TwilioRestException as e:
            logger.error(f"Twilio error sending WhatsApp to {to}: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error sending WhatsApp to {to}: {e}")
            return {"success": False, "error": str(e)}

    def send_voice_call(
        self,
        to: str,
        message: str
    ) -> Dict[str, any]:
        """
        Initiate a voice call with text-to-speech message.

        Args:
            to: Recipient phone number (E.164 format)
            message: Message to be spoken

        Returns:
            Dictionary with status and call_sid or error
        """
        if self.test_mode:
            logger.info(f"[TEST MODE] Voice call to {to}: {message}")
            return {
                "success": True,
                "call_sid": "TEST_CALL_SID_" + str(hash(to + message)),
                "test_mode": True
            }

        if not self.client:
            logger.error("Twilio client not initialized")
            return {"success": False, "error": "Twilio client not initialized"}

        try:
            # Create TwiML for text-to-speech
            twiml = f'<Response><Say voice="alice">{message}</Say></Response>'

            call = self.client.calls.create(
                twiml=twiml,
                to=to,
                from_=settings.twilio_from
            )
            logger.info(f"Voice call initiated to {to}. SID: {call.sid}")
            return {
                "success": True,
                "call_sid": call.sid,
                "test_mode": False
            }
        except TwilioRestException as e:
            logger.error(f"Twilio error initiating call to {to}: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error initiating call to {to}: {e}")
            return {"success": False, "error": str(e)}

    def send_emergency_alerts(
        self,
        user_name: str,
        user_phone: str,
        trusted_contacts: List[str],
        alert_type: str,
        location: Optional[Dict[str, float]] = None
    ) -> Dict[str, any]:
        """
        Send emergency alerts to all trusted contacts.

        Args:
            user_name: Name of the user in distress
            user_phone: Phone number of the user
            trusted_contacts: List of trusted contact phone numbers
            alert_type: Type of alert (scream, fall, etc.)
            location: Optional dict with 'lat' and 'lng' keys

        Returns:
            Dictionary with results for each contact
        """
        if not trusted_contacts:
            logger.warning(f"No trusted contacts for user {user_name}")
            return {"success": False, "error": "No trusted contacts configured"}

        # Build alert message
        location_str = ""
        if location and location.get('lat') and location.get('lng'):
            location_str = f"\nLocation: https://maps.google.com/?q={location['lat']},{location['lng']}"

        sms_message = (
            f"🚨 PROTEGO EMERGENCY ALERT 🚨\n\n"
            f"{user_name} ({user_phone}) may be in distress!\n"
            f"Alert Type: {alert_type.upper()}\n"
            f"Time: Just now"
            f"{location_str}\n\n"
            f"Please check on them immediately or contact emergency services."
        )

        voice_message = (
            f"Emergency alert from Protego. {user_name} may be in distress. "
            f"Alert type: {alert_type}. Please check on them immediately."
        )

        results = {
            "success": True,
            "contacts_notified": 0,
            "whatsapp_results": [],
            "sms_results": [],
            "call_results": []
        }

        # Send WhatsApp to all contacts (preferred for India)
        for contact in trusted_contacts:
            whatsapp_result = self.send_whatsapp(contact, sms_message)
            results["whatsapp_results"].append({
                "contact": contact,
                **whatsapp_result
            })
            if whatsapp_result.get("success"):
                results["contacts_notified"] += 1
            else:
                # Fallback to SMS if WhatsApp fails
                logger.warning(f"WhatsApp failed for {contact}, trying SMS fallback")
                sms_result = self.send_sms(contact, sms_message)
                results["sms_results"].append({
                    "contact": contact,
                    **sms_result
                })
                if sms_result.get("success"):
                    results["contacts_notified"] += 1

        # Optionally send voice calls (can be enabled per user preference)
        # For now, we'll just log the option
        logger.info(f"Voice calls available for {len(trusted_contacts)} contacts")

        return results


# Global Twilio service instance
twilio_service = TwilioService()
