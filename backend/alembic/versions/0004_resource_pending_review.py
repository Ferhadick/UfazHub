"""add is_pending_review to resources

Revision ID: 0004_resource_pending_review
Revises: 0003_admin_moderation
Create Date: 2026-09-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_resource_pending_review"
down_revision: str | None = "0003_admin_moderation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "resources",
        sa.Column(
            "is_pending_review",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_index("ix_resources_is_pending_review", "resources", ["is_pending_review"])


def downgrade() -> None:
    op.drop_index("ix_resources_is_pending_review", table_name="resources")
    op.drop_column("resources", "is_pending_review")
