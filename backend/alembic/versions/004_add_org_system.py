"""Add organization system and extend user model.

Revision ID: 004_add_org_system
Revises: 003_sync_schema_with_models
Create Date: 2026-03-12
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "004_add_org_system"
down_revision = "003_sync_schema_with_models"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extend users table with auth fields ───────────────────────────────────
    op.add_column(
        "users",
        sa.Column("email_verification_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("password_reset_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("password_reset_expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index(
        "ix_users_email_verification_token",
        "users",
        ["email_verification_token"],
        unique=False,
    )
    op.create_index(
        "ix_users_password_reset_token",
        "users",
        ["password_reset_token"],
        unique=False,
    )

    # ── Create OrgRole enum ───────────────────────────────────────────────────
    org_role_enum = postgresql.ENUM("owner", "admin", "member", name="org_role_enum")
    org_role_enum.create(op.get_bind(), checkfirst=True)

    # ── Create organizations table ────────────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index('ix_organizations_slug', 'organizations', ['slug'], unique=True)
    op.create_index('ix_organizations_owner_id', 'organizations', ['owner_id'])

    # ── Create org_members table ──────────────────────────────────────────────
    op.create_table(
        "org_members",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "role",
            sa.Enum("owner", "admin", "member", name="org_role_enum", create_type=False),
            nullable=False,
            server_default="member",
        ),
        sa.Column(
            "invited_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("org_id", "user_id", name="uq_org_members_org_user"),
    )
    op.create_index('ix_org_members_org_id', 'org_members', ['org_id'])
    op.create_index('ix_org_members_user_id', 'org_members', ['user_id'])


def downgrade() -> None:
    op.drop_index("ix_org_members_user_id", table_name="org_members")
    op.drop_index("ix_org_members_org_id", table_name="org_members")
    op.drop_table("org_members")

    op.drop_index("ix_organizations_owner_id", table_name="organizations")
    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_table("organizations")

    op.execute("DROP TYPE IF EXISTS org_role_enum")

    op.drop_index("ix_users_password_reset_token", table_name="users")
    op.drop_index("ix_users_email_verification_token", table_name="users")
    op.drop_column("users", "password_reset_expires_at")
    op.drop_column("users", "password_reset_token")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "email_verification_token")
