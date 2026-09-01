"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    resource_type = PGEnum("course", "article", "video", "docs", "github_repo", "website", "book", name="resource_type", create_type=False)
    difficulty = PGEnum("beginner", "intermediate", "advanced", name="difficulty", create_type=False)
    actor_type = PGEnum("guest", "user", name="actor_type", create_type=False)
    action_event_type = PGEnum(
        "view_resource", "view_article", "view_collection", "view_profile", "search_query",
        "vote_attempt_blocked", "submit_attempt_blocked", "vote_cast", "resource_created",
        "article_published", "collection_created", "signup_started", "signup_completed", "login",
        name="action_event_type",
        create_type=False,
    )
    article_status = PGEnum("draft", "published", name="article_status", create_type=False)
    resource_type.create(op.get_bind(), checkfirst=True)
    difficulty.create(op.get_bind(), checkfirst=True)
    actor_type.create(op.get_bind(), checkfirst=True)
    action_event_type.create(op.get_bind(), checkfirst=True)
    article_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("username", sa.String(40), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("bio", sa.Text()),
        sa.Column("faculty", sa.String(120)),
        sa.Column("avatar_url", sa.Text()),
        sa.Column("reputation_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    op.create_table(
        "tags",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(60), nullable=False, unique=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
    )
    op.create_index("ix_tags_slug", "tags", ["slug"])

    op.create_table(
        "resources",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("type", resource_type, nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("difficulty", difficulty, nullable=False),
        sa.Column("upvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("downvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resources_author_id", "resources", ["author_id"])
    op.create_index("ix_resources_created_at", "resources", ["created_at"])

    op.create_table(
        "resource_tags",
        sa.Column("resource_id", sa.Uuid(), sa.ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.Uuid(), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "articles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("slug", sa.String(220), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("cover_image_url", sa.Text()),
        sa.Column("reading_time", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", article_status, nullable=False),
        sa.Column("upvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("downvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_articles_author_id", "articles", ["author_id"])
    op.create_index("ix_articles_slug", "articles", ["slug"])
    op.create_index("ix_articles_created_at", "articles", ["created_at"])
    op.create_index("ix_articles_published_at", "articles", ["published_at"])

    op.create_table(
        "article_tags",
        sa.Column("article_id", sa.Uuid(), sa.ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.Uuid(), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "collections",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("author_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("upvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("downvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_collections_author_id", "collections", ["author_id"])
    op.create_index("ix_collections_created_at", "collections", ["created_at"])

    op.create_table(
        "collection_tags",
        sa.Column("collection_id", sa.Uuid(), sa.ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.Uuid(), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "collection_items",
        sa.Column("collection_id", sa.Uuid(), sa.ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("resource_id", sa.Uuid(), sa.ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.UniqueConstraint("collection_id", "resource_id", name="uq_collection_resource"),
        sa.UniqueConstraint("collection_id", "position", name="uq_collection_position"),
    )

    op.create_table(
        "guest_sessions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("ip_hash", sa.String(128)),
        sa.Column("user_agent", sa.String(512)),
        sa.Column("converted_user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("converted_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "votes",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_type", sa.String(40), nullable=False),
        sa.Column("target_id", sa.Uuid(), nullable=False),
        sa.Column("value", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("value in (-1, 1)", name="ck_vote_value"),
        sa.UniqueConstraint("user_id", "target_type", "target_id", name="uq_vote_user_target"),
    )

    op.create_table(
        "reputation_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(60), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("target_type", sa.String(40)),
        sa.Column("target_id", sa.Uuid()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "action_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("actor_type", actor_type, nullable=False),
        sa.Column("guest_session_id", sa.Uuid(), sa.ForeignKey("guest_sessions.id", ondelete="SET NULL")),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("event_type", action_event_type, nullable=False),
        sa.Column("target_type", sa.String(40)),
        sa.Column("target_id", sa.Uuid()),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "(actor_type = 'guest' and guest_session_id is not null and user_id is null) or "
            "(actor_type = 'user' and user_id is not null)",
            name="ck_action_actor_identity",
        ),
    )
    op.create_index("ix_action_events_user_id", "action_events", ["user_id"])
    op.create_index("ix_action_events_guest_session_id", "action_events", ["guest_session_id"])
    op.create_index("ix_action_events_event_type", "action_events", ["event_type"])
    op.create_index("ix_action_events_created_at", "action_events", ["created_at"])


def downgrade() -> None:
    op.drop_table("action_events")
    op.drop_table("reputation_events")
    op.drop_table("votes")
    op.drop_table("guest_sessions")
    op.drop_table("collection_items")
    op.drop_table("collection_tags")
    op.drop_table("collections")
    op.drop_table("article_tags")
    op.drop_table("articles")
    op.drop_table("resource_tags")
    op.drop_table("resources")
    op.drop_table("tags")
    op.drop_table("users")
    PGEnum(name="action_event_type").drop(op.get_bind(), checkfirst=True)
    PGEnum(name="actor_type").drop(op.get_bind(), checkfirst=True)
    PGEnum(name="difficulty").drop(op.get_bind(), checkfirst=True)
    PGEnum(name="resource_type").drop(op.get_bind(), checkfirst=True)
    PGEnum(name="article_status").drop(op.get_bind(), checkfirst=True)
