"""Organization-domain Pydantic schemas.

Strictly separate from the User domain — no User schema is imported here.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.org_member import OrgRole


# ── Organization ──────────────────────────────────────────────────────────────

class OrgCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = Field(default=None, min_length=2, max_length=50)

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v: Optional[str], info) -> Optional[str]:
        """Auto-generate slug from name when not provided."""
        if v:
            # Normalise provided slug
            return re.sub(r"[^a-z0-9-]", "", v.lower().replace(" ", "-"))
        return v

    @field_validator("name")
    @classmethod
    def no_control_chars(cls, v: str) -> str:
        if re.search(r"[\x00-\x1f]", v):
            raise ValueError("Name must not contain control characters.")
        return v.strip()


class OrgUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    logo_url: Optional[str] = Field(default=None, max_length=500)


class OrgRead(BaseModel):
    id: UUID
    name: str
    slug: str
    owner_id: UUID
    logo_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Membership ────────────────────────────────────────────────────────────────

class OrgMemberRead(BaseModel):
    """Flattened view of a member — combines OrgMember + User fields."""
    user_id: UUID
    email: str
    full_name: Optional[str] = None
    role: OrgRole
    joined_at: datetime

    model_config = {"from_attributes": True}


class OrgInvite(BaseModel):
    """Payload to invite a new member by email."""
    email: str = Field(..., min_length=3, max_length=255)
    role: OrgRole = OrgRole.MEMBER


class OrgRoleUpdate(BaseModel):
    role: OrgRole


# ── Context / active org ──────────────────────────────────────────────────────

class ActiveOrgContext(BaseModel):
    """What the JWT / header carries for the active organization context."""
    org_id: UUID
    role: OrgRole
