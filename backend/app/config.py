import os
import secrets
from functools import lru_cache
from typing import List, Optional, Union

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
    sql_echo: Optional[bool] = None

    @property
    def async_database_url(self) -> str:
        """Convert database URL to async driver."""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    # Google Gemini 3 Flash Preview (Native SDK)
    gemini_api_key: str
    llm_model_name: str = "gemini-3-flash-preview"

    # LLM token budget tunables (override via env to control cost)
    llm_max_history_turns: int = 6          # conversation turns sent to Gemini
    llm_parse_max_tokens: int = 600         # max output tokens for intent parsing
    llm_action_max_tokens: int = 400        # max output tokens for action responses
    llm_helpful_max_tokens: int = 300       # max output tokens for chat responses
    llm_cache_size: int = 128               # LRU cache entries for dedup

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

    # SMTP / Email
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    smtp_from: Optional[str] = None  # e.g. "ChronosAI <no-reply@yourdomain.com>"

    # Reminder scheduling
    # Accept str so pydantic doesn't reject comma-separated env values like "1440,60,15"
    reminder_minutes_before: Union[int, str] = 15
    reminder_schedule_minutes: Optional[Union[List[int], str]] = None

    # CORS
    cors_origins: Optional[Union[List[str], str]] = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # ── Auto-generate missing secret keys ────────────────────────────
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

        # ── Normalize reminder env vars to canonical types ───────────────
        try:
            # reminder_schedule_minutes: str → list[int]
            if isinstance(self.reminder_schedule_minutes, str):
                parts = [p.strip() for p in self.reminder_schedule_minutes.split(",") if p.strip()]
                self.reminder_schedule_minutes = [int(p) for p in parts] if parts else None

            # reminder_minutes_before: str → int  (may contain CSV by mistake)
            if isinstance(self.reminder_minutes_before, str):
                if "," in self.reminder_minutes_before:
                    parts = [p.strip() for p in self.reminder_minutes_before.split(",") if p.strip()]
                    parsed = [int(p) for p in parts]
                    if not self.reminder_schedule_minutes:
                        self.reminder_schedule_minutes = parsed
                    self.reminder_minutes_before = parsed[0] if parsed else 15
                else:
                    self.reminder_minutes_before = int(self.reminder_minutes_before)

            if isinstance(self.reminder_minutes_before, float):
                self.reminder_minutes_before = int(self.reminder_minutes_before)

            # Coerce any remaining str items in the list
            if isinstance(self.reminder_schedule_minutes, list):
                coerced = []
                for item in self.reminder_schedule_minutes:
                    val = int(str(item).strip()) if isinstance(item, str) else int(item)
                    coerced.append(val)
                self.reminder_schedule_minutes = sorted(set(coerced)) if coerced else None
        except Exception:
            # Fallback to safe defaults
            try:
                self.reminder_minutes_before = int(self.reminder_minutes_before)
            except Exception:
                self.reminder_minutes_before = 15
            if not isinstance(self.reminder_schedule_minutes, list):
                self.reminder_schedule_minutes = None

        # ── Override redirect URIs in production ─────────────────────────
        is_production = os.getenv("RENDER") is not None or os.getenv("RENDER") == "true" or \
                        os.getenv("DIGITALOCEAN") is not None or self.app_env == "production"

        if is_production:
            app_url = os.getenv("APP_URL") or os.getenv("BASE_URL") or os.getenv("BACKEND_PUBLIC_URL")

            if app_url:
                app_url_str = str(app_url).rstrip("/")
                if not self.google_redirect_uri or "localhost" in str(self.google_redirect_uri):
                    self.google_redirect_uri = AnyHttpUrl(f"{app_url_str}/api/v1/auth/google/callback")
                if not self.microsoft_redirect_uri or "localhost" in str(self.microsoft_redirect_uri):
                    self.microsoft_redirect_uri = AnyHttpUrl(f"{app_url_str}/api/v1/auth/outlook/callback")
                if not self.zoom_redirect_uri or "localhost" in str(self.zoom_redirect_uri):
                    self.zoom_redirect_uri = AnyHttpUrl(f"{app_url_str}/api/v1/auth/zoom/callback")
                if "localhost" in str(self.frontend_url):
                    self.frontend_url = AnyHttpUrl(os.getenv("FRONTEND_URL") or app_url_str)
            elif os.getenv("FRONTEND_URL") and "localhost" in str(self.frontend_url):
                self.frontend_url = AnyHttpUrl(os.getenv("FRONTEND_URL"))

        # ── CORS ─────────────────────────────────────────────────────────
        if isinstance(self.cors_origins, str):
            parts = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
            self.cors_origins = parts
        elif not isinstance(self.cors_origins, list) or self.cors_origins is None:
            self.cors_origins = []

        if self.frontend_url and str(self.frontend_url) not in self.cors_origins:
            self.cors_origins.append(str(self.frontend_url))

        if is_production and os.getenv("FRONTEND_URL"):
            frontend_origin = os.getenv("FRONTEND_URL").rstrip("/")
            if frontend_origin not in self.cors_origins:
                self.cors_origins.append(frontend_origin)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Get cached settings instance to ensure consistent secret keys."""
    return Settings()  # type: ignore[call-arg]


# Back-compat for existing imports
settings = get_settings()

