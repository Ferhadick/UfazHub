"""add resource student context

Revision ID: 0002_resource_student_context
Revises: 0001_initial
Create Date: 2026-09-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_resource_student_context"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("resources", sa.Column("use_case", sa.String(80), nullable=True))
    op.add_column("resources", sa.Column("time_commitment", sa.String(40), nullable=True))
    op.add_column("resources", sa.Column("prerequisites", sa.Text(), nullable=True))
    op.add_column("resources", sa.Column("best_part", sa.Text(), nullable=True))
    op.add_column("resources", sa.Column("warning", sa.Text(), nullable=True))
    op.add_column("resources", sa.Column("student_note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("resources", "student_note")
    op.drop_column("resources", "warning")
    op.drop_column("resources", "best_part")
    op.drop_column("resources", "prerequisites")
    op.drop_column("resources", "time_commitment")
    op.drop_column("resources", "use_case")
