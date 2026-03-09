"""Sync schema with models

Revision ID: 003
Revises: 002
Create Date: 2026-03-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update 'users' table
    # Check if columns already exist before adding, but since we are in a migration we usually just add.
    # PostgreSQL will error if they exist.
    op.add_column('users', sa.Column('name', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=True))
    
    # Update provider constraint for users
    # Drop old one first
    try:
        op.drop_constraint('ck_users_provider', 'users', type_='check')
    except Exception:
        pass
    op.create_check_constraint('ck_users_provider', 'users', "provider IN ('google', 'outlook', 'email')")

    # 2. Update 'oauth_credentials' table
    op.add_column('oauth_credentials', sa.Column('provider', sa.String(length=50), nullable=True))
    # Note: We'll fill 'provider' with 'google' for existing records if any
    op.execute("UPDATE oauth_credentials SET provider = 'google' WHERE provider IS NULL")
    op.alter_column('oauth_credentials', 'provider', nullable=False)
    
    op.alter_column('oauth_credentials', 'refresh_token',
               existing_type=sa.TEXT(),
               nullable=True)
    op.add_column('oauth_credentials', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))

    # Update unique constraint for oauth_credentials
    try:
        op.drop_constraint('oauth_credentials_user_id_key', 'oauth_credentials', type_='unique')
    except Exception:
        pass
    op.create_unique_constraint('ux_user_provider', 'oauth_credentials', ['user_id', 'provider'])

    # 3. Update 'meetings' table
    op.add_column('meetings', sa.Column('meeting_url', sa.String(length=1024), nullable=True))


def downgrade() -> None:
    # Downgrade meetings
    op.drop_column('meetings', 'meeting_url')

    # Downgrade oauth_credentials
    try:
        op.drop_constraint('ux_user_provider', 'oauth_credentials', type_='unique')
    except Exception:
        pass
    op.create_unique_constraint('oauth_credentials_user_id_key', 'oauth_credentials', ['user_id'])
    op.drop_column('oauth_credentials', 'updated_at')
    op.alter_column('oauth_credentials', 'refresh_token',
               existing_type=sa.TEXT(),
               nullable=False)
    op.drop_column('oauth_credentials', 'provider')

    # Downgrade users
    try:
        op.drop_constraint('ck_users_provider', 'users', type_='check')
    except Exception:
        pass
    op.create_check_constraint('ck_users_provider', 'users', "provider IN ('google','outlook')")
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'hashed_password')
    op.drop_column('users', 'name')
