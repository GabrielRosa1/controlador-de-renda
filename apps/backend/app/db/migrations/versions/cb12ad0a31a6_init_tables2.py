from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "cb12ad0a31a6"
down_revision: Union[str, Sequence[str], None] = "08317111f125"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # USERS
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # WORKS
    op.create_table(
        "works",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("sprint_name", sa.String(length=100), nullable=False),
        sa.Column("start_date", sa.String(length=10), nullable=False),  # YYYY-MM-DD
        sa.Column("end_date", sa.String(length=10), nullable=False),    # YYYY-MM-DD
        sa.Column("hourly_rate_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="BRL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_works_user_id_users", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_works"),
    )
    op.create_index("ix_works_user_id", "works", ["user_id"], unique=False)

    # TIME ENTRIES
    op.create_table(
        "time_entries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("work_id", sa.String(length=36), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["work_id"], ["works.id"], name="fk_time_entries_work_id_works", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_time_entries"),
    )
    op.create_index("ix_time_entries_work_id", "time_entries", ["work_id"], unique=False)

    # Opcional (recomendado): garantir no máximo 1 timer aberto por work
    # Funciona em Postgres via partial unique index
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ux_time_entries_open_per_work
        ON time_entries (work_id)
        WHERE ended_at IS NULL;
        """
    )


def downgrade() -> None:
    # Reverter na ordem inversa
    op.execute("DROP INDEX IF EXISTS ux_time_entries_open_per_work;")
    op.drop_index("ix_time_entries_work_id", table_name="time_entries")
    op.drop_table("time_entries")

    op.drop_index("ix_works_user_id", table_name="works")
    op.drop_table("works")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
