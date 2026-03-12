"""Add reminder columns to meetings

Revision ID: 005_add_reminder_columns
Revises: 004_add_org_system
Create Date: 2026-03-12
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "005_add_reminder_columns"
down_revision = "004_add_org_system"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'meetings' not in inspector.get_table_names():
        # table missing — nothing to do
        return

    existing_cols = {c['name'] for c in inspector.get_columns('meetings')}

    if 'reminder_schedule_minutes' not in existing_cols:
        op.add_column(
            'meetings',
            sa.Column(
                'reminder_schedule_minutes',
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=True,
            ),
        )

    if 'reminder_methods' not in existing_cols:
        op.add_column(
            'meetings',
            sa.Column(
                'reminder_methods',
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=True,
            ),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'meetings' not in inspector.get_table_names():
        return

    existing_cols = {c['name'] for c in inspector.get_columns('meetings')}

    if 'reminder_methods' in existing_cols:
        op.drop_column('meetings', 'reminder_methods')

    if 'reminder_schedule_minutes' in existing_cols:
        op.drop_column('meetings', 'reminder_schedule_minutes')
