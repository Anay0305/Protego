"""
Configuration management for Protego backend.
Uses pydantic-settings for type-safe environment variable handling.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str

    # Twilio
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_from: str
    test_mode: bool = True

    # Alert Configuration
    alert_confidence_threshold: float = 0.8
    alert_countdown_seconds: int = 5

    # Security
    secret_key: str
    algorithm: str = "HS256"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # Environment
    environment: str = "development"

    # AI Services
    whisper_endpoint: str = "https://chutes-whisper-large-v3.chutes.ai/transcribe"
    whisper_api_key: str = ""
    megallm_endpoint: str = "https://api.megallm.io/v1/chat/completions"
    megallm_api_key: str = ""
    megallm_model: str = "gpt-4.1"

    # Azure OpenAI Realtime (for real-time voice analysis)
    azure_openai_realtime_endpoint: str = ""
    azure_openai_realtime_api_key: str = ""
    azure_openai_realtime_deployment: str = "gpt-4o-realtime-preview"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"


# Global settings instance
settings = Settings()
