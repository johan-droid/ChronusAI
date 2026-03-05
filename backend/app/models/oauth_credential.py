import uuid
from typing import Optional

from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base


class OAuthCredential(Base):
    __tablename__ = "oauth_credentials"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    access_token = Column(Text, nullable=False)  # Fernet-encrypted
    refresh_token = Column(Text, nullable=False)  # Fernet-encrypted
    expires_at = Column(DateTime(timezone=True), nullable=False)
    scopes: Optional[list[str]] = Column(ARRAY(Text), nullable=True)  # type: ignore[assignment]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", backref="oauth_credentials")
