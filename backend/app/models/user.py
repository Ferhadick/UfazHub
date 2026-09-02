from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole, UserStatus


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(String(120))
    bio: Mapped[str | None] = mapped_column(Text)
    faculty: Mapped[str | None] = mapped_column(String(120))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    reputation_score: Mapped[int] = mapped_column(Integer, default=0)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), default=UserRole.user, server_default="user", index=True)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus, name="user_status"), default=UserStatus.active, server_default="active", index=True)
    muted_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    warning_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    resources = relationship("Resource", back_populates="author", foreign_keys="Resource.author_id")
    articles = relationship("Article", back_populates="author", foreign_keys="Article.author_id")
    collections = relationship("Collection", back_populates="author", foreign_keys="Collection.author_id")
    moderation_events = relationship("UserModerationEvent", back_populates="user", foreign_keys="UserModerationEvent.user_id")
