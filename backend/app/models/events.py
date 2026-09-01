from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, JSON, SmallInteger, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import ActionEventType, ActorType


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_vote_user_target"),
        CheckConstraint("value in (-1, 1)", name="ck_vote_value"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    target_type: Mapped[str] = mapped_column(String(40))
    target_id: Mapped[UUID] = mapped_column(index=True)
    value: Mapped[int] = mapped_column(SmallInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ReputationEvent(Base):
    __tablename__ = "reputation_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(60))
    points: Mapped[int] = mapped_column(Integer)
    target_type: Mapped[str | None] = mapped_column(String(40))
    target_id: Mapped[UUID | None] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GuestSession(Base):
    __tablename__ = "guest_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    ip_hash: Mapped[str | None] = mapped_column(String(128))
    user_agent: Mapped[str | None] = mapped_column(String(512))
    converted_user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    converted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ActionEvent(Base):
    __tablename__ = "action_events"
    __table_args__ = (
        CheckConstraint(
            "(actor_type = 'guest' and guest_session_id is not null and user_id is null) or "
            "(actor_type = 'user' and user_id is not null)",
            name="ck_action_actor_identity",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    actor_type: Mapped[ActorType] = mapped_column(Enum(ActorType, name="actor_type"), index=True)
    guest_session_id: Mapped[UUID | None] = mapped_column(ForeignKey("guest_sessions.id", ondelete="SET NULL"), index=True)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[ActionEventType] = mapped_column(Enum(ActionEventType, name="action_event_type"), index=True)
    target_type: Mapped[str | None] = mapped_column(String(40))
    target_id: Mapped[UUID | None] = mapped_column(index=True)
    event_metadata: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
