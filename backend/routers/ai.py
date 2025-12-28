"""
AI Analysis Router for Protego.
Handles audio analysis, safety summaries, and AI assistant endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import User, Alert, WalkSession
from auth import get_current_user
from services.ai_service import ai_service, DistressType
from services.alert_manager import alert_manager
from config import settings

router = APIRouter()


# ==================== Request/Response Schemas ====================

class AudioAnalysisResponse(BaseModel):
    """Response for audio analysis."""
    transcription: str
    distress_detected: bool
    distress_type: str
    confidence: float
    keywords_found: List[str]
    alert_triggered: bool
    alert_id: Optional[int] = None


class SafetySummaryResponse(BaseModel):
    """Response for safety summary."""
    summary: str
    risk_level: str
    recommendations: List[str]
    alerts_analysis: str
    session_duration_minutes: int
    total_alerts: int


class ChatRequest(BaseModel):
    """Request for AI chat assistant."""
    message: str
    conversation_history: Optional[List[dict]] = None


class LocationSafetyRequest(BaseModel):
    """Request for location safety analysis."""
    latitude: float
    longitude: float
    timestamp: Optional[str] = None
    context: Optional[str] = None


class LocationSafetyResponse(BaseModel):
    """Response for location safety analysis."""
    safety_score: int
    status: str  # safe, caution, alert
    risk_level: str  # low, medium, high
    factors: List[str]
    recommendations: List[str]
    time_context: Optional[dict] = None
    analyzed_at: str


class ChatResponse(BaseModel):
    """Response from AI chat assistant."""
    response: str
    timestamp: datetime


class QuickAnalysisRequest(BaseModel):
    """Request for quick text analysis."""
    text: str
    context: Optional[str] = None


class QuickAnalysisResponse(BaseModel):
    """Response for quick text analysis."""
    is_emergency: bool
    confidence: float
    distress_type: str
    analysis: str
    recommended_action: str


# ==================== Endpoints ====================

@router.post("/analyze/audio", response_model=AudioAnalysisResponse)
async def analyze_audio(
    audio: UploadFile = File(...),
    session_id: Optional[int] = Form(None),
    location_lat: Optional[float] = Form(None),
    location_lng: Optional[float] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze uploaded audio for distress signals.
    Uses Whisper for transcription and keyword detection for distress analysis.

    If distress is detected with high confidence, automatically creates an alert.
    """
    # Validate file type
    allowed_types = ["audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/m4a"]
    if audio.content_type and audio.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format. Allowed: {', '.join(allowed_types)}"
        )

    # Read audio data
    audio_data = await audio.read()

    if len(audio_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty audio file"
        )

    # Analyze audio
    result = await ai_service.analyze_audio_for_distress(
        audio_data=audio_data,
        filename=audio.filename or "audio.webm"
    )

    alert_triggered = False
    alert_id = None

    # If distress detected with high confidence, create alert
    if result.distress_detected and result.confidence >= settings.alert_confidence_threshold:
        from models import Alert, AlertStatus, AlertType

        # Map distress type to alert type
        alert_type_map = {
            DistressType.SCREAM: AlertType.SCREAM,
            DistressType.HELP_CALL: AlertType.VOICE_ACTIVATION,
            DistressType.CRYING: AlertType.DISTRESS,
            DistressType.PANIC: AlertType.PANIC,
        }

        alert_type = alert_type_map.get(result.distress_type, AlertType.SOUND_ANOMALY)

        # Create alert
        new_alert = Alert(
            user_id=current_user.id,
            session_id=session_id,
            type=alert_type,
            confidence=result.confidence,
            status=AlertStatus.PENDING,
            location_lat=location_lat,
            location_lng=location_lng
        )

        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

        alert_id = new_alert.id
        alert_triggered = True

        # Start alert countdown in background
        if result.confidence >= settings.alert_confidence_threshold:
            import asyncio
            asyncio.create_task(alert_manager.start_alert_countdown(new_alert.id))

    return AudioAnalysisResponse(
        transcription=result.transcription,
        distress_detected=result.distress_detected,
        distress_type=result.distress_type.value,
        confidence=result.confidence,
        keywords_found=result.keywords_found,
        alert_triggered=alert_triggered,
        alert_id=alert_id
    )


