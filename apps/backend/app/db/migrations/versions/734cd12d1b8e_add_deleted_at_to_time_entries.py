"""add deleted_at to time_entries

Revision ID: 734cd12d1b8e
Revises: ceddf7d9ded0
Create Date: 2026-02-07 22:38:33.543122

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '734cd12d1b8e'
down_revision: Union[str, Sequence[str], None] = 'ceddf7d9ded0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("time_entries", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_time_entries_deleted_at", "time_entries", ["deleted_at"])

def downgrade():
    op.drop_index("ix_time_entries_deleted_at", table_name="time_entries")
    op.drop_column("time_entries", "deleted_at")