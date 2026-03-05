import secrets
import hashlib
import base64
from typing import Any, Dict
from urllib.parse import urlencode
import httpx
from app.config import settings


class OAuth2Provider:
    def __init__(self, provider: str):
        self.provider = provider
        if provider == "google":
            self.auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
            self.token_url = "https://oauth2.googleapis.com/token"
            self.client_id = settings.google_client_id
            self.client_secret = settings.google_client_secret
            self.redirect_uri = settings.google_redirect_uri
            self.scopes = [
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/calendar.readonly"
            ]
        elif provider == "outlook":
            self.auth_url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
            self.token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
            self.client_id = settings.microsoft_client_id
            self.client_secret = settings.microsoft_client_secret
            self.redirect_uri = settings.microsoft_redirect_uri
            self.scopes = [
                "Calendars.ReadWrite",
                "offline_access"
            ]
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def generate_pkce(self) -> tuple[str, str]:
        """Generate PKCE code verifier and challenge."""
        code_verifier_bytes = secrets.token_bytes(32)
        code_verifier = base64.urlsafe_b64encode(code_verifier_bytes).decode('utf-8')
        code_verifier = code_verifier.rstrip('=')
        
        # Create code challenge
        code_challenge_bytes = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        code_challenge = base64.urlsafe_b64encode(code_challenge_bytes).decode('utf-8')
        code_challenge = code_challenge.replace('=', '')
        
        return code_verifier, code_challenge
    
    @staticmethod
    def _get_oauth_provider(provider: str) -> "OAuth2Provider":
        """Get OAuth provider instance."""
        return OAuth2Provider(provider)
    
    def get_authorization_url(self, code_challenge: str | None, state: str) -> str:
        """Get the authorization URL for OAuth flow."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes),
            "response_type": "code",
            "state": state,
            "access_type": "offline" if self.provider == "google" else None,
            "prompt": "consent" if self.provider == "google" else None
        }
        
        # Add PKCE only if challenge provided
        if code_challenge:
            params["code_challenge"] = code_challenge
            params["code_challenge_method"] = "S256"
        
        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        
        return f"{self.auth_url}?{urlencode(params)}"
    
    async def exchange_code_for_tokens(self, code: str, code_verifier: str | None = None) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens."""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        # Add code_verifier only if provided
        if code_verifier:
            data["code_verifier"] = code_verifier
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, data=data)
            
            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")
            
            return response.json()
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh an expired access token."""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, data=data)
            
            if response.status_code != 200:
                raise Exception(f"Token refresh failed: {response.text}")
            
            return response.json()


def get_oauth_provider(provider: str) -> OAuth2Provider:
    """Get OAuth provider instance."""
    return OAuth2Provider(provider)