@router.post("/analyze/text", response_model=QuickAnalysisResponse)
async def analyze_text(
    request: QuickAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze text for safety concerns using LLM.
    Useful for analyzing voice-to-text from frontend or manual input.
    """
    result = await ai_service.analyze_with_llm(
        transcription=request.text,
        context=request.context or ""
    )

    return QuickAnalysisResponse(
        is_emergency=result.get("is_emergency", False),
        confidence=result.get("confidence", 0.0),
        distress_type=result.get("distress_type", "NONE"),
        analysis=result.get("analysis", ""),
        recommended_action=result.get("recommended_action", "none")
    )


@router.get("/summary/session/{session_id}", response_model=SafetySummaryResponse)
async def get_session_summary(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated safety summary for a completed walk session.
    """
    # Fetch session
    session = db.query(WalkSession).filter(
        WalkSession.id == session_id,
        WalkSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # Calculate duration
    end_time = session.end_time or datetime.utcnow()
    duration_minutes = int((end_time - session.start_time).total_seconds() / 60)

    # Fetch alerts for this session
    alerts = db.query(Alert).filter(
        Alert.session_id == session_id
    ).all()

    alerts_data = [
        {
            "type": alert.type.value,
            "confidence": alert.confidence,
            "created_at": alert.created_at.isoformat(),
            "status": alert.status.value
        }
        for alert in alerts
    ]

    # Generate AI summary
    summary = await ai_service.generate_safety_summary(
        user_name=current_user.name,
        session_duration_minutes=duration_minutes,
        alerts=alerts_data
    )

    return SafetySummaryResponse(
        summary=summary.summary,
        risk_level=summary.risk_level,
        recommendations=summary.recommendations,
        alerts_analysis=summary.alerts_analysis,
        session_duration_minutes=duration_minutes,
        total_alerts=len(alerts)
    )


@router.get("/summary/latest", response_model=SafetySummaryResponse)
async def get_latest_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated safety summary for the most recent walk session.
    """
    # Fetch latest session
    session = db.query(WalkSession).filter(
        WalkSession.user_id == current_user.id
    ).order_by(WalkSession.start_time.desc()).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sessions found"
        )

    # Redirect to session summary
    return await get_session_summary(session.id, current_user, db)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Chat with AI safety assistant for tips and guidance.
    """
    response = await ai_service.chat_safety_assistant(
        message=request.message,
        conversation_history=request.conversation_history
    )

    return ChatResponse(
        response=response,
        timestamp=datetime.utcnow()
    )


@router.get("/tips")
async def get_safety_tips(
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-generated personalized safety tips.
    """
    response = await ai_service.chat_safety_assistant(
        message="Give me 5 practical safety tips for walking alone at night. Be concise."
    )

    return {
        "tips": response,
        "generated_at": datetime.utcnow().isoformat()
    }


@router.post("/analyze/location", response_model=LocationSafetyResponse)
async def analyze_location_safety(
    request: LocationSafetyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze location safety based on coordinates, time, and context.
    Returns safety score, status, risk factors, and recommendations.
    """
    result = await ai_service.analyze_location_safety(
        latitude=request.latitude,
        longitude=request.longitude,
        timestamp=request.timestamp,
        user_context=request.context
    )

    return LocationSafetyResponse(
        safety_score=result.get("safety_score", 75),
        status=result.get("status", "caution"),
        risk_level=result.get("risk_level", "low"),
        factors=result.get("factors", []),
        recommendations=result.get("recommendations", []),
        time_context=result.get("time_context"),
        analyzed_at=result.get("analyzed_at", datetime.utcnow().isoformat())
    )


@router.get("/status")
async def get_ai_status():
    """
    Get AI service status and configuration.
    """
    return {
        "whisper_configured": bool(settings.whisper_api_key),
        "megallm_configured": bool(settings.megallm_api_key),
        "test_mode": settings.test_mode,
        "model": settings.megallm_model,
        "confidence_threshold": settings.alert_confidence_threshold
    }
