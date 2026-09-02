from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.models.enums import ArticleStatus
from app.schemas.resource import TagRead
from app.schemas.user import UserPublic


class ArticleBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    content: str = Field(min_length=40)
    excerpt: str | None = Field(default=None, max_length=400)
    cover_image_url: HttpUrl | None = None
    status: ArticleStatus = ArticleStatus.draft
    tags: list[str] = Field(default_factory=list, max_length=8)


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    content: str | None = Field(default=None, min_length=40)
    excerpt: str | None = Field(default=None, max_length=400)
    cover_image_url: HttpUrl | None = None
    status: ArticleStatus | None = None
    tags: list[str] | None = Field(default=None, max_length=8)


class ArticleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    slug: str
    content: str
    excerpt: str
    cover_image_url: str | None
    reading_time: int
    status: ArticleStatus
    upvotes: int
    downvotes: int
    is_hidden: bool = False
    hidden_reason: str | None = None
    hidden_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None
    author: UserPublic
    tags: list[TagRead]

