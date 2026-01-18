"""add work closed_at

Revision ID: ceddf7d9ded0
Revises: a487f8e1b147
Create Date: 2026-01-18 15:36:14.476462

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ceddf7d9ded0'
down_revision: Union[str, Sequence[str], None] = 'a487f8e1b147'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("works", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("works", sa.Column("closed_reason", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column("works", "closed_reason")
    op.drop_column("works", "closed_at")