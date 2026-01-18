"""add user name

Revision ID: a487f8e1b147
Revises: cb12ad0a31a6
Create Date: 2026-01-18 14:05:59.233710

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a487f8e1b147'
down_revision: Union[str, Sequence[str], None] = 'cb12ad0a31a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=120), nullable=True))
    # opcional: se quiser index
    # op.create_index("ix_users_name", "users", ["name"], unique=False)


def downgrade() -> None:
    # se tiver criado index, dropa antes
    # op.drop_index("ix_users_name", table_name="users")
    op.drop_column("users", "name")