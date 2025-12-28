"""
AI Service for Protego - Audio Analysis and LLM Integration.
Handles Whisper transcription, scream detection, and safety analysis.
"""

import httpx
import logging
import base64
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from config import settings

logger = logging.getLogger(__name__)


class DistressType(str, Enum):
    """Types of distress detected in audio."""
    SCREAM = "SCREAM"
    HELP_CALL = "HELP_CALL"
    CRYING = "CRYING"
    PANIC = "PANIC"
    NONE = "NONE"


@dataclass
class WhisperSegment:
    """Segment from Whisper transcription."""
    text: str
    start: float
    end: float


@dataclass
class AudioAnalysisResult:
    """Result of audio analysis."""
    transcription: str
    distress_detected: bool
    distress_type: DistressType
    confidence: float
    keywords_found: List[str]
    segments: List[WhisperSegment]


@dataclass
class SafetySummary:
    """AI-generated safety summary."""
    summary: str
    risk_level: str  # low, medium, high
    recommendations: List[str]
    alerts_analysis: str


# Distress keywords for detection
DISTRESS_KEYWORDS = [
    "help", "help me", "someone help", "please help",
    "stop", "let me go", "leave me alone",
    "no", "don't", "please don't",
    "emergency", "call 911", "police",
    "fire", "attack", "danger",
    "hurt", "pain", "scared",
    "run", "get away", "save me"
]

SCREAM_INDICATORS = [
    "scream", "screaming", "yell", "yelling",
    "shout", "shouting", "cry", "crying",
    "[scream]", "[screaming]", "[yelling]",
    "[inaudible]", "[noise]", "[loud noise]"
]


