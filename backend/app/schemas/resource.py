from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.models.enums import Difficulty, ResourceType
from app.schemas.user import UserPublic


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str


class ResourceLinkCreate(BaseModel):
    url: HttpUrl
    label: str | None = Field(default=None, max_length=120)


class ResourceLinkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    label: str | None
    position: int


class ResourceAttachmentCreate(BaseModel):
    url: HttpUrl
    filename: str = Field(min_length=1, max_length=255)
    content_type: str | None = Field(default=None, max_length=100)
    size_bytes: int | None = Field(default=None, ge=0)


class ResourceAttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    filename: str
    content_type: str | None
    size_bytes: int | None
    position: int


class ResourceBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=20, max_length=2000)
    url: HttpUrl
    type: ResourceType
    category: str = Field(min_length=2, max_length=100)
    difficulty: Difficulty
    use_case: str | None = Field(default=None, max_length=80)
    time_commitment: str | None = Field(default=None, max_length=40)
    prerequisites: str | None = Field(default=None, max_length=500)
    best_part: str | None = Field(default=None, max_length=500)
    warning: str | None = Field(default=None, max_length=500)
    student_note: str | None = Field(default=None, max_length=800)
    tags: list[str] = Field(default_factory=list, max_length=8)
    links: list[ResourceLinkCreate] = Field(default_factory=list, max_length=20)
    attachments: list[ResourceAttachmentCreate] = Field(default_factory=list, max_length=20)


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, min_length=20, max_length=2000)
    url: HttpUrl | None = None
    type: ResourceType | None = None
    category: str | None = Field(default=None, min_length=2, max_length=100)
    difficulty: Difficulty | None = None
    use_case: str | None = Field(default=None, max_length=80)
    time_commitment: str | None = Field(default=None, max_length=40)
    prerequisites: str | None = Field(default=None, max_length=500)
    best_part: str | None = Field(default=None, max_length=500)
    warning: str | None = Field(default=None, max_length=500)
    student_note: str | None = Field(default=None, max_length=800)
    tags: list[str] | None = Field(default=None, max_length=8)
    links: list[ResourceLinkCreate] | None = Field(default=None, max_length=20)
    attachments: list[ResourceAttachmentCreate] | None = Field(default=None, max_length=20)


class ResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    url: str
    type: ResourceType
    category: str
    difficulty: Difficulty
    use_case: str | None
    time_commitment: str | None
    prerequisites: str | None
    best_part: str | None
    warning: str | None
    student_note: str | None
    upvotes: int
    downvotes: int
    is_hidden: bool = False
    is_pending_review: bool = False
    hidden_reason: str | None = None
    hidden_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    author: UserPublic
    tags: list[TagRead]
    links: list[ResourceLinkRead] = Field(default_factory=list)
    attachments: list[ResourceAttachmentRead] = Field(default_factory=list)


class VoteRequest(BaseModel):
    value: int = Field(ge=-1, le=1)
