"""add user socials, avatar table, and content pending review

Revision ID: 0005_socials_avatars_review
Revises: 0004_resource_pending_review
Create Date: 2026-09-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_socials_avatars_review"
down_revision: str | None = "0004_resource_pending_review"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add socials to users
    op.add_column("users", sa.Column("github_url", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("linkedin_url", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("telegram_url", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("youtube_url", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("website_url", sa.String(length=255), nullable=True))

    # Add user_avatars table
    op.create_table(
        "user_avatars",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("image_data", sa.LargeBinary(), nullable=False),
        sa.Column("content_type", sa.String(length=50), nullable=False, server_default="image/webp"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    # Add is_pending_review to articles & collections
    op.add_column("articles", sa.Column("is_pending_review", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_articles_is_pending_review", "articles", ["is_pending_review"])

    op.add_column("collections", sa.Column("is_pending_review", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_collections_is_pending_review", "collections", ["is_pending_review"])


def downgrade() -> None:
    op.drop_index("ix_collections_is_pending_review", table_name="collections")
    op.drop_column("collections", "is_pending_review")

    op.drop_index("ix_articles_is_pending_review", table_name="articles")
    op.drop_column("articles", "is_pending_review")

    op.drop_table("user_avatars")

    op.drop_column("users", "website_url")
    op.drop_column("users", "youtube_url")
    op.drop_column("users", "telegram_url")
    op.drop_column("users", "linkedin_url")
    op.drop_column("users", "github_url")
