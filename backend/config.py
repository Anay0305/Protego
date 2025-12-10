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
    allowed_origins: str = "http://localhost:5173,http://localhost:3000,https://localhost:8000"

    # Environment
    environment: str = "development"

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
