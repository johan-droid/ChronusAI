import uuid

from sqlalchemy import CheckConstraint, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("provider IN ('google','outlook')", name="ck_users_provider"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255))
    timezone = Column(String(100), nullable=False, default="UTC")
    provider = Column(String(20), nullable=False)  # 'google' or 'outlook'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
