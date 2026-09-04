"""add questions, answers tables and user verified fields

Revision ID: 0006_qa_and_verified_roles
Revises: 0005_socials_avatars_review
Create Date: 2026-09-03
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006_qa_and_verified_roles"
down_revision: str | None = "0005_socials_avatars_review"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# ALTER TYPE ... ADD VALUE cannot run inside a transaction on PostgreSQL.
transaction_per_migration = False


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction on PostgreSQL.
    # We must get a raw connection with AUTOCOMMIT isolation level to execute it.
    bind = op.get_bind()
    bind.execution_options(isolation_level="AUTOCOMMIT").execute(
        sa.text("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'verified_ufazian'")
    )

    # Add profile & verified fields to users
    op.add_column("users", sa.Column("graduation_year", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("current_role", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("company_or_institution", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("degree_level", sa.String(length=60), nullable=True))
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_users_is_verified", "users", ["is_verified"])

    # Create questions table
    op.create_table(
        "questions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("topic_tag", sa.String(length=80), nullable=False, server_default="general"),
        sa.Column("linked_resource_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="open"),
        sa.Column("upvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("downvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_pinned_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("merged_into_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["linked_resource_id"], ["resources.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["merged_into_id"], ["questions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_questions_author_id", "questions", ["author_id"])
    op.create_index("ix_questions_topic_tag", "questions", ["topic_tag"])
    op.create_index("ix_questions_status", "questions", ["status"])
    op.create_index("ix_questions_is_hidden", "questions", ["is_hidden"])
    op.create_index("ix_questions_created_at", "questions", ["created_at"])

    # Create answers table
    op.create_table(
        "answers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("linked_resources", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("upvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("downvotes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_helpful", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_answers_question_id", "answers", ["question_id"])
    op.create_index("ix_answers_author_id", "answers", ["author_id"])
    op.create_index("ix_answers_is_pinned", "answers", ["is_pinned"])
    op.create_index("ix_answers_is_hidden", "answers", ["is_hidden"])
    op.create_index("ix_answers_created_at", "answers", ["created_at"])


def downgrade() -> None:
    op.drop_table("answers")
    op.drop_table("questions")
    op.drop_index("ix_users_is_verified", table_name="users")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "degree_level")
    op.drop_column("users", "company_or_institution")
    op.drop_column("users", "current_role")
    op.drop_column("users", "graduation_year")
