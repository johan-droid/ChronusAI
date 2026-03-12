"""OrgMember junction model — links User ↔ Organization with a Role.

Strictly isolated from the User model: the User model has NO knowledge of
organizations. Only OrgMember holds that coupling.
"""
from __future__ import annotations

import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class OrgRole(str, enum.Enum):
    """Ordered by privilege: OWNER > ADMIN > MEMBER."""

    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

    # Convenience helper used in dependency checks.
    @classmethod
    def privilege_level(cls, role: "OrgRole") -> int:
        return {cls.OWNER: 3, cls.ADMIN: 2, cls.MEMBER: 1}.get(role, 0)


class OrgMember(Base):
    __tablename__ = "org_members"
    __table_args__ = (
        UniqueConstraint("org_id", "user_id", name="uq_org_members_org_user"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    org_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(
        Enum(OrgRole, name="org_role_enum"),
        nullable=False,
        default=OrgRole.MEMBER,
    )
    invited_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    organization = relationship(
        "Organization", back_populates="members"
    )
    # Lightweight back-references to User — read-only; no back_populates on User.
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    inviter = relationship("User", foreign_keys=[invited_by], lazy="raise")
