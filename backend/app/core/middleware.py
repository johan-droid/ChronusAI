from __future__ import annotations

from datetime import datetime, timedelta, timezone

import structlog
from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.oauth import get_oauth_provider
from app.core.security import decode_access_token, hash_user_id, token_encryptor
from app.db.session import AsyncSessionLocal
from app.models.oauth_credential import OAuthCredential
from app.models.user import User
from sqlalchemy import select


logger = structlog.get_logger()


class TokenRefreshMiddleware(BaseHTTPMiddleware):
    """
    If the OAuth access token is close to expiry (<= 5 minutes), refresh it
    before the request handler runs and stash the plaintext token on request.state.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        auth = request.headers.get("authorization") or ""
        if not auth.lower().startswith("bearer "):
            return await call_next(request)

        token = auth.split(" ", 1)[1].strip()
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")
        except JWTError:
            return await call_next(request)

        if not user_id:
            return await call_next(request)

        async with AsyncSessionLocal() as db:
            user_res = await db.execute(select(User).where(User.id == user_id))
            user = user_res.scalar_one_or_none()
            if user is None:
                return await call_next(request)

            cred_res = await db.execute(select(OAuthCredential).where(OAuthCredential.user_id == user.id))
            cred = cred_res.scalar_one_or_none()
            if cred is None:
                return await call_next(request)

            now = datetime.now(timezone.utc)
            if cred.expires_at <= now + timedelta(minutes=5):  # type: ignore[operator]
                try:
                    refresh_token = token_encryptor.decrypt(cred.refresh_token)  # type: ignore[arg-type]
                    if refresh_token:
                        provider = get_oauth_provider(user.provider)  # type: ignore[arg-type]
                        refreshed = await provider.refresh_access_token(refresh_token)
                        new_access = refreshed.get("access_token")
                        if new_access:
                            cred.access_token = token_encryptor.encrypt(new_access)  # type: ignore[assignment]
                            if refreshed.get("refresh_token"):
                                cred.refresh_token = token_encryptor.encrypt(refreshed["refresh_token"])  # type: ignore[assignment]
                            cred.expires_at = now + timedelta(seconds=int(refreshed.get("expires_in", 3600)))  # type: ignore[assignment]
                            await db.commit()
                            request.state.oauth_access_token = new_access
                except Exception:
                    # Do not fail the request; handler may still work if token isn't actually expired yet.
                    logger.warning(
                        "oauth_token_refresh_failed",
                        user_id_hash=hash_user_id(str(user.id)),
                        provider=user.provider,
                    )

            if not hasattr(request.state, "oauth_access_token"):
                try:
                    request.state.oauth_access_token = token_encryptor.decrypt(cred.access_token)  # type: ignore[arg-type]
                except Exception:
                    pass

            request.state.provider = user.provider  # type: ignore[assignment]

        return await call_next(request)

