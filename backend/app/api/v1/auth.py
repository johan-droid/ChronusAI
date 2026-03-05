from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.oauth import get_oauth_provider
from app.core.security import create_access_token, token_encryptor
from app.db.redis import redis_client
from app.db.session import get_db
from app.models.oauth_credential import OAuthCredential
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.get("/{provider}/login")
async def oauth_login(provider: str):
    """Initiate OAuth flow for the specified provider."""
    if provider not in ["google", "outlook"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported provider"
        )
    
    oauth_provider = get_oauth_provider(provider)
    code_verifier, code_challenge = oauth_provider.generate_pkce()
    
    # Store code verifier in Redis temporarily (10 minutes)
    state = secrets.token_urlsafe(32)
    await redis_client.set(f"oauth:{state}", code_verifier, ex=600)
    
    auth_url = oauth_provider.get_authorization_url(code_challenge, state)
    
    return {"auth_url": auth_url}


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback from provider."""
    # Retrieve code verifier from Redis
    code_verifier = await redis_client.get(f"oauth:{state}")
    if not code_verifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state"
        )
    
    # Clean up Redis
    await redis_client.delete(f"oauth:{state}")
    
    try:
        # Exchange code for tokens
        oauth_provider = get_oauth_provider(provider)
        tokens = await oauth_provider.exchange_code_for_tokens(code, code_verifier)

        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="OAuth token exchange did not return an access token")

        # Fetch user profile
        async with httpx.AsyncClient(timeout=15) as client:
            if provider == "google":
                profile_resp = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                profile_resp.raise_for_status()
                profile = profile_resp.json()
                user_email = profile.get("email")
                full_name = profile.get("name")
            else:
                profile_resp = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                profile_resp.raise_for_status()
                profile = profile_resp.json()
                user_email = profile.get("mail") or profile.get("userPrincipalName")
                full_name = profile.get("displayName")

        if not user_email:
            raise HTTPException(status_code=400, detail="Could not read user email from provider profile")

        # Find or create user
        result = await db.execute(select(User).where(User.email == user_email))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(email=user_email, full_name=full_name, provider=provider, timezone="UTC")
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Keep provider consistent with latest login
            user.provider = provider  # type: ignore[assignment]
            if full_name and not user.full_name:
                user.full_name = full_name
            await db.commit()
        
        # Encrypt and store tokens
        encrypted_access = token_encryptor.encrypt(access_token)
        refresh_token = tokens.get("refresh_token") or ""
        encrypted_refresh = token_encryptor.encrypt(refresh_token) if refresh_token else token_encryptor.encrypt("")
        
        # Calculate expiry
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(tokens.get("expires_in", 3600)))
        
        # Store or update OAuth credentials
        result = await db.execute(select(OAuthCredential).where(OAuthCredential.user_id == user.id))
        oauth_cred = result.scalar_one_or_none()
        scopes = tokens.get("scope", "")
        scopes_list = scopes.split() if isinstance(scopes, str) else None
        
        if oauth_cred:
            oauth_cred.access_token = encrypted_access
            oauth_cred.refresh_token = encrypted_refresh
            oauth_cred.expires_at = expires_at
            oauth_cred.scopes = scopes_list  # type: ignore[assignment]
        else:
            oauth_cred = OAuthCredential(
                user_id=user.id,
                access_token=encrypted_access,
                refresh_token=encrypted_refresh,
                expires_at=expires_at,
                scopes=scopes_list
            )
            db.add(oauth_cred)
        
        await db.commit()
        
        # Create JWT token
        jwt_token = create_access_token(str(user.id))
        
        # Redirect to frontend with token
        redirect_url = f"{settings.frontend_url}?token={jwt_token}"
        return RedirectResponse(url=redirect_url)
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth callback failed"
        )


@router.post("/refresh")
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Refresh an expired access token."""
    return {"message": "Use automatic refresh middleware"}
