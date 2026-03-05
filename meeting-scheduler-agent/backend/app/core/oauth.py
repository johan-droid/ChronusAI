"""
OAuth 2.0 helpers for Google and Microsoft authentication flows.
Implements PKCE (Proof Key for Code Exchange) for secure authorization.
"""
import hashlib
import secrets
import base64
from urllib.parse import urlencode, quote

from app.config import get_settings


settings = get_settings()


def generate_pkce_code_verifier(length: int = 32) -> str:
    """
    Generate a PKCE code verifier.
    
    Args:
        length: Length of the random bytes (default 32).
        
    Returns:
        Base64url-encoded code verifier.
    """
    code_verifier = secrets.token_urlsafe(length)
    return code_verifier


def generate_pkce_code_challenge(code_verifier: str) -> str:
    """
    Generate a PKCE code challenge from a verifier.
    
    Args:
        code_verifier: The code verifier to hash.
        
    Returns:
        Base64url-encoded SHA256 hash of the verifier.
    """
    sha256_hash = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(sha256_hash).rstrip(b"=").decode()
    return code_challenge


class GoogleOAuth:
    """Google OAuth 2.0 helper."""
    
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    SCOPES = [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
        "openid",
        "email",
        "profile",
    ]
    
    @classmethod
    def get_authorization_url(cls, state: str, code_verifier: str) -> str:
        """
        Get Google authorization URL.
        
        Args:
            state: Random state parameter for CSRF protection.
            code_verifier: PKCE code verifier.
            
        Returns:
            Authorization URL to redirect user to.
        """
        code_challenge = generate_pkce_code_challenge(code_verifier)
        
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(cls.SCOPES),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        
        return f"{cls.AUTH_URL}?{urlencode(params)}"
    
    @classmethod
    async def exchange_code_for_token(
        cls,
        code: str,
        code_verifier: str,
    ) -> dict:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from callback.
            code_verifier: PKCE code verifier.
            
        Returns:
            Token response dict with access_token, refresh_token, expires_in, etc.
        """
        import httpx
        
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "code_verifier": code_verifier,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(cls.TOKEN_URL, data=data)
            response.raise_for_status()
            return response.json()
    
    @classmethod
    async def refresh_access_token(cls, refresh_token: str) -> dict:
        """
        Refresh an access token using a refresh token.
        
        Args:
            refresh_token: The refresh token.
            
        Returns:
            New token response dict.
        """
        import httpx
        
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(cls.TOKEN_URL, data=data)
            response.raise_for_status()
            return response.json()


class MicrosoftOAuth:
    """Microsoft OAuth 2.0 helper."""
    
    AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    SCOPES = [
        "Calendars.ReadWrite",
        "offline_access",
        "User.Read",
    ]
    
    @classmethod
    def get_authorization_url(cls, state: str, code_verifier: str) -> str:
        """
        Get Microsoft authorization URL.
        
        Args:
            state: Random state parameter for CSRF protection.
            code_verifier: PKCE code verifier.
            
        Returns:
            Authorization URL to redirect user to.
        """
        code_challenge = generate_pkce_code_challenge(code_verifier)
        
        params = {
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "redirect_uri": settings.MICROSOFT_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(cls.SCOPES),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        
        return f"{cls.AUTH_URL}?{urlencode(params)}"
    
    @classmethod
    async def exchange_code_for_token(
        cls,
        code: str,
        code_verifier: str,
    ) -> dict:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from callback.
            code_verifier: PKCE code verifier.
            
        Returns:
            Token response dict with access_token, refresh_token, expires_in, etc.
        """
        import httpx
        
        data = {
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "client_secret": settings.MICROSOFT_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.MICROSOFT_REDIRECT_URI,
            "code_verifier": code_verifier,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(cls.TOKEN_URL, data=data)
            response.raise_for_status()
            return response.json()
    
    @classmethod
    async def refresh_access_token(cls, refresh_token: str) -> dict:
        """
        Refresh an access token using a refresh token.
        
        Args:
            refresh_token: The refresh token.
            
        Returns:
            New token response dict.
        """
        import httpx
        
        data = {
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "client_secret": settings.MICROSOFT_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(cls.TOKEN_URL, data=data)
            response.raise_for_status()
            return response.json()
