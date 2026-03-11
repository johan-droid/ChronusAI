"""Organization-domain FastAPI dependencies.

These dependencies are completely separate from the User domain.  They accept
an ``X-Org-Id`` request header to identify the active organization context.

Usage example
-------------
```python
from app.core.dependencies.org_deps import get_active_org, verify_org_admin

@router.get("/org-resource")
async def my_endpoint(
    ctx: ActiveOrgContext = Depends(get_active_org),
    _: ActiveOrgContext = Depends(verify_org_admin),
):
    ...
```
"""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies.auth_deps import get_current_user
from app.db.session import get_db
from app.models.org_member import OrgMember, OrgRole
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import ActiveOrgContext


async def get_active_org(
    x_org_id: Annotated[str | None, Header(alias="X-Org-Id")] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ActiveOrgContext:
    """Resolve the active organization context from the ``X-Org-Id`` header.

    * Returns ``ActiveOrgContext(org_id, role)`` for the caller.
    * Raises ``400`` when the header is missing.
    * Raises ``403`` when the caller is not a member.
    * Raises ``404`` when the org does not exist or is inactive.
    """
    if not x_org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Org-Id header is required for this endpoint.",
        )

    try:
        org_id = uuid.UUID(x_org_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid organization ID format.")

    # Verify org exists and is active.
    org_result = await db.execute(
        select(Organization).where(Organization.id == org_id, Organization.is_active == True)  # noqa: E712
    )
    if not org_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    # Verify caller membership.
    member_result = await db.execute(
        select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == current_user.id)
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization.",
        )

    return ActiveOrgContext(org_id=org_id, role=member.role)


async def verify_org_member(ctx: ActiveOrgContext = Depends(get_active_org)) -> ActiveOrgContext:
    """Pass-through guard: caller must be any member (Owner / Admin / Member)."""
    return ctx


async def verify_org_admin(ctx: ActiveOrgContext = Depends(get_active_org)) -> ActiveOrgContext:
    """Require at least Admin privilege in the active org."""
    if OrgRole.privilege_level(ctx.role) < OrgRole.privilege_level(OrgRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Owner role is required for this action.",
        )
    return ctx


async def verify_org_owner(ctx: ActiveOrgContext = Depends(get_active_org)) -> ActiveOrgContext:
    """Require Owner privilege in the active org."""
    if ctx.role != OrgRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner role is required for this action.",
        )
    return ctx
