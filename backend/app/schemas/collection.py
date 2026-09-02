from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.resource import ResourceRead, TagRead
from app.schemas.user import UserPublic


class CollectionBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=20, max_length=2000)
    resource_ids: list[UUID] = Field(default_factory=list, max_length=50)
    tags: list[str] = Field(default_factory=list, max_length=8)


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, min_length=20, max_length=2000)
    resource_ids: list[UUID] | None = Field(default=None, max_length=50)
    tags: list[str] | None = Field(default=None, max_length=8)


class CollectionItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    position: int
    resource: ResourceRead


class CollectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    upvotes: int
    downvotes: int
    is_hidden: bool = False
    hidden_reason: str | None = None
    hidden_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    author: UserPublic
    tags: list[TagRead]
    items: list[CollectionItemRead]

