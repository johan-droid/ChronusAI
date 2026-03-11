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
revision: str = '003_sync_schema_with_models'
down_revision: Union[str, None] = '002_add_zoom_meeting_id'
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
        
        # Update provider constraint for users (SQLite doesn't support ALTER constraints)
        # Skip constraint modification for SQLite - will be handled in application layer

    # 2. Update 'oauth_credentials' table
    if 'oauth_credentials' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('oauth_credentials')]
        if 'provider' not in columns:
            op.add_column('oauth_credentials', sa.Column('provider', sa.String(length=50), nullable=True))
            # Fill 'provider' with 'google' for existing records
            op.execute("UPDATE oauth_credentials SET provider = 'google' WHERE provider IS NULL")
            # Skip ALTER COLUMN for SQLite - will be handled in application layer
        
        if 'updated_at' not in columns:
            op.add_column('oauth_credentials', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
        
        # Skip ALTER COLUMN for SQLite - will be handled in application layer

        # Update unique constraint for oauth_credentials (SQLite doesn't support ALTER constraints well)
        # Skip constraint modification for SQLite - will be handled in application layer

    # 3. Update 'meetings' table
    if 'meetings' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('meetings')]
        if 'meeting_url' not in columns:
            op.add_column('meetings', sa.Column('meeting_url', sa.String(length=1024), nullable=True))


def downgrade() -> None:
    # Downgrade meetings
    op.drop_column('meetings', 'meeting_url')

    # Downgrade oauth_credentials
    # Skip constraint operations for SQLite
    op.drop_column('oauth_credentials', 'updated_at')
    # Skip ALTER COLUMN for SQLite
    op.drop_column('oauth_credentials', 'provider')

    # Downgrade users
    # Skip constraint operations for SQLite
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'hashed_password')
    op.drop_column('users', 'name')
