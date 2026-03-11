"""Organizations router — Organization domain only.

Strictly separate from the User auth router.  All endpoints require
authentication and most require an active org context.
"""
from __future__ import annotations

import re
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.org_member import OrgMember, OrgRole
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import (
    ActiveOrgContext,
    OrgCreate,
    OrgInvite,
    OrgMemberRead,
    OrgRead,
    OrgRoleUpdate,
    OrgUpdate,
)
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/organizations", tags=["organizations"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")[:50]


async def _unique_slug(db: AsyncSession, base: str) -> str:
    candidate = base
    suffix = 0
    while True:
        result = await db.execute(select(Organization).where(Organization.slug == candidate))
        if not result.scalar_one_or_none():
            return candidate
        suffix += 1
        candidate = f"{base[:47]}-{suffix}"


async def _get_member_or_404(db: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID) -> OrgMember:
    result = await db.execute(
        select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in organization.")
    return member


# ── Organization CRUD ─────────────────────────────────────────────────────────

@router.post("", response_model=OrgRead, status_code=status.HTTP_201_CREATED)
async def create_organization(
    body: OrgCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new organization.  The creator automatically becomes the Owner."""
    base_slug = body.slug if body.slug else _slugify(body.name)
    slug = await _unique_slug(db, base_slug)

    org = Organization(
        name=body.name.strip(),
        slug=slug,
        owner_id=current_user.id,
    )
    db.add(org)
    await db.flush()  # obtain org.id before creating member

    # The creator is an Owner member in the junction table.
    db.add(OrgMember(org_id=org.id, user_id=current_user.id, role=OrgRole.OWNER))
    await db.commit()
    await db.refresh(org)

    logger.info("organization_created", org_id=str(org.id), owner=str(current_user.id))
    return org


@router.get("", response_model=List[OrgRead])
async def list_my_organizations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all organizations the current user belongs to."""
    result = await db.execute(
        select(Organization)
        .join(OrgMember, OrgMember.org_id == Organization.id)
        .where(OrgMember.user_id == current_user.id, Organization.is_active == True)  # noqa: E712
    )
    return result.scalars().all()


@router.get("/{org_id}", response_model=OrgRead)
async def get_organization(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific organization (caller must be a member)."""
    await _get_member_or_404(db, org_id, current_user.id)
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")
    return org


@router.patch("/{org_id}", response_model=OrgRead)
async def update_organization(
    org_id: uuid.UUID,
    body: OrgUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update org metadata.  Requires Admin or Owner role."""
    member = await _get_member_or_404(db, org_id, current_user.id)
    if OrgRole.privilege_level(member.role) < OrgRole.privilege_level(OrgRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Owner role required.")

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")

    if body.name is not None:
        org.name = body.name.strip()
    if body.logo_url is not None:
        org.logo_url = body.logo_url
    await db.commit()
    await db.refresh(org)
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an organization.  Only the Owner can do this."""
    member = await _get_member_or_404(db, org_id, current_user.id)
    if member.role != OrgRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the Owner can delete the organization.")

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if org:
        await db.delete(org)
        await db.commit()


# ── Member management ─────────────────────────────────────────────────────────

@router.get("/{org_id}/members", response_model=List[OrgMemberRead])
async def list_members(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of an organization (any member can view)."""
    await _get_member_or_404(db, org_id, current_user.id)

    result = await db.execute(select(OrgMember).where(OrgMember.org_id == org_id))
    members = result.scalars().all()

    out = []
    for m in members:
        out.append(
            OrgMemberRead(
                user_id=m.user_id,
                email=m.user.email,
                full_name=m.user.full_name,
                role=m.role,
                joined_at=m.joined_at,
            )
        )
    return out


@router.post("/{org_id}/members", response_model=OrgMemberRead, status_code=status.HTTP_201_CREATED)
async def invite_member(
    org_id: uuid.UUID,
    body: OrgInvite,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a registered user to the organization.  Requires Admin or Owner."""
    caller_member = await _get_member_or_404(db, org_id, current_user.id)
    if OrgRole.privilege_level(caller_member.role) < OrgRole.privilege_level(OrgRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Owner role required.")

    # Inviting as Owner is only allowed by the current Owner.
    if body.role == OrgRole.OWNER and caller_member.role != OrgRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the Owner can assign Owner role.")

    result = await db.execute(select(User).where(User.email == body.email))
    invitee = result.scalar_one_or_none()
    if not invitee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No registered user with that email.")

    # Check not already a member.
    existing = await db.execute(
        select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == invitee.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member.")

    new_member = OrgMember(
        org_id=org_id,
        user_id=invitee.id,
        role=body.role,
        invited_by=current_user.id,
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    logger.info("member_invited", org_id=str(org_id), invitee=str(invitee.id), role=body.role)
    return OrgMemberRead(
        user_id=new_member.user_id,
        email=invitee.email,
        full_name=invitee.full_name,
        role=new_member.role,
        joined_at=new_member.joined_at,
    )


@router.patch("/{org_id}/members/{target_user_id}/role", response_model=OrgMemberRead)
async def update_member_role(
    org_id: uuid.UUID,
    target_user_id: uuid.UUID,
    body: OrgRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change a member's role.  Owner can set any role; Admin can only set Member."""
    caller_member = await _get_member_or_404(db, org_id, current_user.id)
    target_member = await _get_member_or_404(db, org_id, target_user_id)

    if caller_member.role == OrgRole.MEMBER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")
    if body.role == OrgRole.OWNER and caller_member.role != OrgRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an Owner can promote to Owner.")
    if target_member.role == OrgRole.OWNER and caller_member.role != OrgRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify the Owner's role.")

    target_member.role = body.role
    await db.commit()
    await db.refresh(target_member)

    return OrgMemberRead(
        user_id=target_member.user_id,
        email=target_member.user.email,
        full_name=target_member.user.full_name,
        role=target_member.role,
        joined_at=target_member.joined_at,
    )


@router.delete("/{org_id}/members/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    org_id: uuid.UUID,
    target_user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the organization.

    * Members can only remove themselves (leave).
    * Admins can remove Members.
    * Owners can remove anyone except themselves (transfer ownership first).
    """
    caller_member = await _get_member_or_404(db, org_id, current_user.id)
    target_member = await _get_member_or_404(db, org_id, target_user_id)

    is_self = current_user.id == target_user_id

    if not is_self:
        if caller_member.role == OrgRole.MEMBER:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only remove themselves.")
        if caller_member.role == OrgRole.ADMIN and target_member.role != OrgRole.MEMBER:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins can only remove Members.")

    if target_member.role == OrgRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer ownership before leaving or removing the Owner.",
        )

    await db.delete(target_member)
    await db.commit()
