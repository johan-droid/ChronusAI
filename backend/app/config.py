import os
import secrets
from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", ".env.local"],
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = "development"
    secret_key: str = ""  # Will be generated if empty
    encryption_key: str = ""  # Will be generated if empty
    frontend_url: AnyHttpUrl = AnyHttpUrl("http://localhost:5173")

    # Database
    database_url: str

    @property
    def async_database_url(self) -> str:
        """Convert database URL to async driver."""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # Google Gemini 3 Flash Preview (Native SDK)
    gemini_api_key: str
    llm_model_name: str = "gemini-3-flash-preview"

    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[AnyHttpUrl] = AnyHttpUrl("http://localhost:8000/api/v1/auth/google/callback")

    # Microsoft OAuth
    microsoft_client_id: Optional[str] = None
    microsoft_client_secret: Optional[str] = None
    microsoft_redirect_uri: Optional[AnyHttpUrl] = AnyHttpUrl("http://localhost:8000/api/v1/auth/outlook/callback")
    microsoft_tenant_id: str = "common"

    # Zoom OAuth
    zoom_client_id: Optional[str] = None
    zoom_client_secret: Optional[str] = None
    zoom_redirect_uri: Optional[AnyHttpUrl] = AnyHttpUrl("http://localhost:8000/api/v1/auth/zoom/callback")

    # JWT
    jwt_secret_key: str = ""  # Will be generated if empty
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours instead of 1 hour

    # CORS
    cors_origins: List[str] = []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Auto-generate missing secret keys for security
        # Only generate if truly empty (not falsy)
        if self.secret_key == "":
            self.secret_key = secrets.token_urlsafe(32)
            print("🔑 Generated SECRET_KEY")
            
        if self.encryption_key == "":
            from cryptography.fernet import Fernet
            self.encryption_key = Fernet.generate_key().decode()
            print("🔐 Generated ENCRYPTION_KEY")
            
        if self.jwt_secret_key == "":
            self.jwt_secret_key = secrets.token_urlsafe(32)
            print("🎫 Generated JWT_SECRET_KEY")
        
        # Override redirect URIs in production environment
        is_production = os.getenv("RENDER") is not None or os.getenv("RENDER") == "true" or self.app_env == "production"
        if is_production:
            if not self.google_redirect_uri or "localhost" in str(self.google_redirect_uri):
                self.google_redirect_uri = AnyHttpUrl("https://chronusai.onrender.com/api/v1/auth/google/callback")
            if not self.microsoft_redirect_uri or "localhost" in str(self.microsoft_redirect_uri):
                self.microsoft_redirect_uri = AnyHttpUrl("https://chronusai.onrender.com/api/v1/auth/outlook/callback")
            if not self.zoom_redirect_uri or "localhost" in str(self.zoom_redirect_uri):
                self.zoom_redirect_uri = AnyHttpUrl("https://chronusai.onrender.com/api/v1/auth/zoom/callback")
            if "localhost" in str(self.frontend_url):
                self.frontend_url = AnyHttpUrl(os.getenv("FRONTEND_URL") or "https://chronusai.onrender.com")
        
        # Ensure CORS includes frontend URLs
        if self.frontend_url and str(self.frontend_url) not in self.cors_origins:
            self.cors_origins.append(str(self.frontend_url))
        
        # Add production URLs to CORS
        if is_production:
            production_urls = [
                "https://chronusai.onrender.com"
            ]
            for url in production_urls:
                if url not in self.cors_origins:
                    self.cors_origins.append(url)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Get cached settings instance to ensure consistent secret keys."""
    return Settings()  # type: ignore[call-arg]


# Back-compat for existing imports
settings = get_settings()

