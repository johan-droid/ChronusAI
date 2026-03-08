import uuid

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("provider IN ('google', 'outlook', 'email')", name="ck_users_provider"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    full_name = Column(String(255))
    hashed_password = Column(String(255), nullable=True)
    timezone = Column(String(100), nullable=False, default="UTC")
    provider = Column(String(20), nullable=False)  # 'google', 'outlook', or 'email'
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
