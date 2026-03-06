from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = "development"
    secret_key: str
    encryption_key: str  # Fernet.generate_key() output (base64 urlsafe)
    frontend_url: AnyHttpUrl = AnyHttpUrl("http://localhost:5173")

    # Database
    database_url: str

    # DeepSeek AI (OpenAI-compatible)
    openai_api_key: str
    openai_model: str = "deepseek-chat"
    openai_base_url: str = "https://api.deepseek.com"

    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[AnyHttpUrl] = None

    # Microsoft OAuth
    microsoft_client_id: Optional[str] = None
    microsoft_client_secret: Optional[str] = None
    microsoft_redirect_uri: Optional[AnyHttpUrl] = None
    microsoft_tenant_id: str = "common"

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # CORS
    cors_origins: List[str] = []


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


# Back-compat for existing imports
settings = get_settings()

