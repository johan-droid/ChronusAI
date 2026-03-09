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
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # 1. Update 'users' table
    if 'users' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'name' not in columns:
            op.add_column('users', sa.Column('name', sa.String(length=255), nullable=True))
        if 'hashed_password' not in columns:
            op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=True))
        if 'is_active' not in columns:
            op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=True))
        if 'is_verified' not in columns:
            op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=True))
        
        # Update provider constraint for users
        check_constraints = [c['name'] for c in inspector.get_check_constraints('users')]
        if 'ck_users_provider' in check_constraints:
            op.drop_constraint('ck_users_provider', 'users', type_='check')
        op.create_check_constraint('ck_users_provider', 'users', "provider IN ('google', 'outlook', 'email')")

    # 2. Update 'oauth_credentials' table
    if 'oauth_credentials' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('oauth_credentials')]
        if 'provider' not in columns:
            op.add_column('oauth_credentials', sa.Column('provider', sa.String(length=50), nullable=True))
            # Fill 'provider' with 'google' for existing records
            op.execute("UPDATE oauth_credentials SET provider = 'google' WHERE provider IS NULL")
            op.alter_column('oauth_credentials', 'provider', nullable=False)
        
        if 'updated_at' not in columns:
            op.add_column('oauth_credentials', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
        
        op.alter_column('oauth_credentials', 'refresh_token',
                   existing_type=sa.TEXT(),
                   nullable=True)

        # Update unique constraint for oauth_credentials
        unique_constraints = [c['name'] for c in inspector.get_unique_constraints('oauth_credentials')]
        if 'oauth_credentials_user_id_key' in unique_constraints:
            op.drop_constraint('oauth_credentials_user_id_key', 'oauth_credentials', type_='unique')
        if 'ux_user_provider' not in unique_constraints:
            op.create_unique_constraint('ux_user_provider', 'oauth_credentials', ['user_id', 'provider'])

    # 3. Update 'meetings' table
    if 'meetings' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('meetings')]
        if 'meeting_url' not in columns:
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
