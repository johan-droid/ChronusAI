import os
from collections.abc import AsyncGenerator
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, token_encryptor
from app.db.session import Base
from app.main import app
from app.models.oauth_credential import OAuthCredential
from app.models.user import User


def _test_db_url() -> str:
    url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL") or ""
    if not url or "postgresql" not in url:
        # Use SQLite for testing when PostgreSQL is not available
        return "sqlite+aiosqlite:///:memory:"
    return url


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(_test_db_url(), future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture()
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    SessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)
    async with SessionLocal() as session:
        yield session


@pytest.fixture()
async def override_db(db_session):
    async def _override() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides.clear()
    from app.db.session import get_db

    app.dependency_overrides[get_db] = _override
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
async def seeded_user(db_session: AsyncSession):
    user = User(email="tester@example.com", full_name="Test User", timezone="UTC", provider="google")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    cred = OAuthCredential(
        user_id=user.id,
        access_token=token_encryptor.encrypt("access-token"),
        refresh_token=token_encryptor.encrypt("refresh-token"),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        scopes=["https://www.googleapis.com/auth/calendar.events"],
    )
    db_session.add(cred)
    await db_session.commit()
    return user


@pytest.fixture()
def user_jwt(seeded_user: User) -> str:
    return create_access_token(str(seeded_user.id), expires_minutes=60)

