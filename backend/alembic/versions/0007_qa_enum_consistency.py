"""align qa enum-backed fields with the deployed schema

Revision ID: 0007_qa_enum_consistency
Revises: 0006_qa_and_verified_roles
Create Date: 2026-09-03
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007_qa_enum_consistency"
down_revision: str | None = "0006_qa_and_verified_roles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


NEW_ACTION_EVENT_VALUES = (
    "question_created",
    "answer_created",
    "answer_pinned",
    "question_merged",
    "user_verified",
    "user_unverified",
)


def upgrade() -> None:
    # questions.status was intentionally created as VARCHAR(30) in 0006.
    # The ORM now mirrors that schema with a non-native SQLAlchemy enum, so no
    # question_status PostgreSQL type is required. Extend the existing event
    # enum because Q&A writes log these events in the same transaction.
    # Use Alembic's autocommit block so this is safe on PostgreSQL versions
    # that do not allow ALTER TYPE ... ADD VALUE inside a transaction.
    with op.get_context().autocommit_block():
        for value in NEW_ACTION_EVENT_VALUES:
            op.execute(sa.text(f"ALTER TYPE action_event_type ADD VALUE IF NOT EXISTS '{value}'"))

        # Keep the model enum and the deployed moderation enum in sync as well.
        op.execute(sa.text("ALTER TYPE moderation_event_type ADD VALUE IF NOT EXISTS 'verification_change'"))


def downgrade() -> None:
    # PostgreSQL enum labels cannot be removed safely without rebuilding the
    # type. Leaving compatible labels in place is the least destructive
    # downgrade behavior.
    pass
