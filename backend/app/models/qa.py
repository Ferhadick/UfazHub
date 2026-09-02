from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, false, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import QuestionStatus


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    author_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(220))
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    topic_tag: Mapped[str] = mapped_column(String(80), index=True, default="general")
    linked_resource_id: Mapped[UUID | None] = mapped_column(ForeignKey("resources.id", ondelete="SET NULL"), nullable=True, index=True)
    status: Mapped[QuestionStatus] = mapped_column(
        Enum(QuestionStatus, name="question_status"),
        default=QuestionStatus.open,
        server_default="open",
        index=True,
    )
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    downvotes: Mapped[int] = mapped_column(Integer, default=0)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false(), index=True)
    is_pinned_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false(), index=True)
    merged_into_id: Mapped[UUID | None] = mapped_column(ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="questions", foreign_keys=[author_id], lazy="selectin")
    linked_resource = relationship("Resource", foreign_keys=[linked_resource_id], lazy="selectin")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan", lazy="selectin")
    merged_into = relationship("Question", remote_side=[id], foreign_keys=[merged_into_id])


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    question_id: Mapped[UUID] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    body: Mapped[str] = mapped_column(Text)
    linked_resources: Mapped[list[dict]] = mapped_column(JSON, default=list, server_default="[]")
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    downvotes: Mapped[int] = mapped_column(Integer, default=0)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false(), index=True)
    is_helpful: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false(), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    question = relationship("Question", back_populates="answers", foreign_keys=[question_id])
    author = relationship("User", back_populates="answers", foreign_keys=[author_id], lazy="selectin")
