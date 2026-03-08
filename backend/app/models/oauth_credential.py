from sqlalchemy import Column, DateTime, ForeignKey, Text, JSON, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from typing import Optional

from app.db.session import Base


class OAuthCredential(Base):
    __tablename__ = "oauth_credentials"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # google, outlook, zoom
    access_token = Column(Text, nullable=False)  # Fernet-encrypted
    refresh_token = Column(Text, nullable=True)  # Fernet-encrypted
    expires_at = Column(DateTime(timezone=True), nullable=False)
    scopes: Optional[list[str]] = Column(ARRAY(Text).with_variant(JSON(), "sqlite"), nullable=True)  # type: ignore[assignment]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="ux_user_provider"),
    )
    
    # Relationship
    user = relationship("User", backref="oauth_credentials")
