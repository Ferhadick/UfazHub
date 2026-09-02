from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import ActionEventType, ActorType, ModerationEventType, UserRole, UserStatus
from app.schemas.article import ArticleRead, ArticleUpdate
from app.schemas.collection import CollectionRead, CollectionUpdate
from app.schemas.resource import ResourceRead, ResourceUpdate
from app.schemas.user import UserCreate, UserPublic

ContentKind = Literal["resource", "article", "collection"]


class ReasonBody(BaseModel):
    reason: str = Field(min_length=3, max_length=2000)


class MuteBody(ReasonBody):
    duration_minutes: int | None = Field(default=None, ge=1, le=525600)


class AdminUserCreate(UserCreate):
    pass


class AdminUserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    bio: str | None = Field(default=None, max_length=1000)
    faculty: str | None = Field(default=None, max_length=120)
    username: str | None = Field(default=None, min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr | None = None
    role: UserRole | None = None
    reason: str | None = Field(default=None, min_length=3, max_length=2000)


class ModerationEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    actor_id: UUID
    event_type: ModerationEventType
    reason: str
    duration_minutes: int | None
    expires_at: datetime | None
    created_at: datetime
    actor_username: str | None = None


class ContentCounts(BaseModel):
    resources: int
    articles: int
    collections: int


class AdminOverview(BaseModel):
    users_total: int
    users_active: int
    users_muted: int
    users_banned: int
    admins: int
    content_counts: ContentCounts
    hidden_counts: ContentCounts
    events_last_7_days: dict[str, int]
    recent_moderation_events: list[ModerationEventRead]
    recent_blocked_guest_actions: list["AdminActionEventRead"]


class AdminUserDetail(BaseModel):
    user: UserPublic
    moderation_history: list[ModerationEventRead]
    content_counts: ContentCounts
    recent_action_events: list["AdminActionEventRead"]


class AdminContentItem(BaseModel):
    kind: ContentKind
    id: UUID
    title: str
    slug: str | None = None
    is_hidden: bool
    hidden_reason: str | None
    author_id: UUID
    author_username: str
    created_at: datetime


AdminContentListItem = AdminContentItem


class AdminResourceRead(ResourceRead):
    is_hidden: bool
    hidden_reason: str | None
    hidden_at: datetime | None


class AdminArticleRead(ArticleRead):
    is_hidden: bool
    hidden_reason: str | None
    hidden_at: datetime | None


class AdminCollectionRead(CollectionRead):
    is_hidden: bool
    hidden_reason: str | None
    hidden_at: datetime | None


class AdminActionEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    actor_type: ActorType
    event_type: ActionEventType
    user_id: UUID | None
    username: str | None = None
    guest_session_id: UUID | None
    ip_hash: str | None = None
    target_type: str | None
    target_id: UUID | None
    metadata: dict[str, Any]
    created_at: datetime


class AdminContentUpdate(BaseModel):
    resource: ResourceUpdate | None = None
    article: ArticleUpdate | None = None
    collection: CollectionUpdate | None = None


AdminOverview.model_rebuild()
AdminUserDetail.model_rebuild()
