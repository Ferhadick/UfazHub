"""add resource_links and resource_attachments tables

Revision ID: 0008_resource_attachments
Revises: 0007_qa_enum_consistency
Create Date: 2026-09-04
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008_resource_attachments"
down_revision: str | None = "0007_qa_enum_consistency"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "resource_links",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("resource_id", sa.Uuid(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resource_links_resource_id", "resource_links", ["resource_id"])

    op.create_table(
        "resource_attachments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("resource_id", sa.Uuid(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resource_attachments_resource_id", "resource_attachments", ["resource_id"])

    # Backfill: carry each existing resource's single url into the new tables
    # so pre-existing resources keep their link/attachment visible in the UI.
    op.execute(
        """
        INSERT INTO resource_links (id, resource_id, url, label, position, created_at)
        SELECT gen_random_uuid(), id, url, NULL, 0, created_at
        FROM resources
        """
    )


def downgrade() -> None:
    op.drop_index("ix_resource_attachments_resource_id", table_name="resource_attachments")
    op.drop_table("resource_attachments")
    op.drop_index("ix_resource_links_resource_id", table_name="resource_links")
    op.drop_table("resource_links")
