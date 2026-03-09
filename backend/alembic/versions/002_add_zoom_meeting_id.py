"""Add zoom_meeting_id to meetings

Revision ID: 002
Revises: 001
Create Date: 2026-03-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('meetings')]
    if 'zoom_meeting_id' not in columns:
        op.add_column("meetings", sa.Column("zoom_meeting_id", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("meetings", "zoom_meeting_id")
