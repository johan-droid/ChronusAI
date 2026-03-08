import uuid

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint(
            "status IN ('scheduled','canceled','rescheduled','pending')",
            name="ck_meetings_status",
        ),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    external_event_id = Column(String(512))  # Google/Outlook event ID
    title = Column(String(512), nullable=False, default="Meeting")
    description = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)  # Always stored in UTC
    end_time = Column(DateTime(timezone=True), nullable=False)
    attendees = Column(JSONB().with_variant(JSON, "sqlite"), nullable=False, default=list)  # [{email,name,response_status}]
    status = Column(String(20), nullable=False, default="scheduled")  # scheduled, canceled, rescheduled, pending
    provider = Column(String(20), nullable=False)
    meeting_url = Column(String(1024))  # Zoom/Teams/Meet link
    raw_user_input = Column(Text)  # The original NL request, for audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    user = relationship("User", backref="meetings")