class AIService:
    """
    AI Service for audio analysis and safety intelligence.
    Integrates Whisper for transcription and MegaLLM for analysis.
    """

    def __init__(self):
        """Initialize AI service with API configurations."""
        self.whisper_endpoint = settings.whisper_endpoint
        self.whisper_api_key = settings.whisper_api_key
        self.megallm_endpoint = settings.megallm_endpoint
        self.megallm_api_key = settings.megallm_api_key
        self.megallm_model = settings.megallm_model
        self.test_mode = settings.test_mode

        if not self.whisper_api_key:
            logger.warning("Whisper API key not configured")
        if not self.megallm_api_key:
            logger.warning("MegaLLM API key not configured")

    async def transcribe_audio(
        self,
        audio_data: bytes,
        filename: str = "audio.webm",
        content_type: str = "audio/webm"
    ) -> List[WhisperSegment]:
        """
        Transcribe audio using Whisper API.

        Args:
            audio_data: Raw audio bytes
            filename: Name of the audio file
            content_type: MIME type of the audio

        Returns:
            List of WhisperSegment with timestamps
        """
        if self.test_mode or not self.whisper_api_key:
            logger.info("[TEST MODE] Simulating Whisper transcription")
            return [WhisperSegment(
                text="[Test transcription - AI service in test mode]",
                start=0.0,
                end=1.0
            )]

        try:
            import base64

            async with httpx.AsyncClient(timeout=60.0) as client:
                # Chutes Whisper API expects base64 encoded audio as "audio_b64"
                audio_b64 = base64.b64encode(audio_data).decode('utf-8')

                headers = {
                    "Authorization": f"Bearer {self.whisper_api_key}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "audio_b64": audio_b64
                }

                response = await client.post(
                    self.whisper_endpoint,
                    json=payload,
                    headers=headers
                )

                if response.status_code != 200:
                    logger.error(f"Whisper API error: {response.status_code} - {response.text}")
                    return []

                # Chutes Whisper API returns text/plain, not JSON
                content_type = response.headers.get("content-type", "")

                if "text/plain" in content_type or not content_type.startswith("application/json"):
                    # Plain text response
                    text = response.text.strip()
                    if text:
                        logger.info(f"Transcribed: {text[:100]}...")
                        return [WhisperSegment(text=text, start=0.0, end=0.0)]
                    return []

                # Fallback: try JSON parsing for other Whisper API formats
                try:
                    result = response.json()
                    segments = []

                    if "segments" in result:
                        for seg in result["segments"]:
                            segments.append(WhisperSegment(
                                text=seg.get("text", "").strip(),
                                start=seg.get("start", 0.0),
                                end=seg.get("end", 0.0)
                            ))
                    elif "text" in result:
                        segments.append(WhisperSegment(
                            text=result["text"].strip(),
                            start=0.0,
                            end=0.0
                        ))

                    logger.info(f"Transcribed {len(segments)} segments")
                    return segments
                except Exception as json_err:
                    # If JSON fails, treat as plain text
                    text = response.text.strip()
                    if text:
                        return [WhisperSegment(text=text, start=0.0, end=0.0)]
                    return []

        except Exception as e:
            logger.error(f"Whisper transcription error: {e}")
            return []

    async def analyze_audio_for_distress(
        self,
        audio_data: bytes,
        filename: str = "audio.webm"
    ) -> AudioAnalysisResult:
        """
        Analyze audio for signs of distress.
        Combines Whisper transcription with keyword detection.

        Args:
            audio_data: Raw audio bytes
            filename: Name of the audio file

        Returns:
            AudioAnalysisResult with distress detection
        """
        # First, transcribe the audio
        segments = await self.transcribe_audio(audio_data, filename)

        # Combine all text
        full_text = " ".join(seg.text for seg in segments).lower()

        # Check for distress keywords
        keywords_found = []
        for keyword in DISTRESS_KEYWORDS:
            if keyword.lower() in full_text:
                keywords_found.append(keyword)

        # Check for scream indicators
        scream_detected = False
        for indicator in SCREAM_INDICATORS:
            if indicator.lower() in full_text:
                scream_detected = True
                keywords_found.append(indicator)
                break

        # Determine distress type and confidence
        distress_type = DistressType.NONE
        confidence = 0.0

        if scream_detected:
            distress_type = DistressType.SCREAM
            confidence = 0.9
        elif any(kw in ["help", "help me", "someone help", "please help"] for kw in keywords_found):
            distress_type = DistressType.HELP_CALL
            confidence = 0.95
        elif any(kw in ["crying", "cry"] for kw in keywords_found):
            distress_type = DistressType.CRYING
            confidence = 0.7
        elif len(keywords_found) >= 2:
            distress_type = DistressType.PANIC
            confidence = 0.8
        elif len(keywords_found) == 1:
            distress_type = DistressType.PANIC
            confidence = 0.6

        distress_detected = distress_type != DistressType.NONE and confidence >= 0.6

        return AudioAnalysisResult(
            transcription=full_text,
            distress_detected=distress_detected,
            distress_type=distress_type,
            confidence=confidence,
            keywords_found=keywords_found,
            segments=segments
        )

    async def analyze_with_llm(
        self,
        transcription: str,
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Use MegaLLM to analyze transcription for safety concerns.

        Args:
            transcription: Text to analyze
            context: Additional context about the situation

        Returns:
            LLM analysis result
        """
        if self.test_mode or not self.megallm_api_key:
            logger.info("[TEST MODE] Simulating LLM analysis")
            return {
                "is_emergency": False,
                "confidence": 0.5,
                "analysis": "Test mode - no actual analysis performed",
                "recommended_action": "none"
            }

        try:
            system_prompt = """You are a safety analysis AI for Protego, a personal safety app.
Analyze the provided audio transcription for signs of distress or emergency.

Respond in JSON format:
{
    "is_emergency": boolean,
    "confidence": float (0-1),
    "distress_type": "SCREAM" | "HELP_CALL" | "PANIC" | "NONE",
    "analysis": "brief explanation",
    "recommended_action": "trigger_alert" | "monitor" | "none"
}

Be sensitive to:
- Calls for help (explicit or implicit)
- Signs of fear or panic
- Indicators of physical danger
- Background sounds suggesting distress"""

            user_prompt = f"""Analyze this audio transcription for safety concerns:

Transcription: "{transcription}"

{f"Additional context: {context}" if context else ""}

Provide your safety analysis in JSON format."""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.megallm_endpoint,
                    headers={
                        "Authorization": f"Bearer {self.megallm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.megallm_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 4000
                    }
                )

                if response.status_code != 200:
                    logger.error(f"MegaLLM API error: {response.status_code} - {response.text}")
                    return {"error": "LLM analysis failed"}

                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")

                # Try to parse JSON from response
                import json
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"analysis": content, "is_emergency": False}

        except Exception as e:
            logger.error(f"LLM analysis error: {e}")
            return {"error": str(e)}

    async def generate_safety_summary(
        self,
        user_name: str,
        session_duration_minutes: int,
        alerts: List[Dict],
        location_history: List[Dict] = None
    ) -> SafetySummary:
        """
        Generate an AI-powered safety summary for a walk session.

        Args:
            user_name: Name of the user
            session_duration_minutes: Duration of the walk session
            alerts: List of alerts during the session
            location_history: Optional location data

        Returns:
            SafetySummary with AI analysis
        """
        if self.test_mode or not self.megallm_api_key:
            # Return a meaningful summary even in test mode
            risk_level = "low"
            if len(alerts) > 0:
                risk_level = "medium" if len(alerts) < 3 else "high"

            return SafetySummary(
                summary=f"Walk session completed. Duration: {session_duration_minutes} minutes. "
                        f"Alerts triggered: {len(alerts)}.",
                risk_level=risk_level,
                recommendations=[
                    "Stay aware of your surroundings",
                    "Keep your phone charged",
                    "Share your location with trusted contacts"
                ],
                alerts_analysis=f"{len(alerts)} alert(s) recorded during this session."
            )

        try:
            # Build context for LLM
            alerts_text = ""
            if alerts:
                alerts_text = "\n".join([
                    f"- {a.get('type', 'Unknown')} alert at {a.get('created_at', 'unknown time')} "
                    f"(confidence: {a.get('confidence', 0):.0%})"
                    for a in alerts
                ])
            else:
                alerts_text = "No alerts during this session."

            prompt = f"""Generate a safety summary for this walk session:

User: {user_name}
Duration: {session_duration_minutes} minutes
Alerts:
{alerts_text}

Provide a JSON response with:
{{
    "summary": "Brief summary of the session",
    "risk_level": "low" | "medium" | "high",
    "recommendations": ["list", "of", "safety", "tips"],
    "alerts_analysis": "Analysis of any alerts that occurred"
}}"""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.megallm_endpoint,
                    headers={
                        "Authorization": f"Bearer {self.megallm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.megallm_model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a safety assistant. Provide helpful, reassuring safety summaries."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.5,
                        "max_tokens": 4000
                    }
                )

                if response.status_code != 200:
                    raise Exception(f"API error: {response.status_code}")

                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")

                import json
                try:
                    data = json.loads(content)
                    return SafetySummary(
                        summary=data.get("summary", "Session completed."),
                        risk_level=data.get("risk_level", "low"),
                        recommendations=data.get("recommendations", []),
                        alerts_analysis=data.get("alerts_analysis", "")
                    )
                except json.JSONDecodeError:
                    return SafetySummary(
                        summary=content[:200],
                        risk_level="low",
                        recommendations=[],
                        alerts_analysis=""
                    )

        except Exception as e:
            logger.error(f"Safety summary generation error: {e}")
            return SafetySummary(
                summary=f"Session completed. Duration: {session_duration_minutes} minutes.",
                risk_level="low",
                recommendations=["Stay safe!"],
                alerts_analysis=""
            )

    async def chat_safety_assistant(
        self,
        message: str,
        conversation_history: List[Dict] = None
    ) -> str:
        """
        Chat with AI safety assistant for tips and guidance.

        Args:
            message: User's message
            conversation_history: Previous messages for context

        Returns:
            AI assistant response
        """
        if self.test_mode or not self.megallm_api_key:
            return ("I'm Protego's AI safety assistant. I can help you with safety tips, "
                   "explain how alerts work, and provide guidance during your walks. "
                   "How can I help you stay safe today?")

        try:
            system_prompt = """You are Protego's AI Safety Assistant - a helpful, caring companion
focused on personal safety. You help users:
- Understand safety features
- Get personalized safety tips
- Feel reassured during walks
- Learn about emergency procedures

Be warm, supportive, and concise. Focus on practical safety advice."""

            messages = [{"role": "system", "content": system_prompt}]

            if conversation_history:
                messages.extend(conversation_history[-10:])  # Keep last 10 messages

            messages.append({"role": "user", "content": message})

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.megallm_endpoint,
                    headers={
                        "Authorization": f"Bearer {self.megallm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.megallm_model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 4000
                    }
                )

                if response.status_code != 200:
                    return "I'm having trouble connecting right now. Please try again later."

                result = response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content",
                    "I'm here to help with your safety questions!")

        except Exception as e:
            logger.error(f"Chat assistant error: {e}")
            return "I'm having trouble responding right now. Please try again."


    async def analyze_location_safety(
        self,
        latitude: float,
        longitude: float,
        timestamp: str = None,
        user_context: str = None
    ) -> Dict[str, Any]:
        """
        Analyze location safety using AI based on time, coordinates, and context.

        Args:
            latitude: Location latitude
            longitude: Location longitude
            timestamp: Current timestamp (ISO format)
            user_context: Additional context about the user's situation

        Returns:
            Safety analysis with score, status, and factors
        """
        from datetime import datetime

        # Parse time info
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except:
                dt = datetime.now()
        else:
            dt = datetime.now()

        hour = dt.hour
        is_night = hour < 6 or hour > 20
        is_late_night = hour < 5 or hour > 22
        day_of_week = dt.strftime("%A")
        is_weekend = day_of_week in ["Saturday", "Sunday"]

        # If test mode or no API key, use heuristic-based analysis
        if self.test_mode or not self.megallm_api_key:
            logger.info("[TEST MODE] Using heuristic safety analysis")

            # Base score
            safety_score = 85

            # Time-based adjustments
            if is_late_night:
                safety_score -= 25
            elif is_night:
                safety_score -= 15

            # Weekend late night adjustment
            if is_weekend and is_late_night:
                safety_score -= 5

            # Clamp score
            safety_score = max(20, min(100, safety_score))

            # Determine status
            if safety_score >= 75:
                status = "safe"
            elif safety_score >= 50:
                status = "caution"
            else:
                status = "alert"

            factors = []
            if is_late_night:
                factors.append("Late night hours - reduced visibility and fewer people around")
            elif is_night:
                factors.append("Evening hours - stay alert and stick to well-lit areas")
            if is_weekend and is_night:
                factors.append("Weekend night - be aware of your surroundings")

            return {
                "safety_score": safety_score,
                "status": status,
                "risk_level": "high" if safety_score < 50 else "medium" if safety_score < 75 else "low",
                "factors": factors if factors else ["Conditions appear normal"],
                "recommendations": [
                    "Keep your phone charged and accessible",
                    "Share your live location with trusted contacts",
                    "Stay on well-lit, populated routes"
                ] if safety_score < 75 else ["Enjoy your walk! Stay aware of your surroundings."],
                "time_context": {
                    "hour": hour,
                    "is_night": is_night,
                    "is_late_night": is_late_night,
                    "day_of_week": day_of_week
                },
                "analyzed_at": dt.isoformat()
            }

        # Use LLM for more sophisticated analysis
        try:
            prompt = f"""Analyze the safety conditions for a person walking at this location and time:

Location: {latitude}, {longitude}
Time: {dt.strftime("%I:%M %p")} on {day_of_week}
Hour: {hour}:00
Night time: {is_night}
Late night (after 10pm or before 5am): {is_late_night}
{f"User context: {user_context}" if user_context else ""}

Provide a safety analysis in JSON format:
{{
    "safety_score": <integer 0-100>,
    "status": "safe" | "caution" | "alert",
    "risk_level": "low" | "medium" | "high",
    "factors": ["list of factors affecting safety"],
    "recommendations": ["personalized safety tips"]
}}

Consider:
- Time of day (darkness, activity levels)
- Day of week patterns
- General urban safety principles
- Walking alone considerations

Be realistic but not alarmist. Focus on actionable advice."""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.megallm_endpoint,
                    headers={
                        "Authorization": f"Bearer {self.megallm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.megallm_model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a safety analysis AI. Provide realistic, helpful safety assessments for people walking. Be balanced - not alarmist but appropriately cautious."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.4,
                        "max_tokens": 4000
                    }
                )

                if response.status_code != 200:
                    logger.error(f"MegaLLM API error: {response.status_code}")
                    # Fall back to heuristic
                    return await self.analyze_location_safety(latitude, longitude, timestamp, user_context)

                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")

                import json
                try:
                    analysis = json.loads(content)
                    analysis["time_context"] = {
                        "hour": hour,
                        "is_night": is_night,
                        "is_late_night": is_late_night,
                        "day_of_week": day_of_week
                    }
                    analysis["analyzed_at"] = dt.isoformat()
                    return analysis
                except json.JSONDecodeError:
                    logger.error("Failed to parse LLM response as JSON")
                    # Fall back to heuristic by calling with test_mode behavior
                    self.test_mode = True
                    result = await self.analyze_location_safety(latitude, longitude, timestamp, user_context)
                    self.test_mode = settings.test_mode
                    return result

        except Exception as e:
            logger.error(f"Location safety analysis error: {e}")
            # Return a safe default
            return {
                "safety_score": 75,
                "status": "caution",
                "risk_level": "low",
                "factors": ["Unable to complete full analysis"],
                "recommendations": ["Stay aware of your surroundings"],
                "analyzed_at": dt.isoformat()
            }


# Global AI service instance
ai_service = AIService()
