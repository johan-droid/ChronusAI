"""
API router for authentication endpoints.
Handles OAuth flows for Google and Microsoft Calendar providers.
"""
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.session import get_db
from app.models.user import User, OAuthCredentials
from app.schemas.user import TokenResponse
from app.core.jwt import create_access_token
from app.core.security import token_encryptor
from app.core.oauth import GoogleOAuth, MicrosoftOAuth, generate_pkce_code_verifier


settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])


# Temporary storage for PKCE code verifiers (use Redis in production)
_code_verifier_store = {}


@router.get("/google")
async def google_auth_init():
    """
    Initialize Google OAuth flow.
    
    Redirects user to Google's authorization page.
    """
    # Generate state and code verifier for PKCE
    state = secrets.token_urlsafe(32)
    code_verifier = generate_pkce_code_verifier()
    
    # Store code verifier temporarily (in production, use Redis with expiry)
    _code_verifier_store[state] = {
        "code_verifier": code_verifier,
        "timestamp": datetime.now(timezone.utc),
    }
    
    # Get authorization URL
    auth_url = GoogleOAuth.get_authorization_url(state, code_verifier)
    
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth callback.
    
    Exchanges authorization code for tokens and creates/updates user.
    """
    if not state or state not in _code_verifier_store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state parameter",
        )
    
    # Retrieve code verifier
    stored_data = _code_verifier_store.pop(state)
    code_verifier = stored_data["code_verifier"]
    
    # Check timestamp (prevent replay attacks)
    if datetime.now(timezone.utc) - stored_data["timestamp"] > timedelta(minutes=10):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code expired",
        )
    
    # Exchange code for tokens
    try:
        token_response = await GoogleOAuth.exchange_code_for_token(code, code_verifier)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange code: {str(e)}",
        )
    
    # Get user info from Google (using the access token)
    import httpx
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token_response['access_token']}"},
        )
        response.raise_for_status()
        user_info = response.json()
    
    email = user_info["email"]
    full_name = user_info.get("name")
    
    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Create new user
        user = User(
            email=email,
            full_name=full_name,
            provider="google",
            timezone="UTC",  # Default, can be updated later
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # Store/update OAuth credentials (encrypt tokens!)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_response["expires_in"])
    
    oauth_creds = OAuthCredentials(
        user_id=user.id,
        access_token=token_encryptor.encrypt(token_response["access_token"]),
        refresh_token=token_encryptor.encrypt(token_response.get("refresh_token", "")),
        expires_at=expires_at,
        scopes=token_response.get("scope", "").split(),
    )
    
    # Upsert credentials
    existing = await db.execute(
        select(OAuthCredentials).where(OAuthCredentials.user_id == user.id)
    )
    existing_creds = existing.scalar_one_or_none()
    
    if existing_creds:
        existing_creds.access_token = oauth_creds.access_token
        existing_creds.refresh_token = oauth_creds.refresh_token
        existing_creds.expires_at = oauth_creds.expires_at
        existing_creds.scopes = oauth_creds.scopes
    else:
        db.add(oauth_creds)
    
    await db.commit()
    
    # Generate JWT token for our API
    jwt_token = create_access_token(subject=str(user.id))
    
    # Redirect to frontend with token
    frontend_url = f"{settings.FRONTEND_URL}/dashboard?token={jwt_token}"
    return RedirectResponse(url=frontend_url)


@router.get("/outlook")
async def outlook_auth_init():
    """
    Initialize Microsoft Outlook OAuth flow.
    
    Redirects user to Microsoft's authorization page.
    """
    state = secrets.token_urlsafe(32)
    code_verifier = generate_pkce_code_verifier()
    
    _code_verifier_store[state] = {
        "code_verifier": code_verifier,
        "timestamp": datetime.now(timezone.utc),
    }
    
    auth_url = MicrosoftOAuth.get_authorization_url(state, code_verifier)
    
    return RedirectResponse(url=auth_url)


@router.get("/outlook/callback")
async def outlook_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Microsoft Outlook OAuth callback.
    
    Exchanges authorization code for tokens and creates/updates user.
    """
    if not state or state not in _code_verifier_store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state parameter",
        )
    
    stored_data = _code_verifier_store.pop(state)
    code_verifier = stored_data["code_verifier"]
    
    if datetime.now(timezone.utc) - stored_data["timestamp"] > timedelta(minutes=10):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code expired",
        )
    
    try:
        token_response = await MicrosoftOAuth.exchange_code_for_token(code, code_verifier)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange code: {str(e)}",
        )
    
    # Get user info from Microsoft Graph
    import httpx
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {token_response['access_token']}"},
        )
        response.raise_for_status()
        user_info = response.json()
    
    email = user_info["mail"] or user_info["userPrincipalName"]
    full_name = user_info.get("displayName")
    
    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            email=email,
            full_name=full_name,
            provider="outlook",
            timezone="UTC",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # Store OAuth credentials
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_response["expires_in"])
    
    oauth_creds = OAuthCredentials(
        user_id=user.id,
        access_token=token_encryptor.encrypt(token_response["access_token"]),
        refresh_token=token_encryptor.encrypt(token_response.get("refresh_token", "")),
        expires_at=expires_at,
        scopes=token_response.get("scope", "").split(),
    )
    
    existing = await db.execute(
        select(OAuthCredentials).where(OAuthCredentials.user_id == user.id)
    )
    existing_creds = existing.scalar_one_or_none()
    
    if existing_creds:
        existing_creds.access_token = oauth_creds.access_token
        existing_creds.refresh_token = oauth_creds.refresh_token
        existing_creds.expires_at = oauth_creds.expires_at
        existing_creds.scopes = oauth_creds.scopes
    else:
        db.add(oauth_creds)
    
    await db.commit()
    
    # Generate JWT token
    jwt_token = create_access_token(subject=str(user.id))
    
    frontend_url = f"{settings.FRONTEND_URL}/dashboard?token={jwt_token}"
    return RedirectResponse(url=frontend_url)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh JWT access token.
    
    Requires valid current JWT token.
    """
    new_token = create_access_token(subject=str(user.id))
    
    return TokenResponse(
        access_token=new_token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
    )


# Import here to avoid circular dependency
from app.dependencies import get_current_user
