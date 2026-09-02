"""admin roles, content hiding, and moderation events

Revision ID: 0003_admin_moderation
Revises: 0002_resource_student_context
Create Date: 2026-09-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

revision: str = "0003_admin_moderation"
down_revision: str | None = "0002_resource_student_context"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NEW_ACTION_EVENT_VALUES = (
    "admin_hide",
    "admin_unhide",
    "admin_delete",
    "admin_user_edit",
    "admin_role_change",
    "admin_warn",
    "admin_mute",
    "admin_unmute",
    "admin_ban",
    "admin_unban",
)


def upgrade() -> None:
    user_role = PGEnum("user", "admin", name="user_role", create_type=False)
    user_status = PGEnum("active", "muted", "banned", name="user_status", create_type=False)
    moderation_event_type = PGEnum(
        "warning", "mute", "unmute", "ban", "unban", "role_change", name="moderation_event_type", create_type=False
    )
    user_role.create(op.get_bind(), checkfirst=True)
    user_status.create(op.get_bind(), checkfirst=True)
    moderation_event_type.create(op.get_bind(), checkfirst=True)

    for value in NEW_ACTION_EVENT_VALUES:
        op.execute(sa.text(f"ALTER TYPE action_event_type ADD VALUE IF NOT EXISTS '{value}'"))

    op.add_column("users", sa.Column("role", user_role, nullable=False, server_default="user"))
    op.add_column("users", sa.Column("status", user_status, nullable=False, server_default="active"))
    op.add_column("users", sa.Column("muted_until", sa.DateTime(timezone=True)))
    op.add_column("users", sa.Column("warning_count", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_status", "users", ["status"])

    for table in ("resources", "articles", "collections"):
        op.add_column(table, sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.false()))
        op.add_column(table, sa.Column("hidden_reason", sa.Text()))
        op.add_column(table, sa.Column("hidden_at", sa.DateTime(timezone=True)))
        op.add_column(table, sa.Column("hidden_by_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL")))
        op.create_index(f"ix_{table}_is_hidden", table, ["is_hidden"])

    op.create_table(
        "user_moderation_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("event_type", moderation_event_type, nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("duration_minutes", sa.Integer()),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(reason) >= 3", name="ck_moderation_reason_len"),
    )
    op.create_index("ix_user_moderation_events_user_id", "user_moderation_events", ["user_id"])
    op.create_index("ix_user_moderation_events_actor_id", "user_moderation_events", ["actor_id"])
    op.create_index("ix_user_moderation_events_event_type", "user_moderation_events", ["event_type"])
    op.create_index("ix_user_moderation_events_created_at", "user_moderation_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_user_moderation_events_created_at", table_name="user_moderation_events")
    op.drop_index("ix_user_moderation_events_event_type", table_name="user_moderation_events")
    op.drop_index("ix_user_moderation_events_actor_id", table_name="user_moderation_events")
    op.drop_index("ix_user_moderation_events_user_id", table_name="user_moderation_events")
    op.drop_table("user_moderation_events")

    for table in ("resources", "articles", "collections"):
        op.drop_index(f"ix_{table}_is_hidden", table_name=table)
        op.drop_column(table, "hidden_by_id")
        op.drop_column(table, "hidden_at")
        op.drop_column(table, "hidden_reason")
        op.drop_column(table, "is_hidden")

    op.drop_index("ix_users_status", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_column("users", "warning_count")
    op.drop_column("users", "muted_until")
    op.drop_column("users", "status")
    op.drop_column("users", "role")

    PGEnum(name="moderation_event_type").drop(op.get_bind(), checkfirst=True)
    PGEnum(name="user_status").drop(op.get_bind(), checkfirst=True)
    PGEnum(name="user_role").drop(op.get_bind(), checkfirst=True)
