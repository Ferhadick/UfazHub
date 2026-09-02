from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import QuestionStatus
from app.schemas.resource import ResourceRead
from app.schemas.user import UserPublic


class AnswerBase(BaseModel):
    body: str = Field(min_length=5, max_length=15000)
    linked_resources: list[dict] = Field(default_factory=list)


class AnswerCreate(AnswerBase):
    pass


class AnswerUpdate(BaseModel):
    body: str | None = Field(default=None, min_length=5, max_length=15000)
    linked_resources: list[dict] | None = None


class AnswerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_id: UUID
    author_id: UUID
    author: UserPublic
    body: str
    linked_resources: list[dict] = Field(default_factory=list)
    upvotes: int
    downvotes: int
    is_pinned: bool
    is_helpful: bool
    is_hidden: bool
    created_at: datetime
    updated_at: datetime


class QuestionBase(BaseModel):
    title: str = Field(min_length=5, max_length=220)
    body: str | None = Field(default=None, max_length=15000)
    topic_tag: str = Field(default="general", min_length=2, max_length=80)
    linked_resource_id: UUID | None = None


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=220)
    body: str | None = Field(default=None, max_length=15000)
    topic_tag: str | None = Field(default=None, min_length=2, max_length=80)
    linked_resource_id: UUID | None = None
    status: QuestionStatus | None = None


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    author: UserPublic
    title: str
    body: str | None = None
    topic_tag: str
    linked_resource_id: UUID | None = None
    linked_resource: ResourceRead | None = None
    status: QuestionStatus
    upvotes: int
    downvotes: int
    is_hidden: bool
    is_pinned_admin: bool
    answers_count: int = 0
    has_verified_answer: bool = False
    created_at: datetime
    updated_at: datetime


class QuestionDetail(QuestionRead):
    answers: list[AnswerRead] = Field(default_factory=list)


class QuestionMergeRequest(BaseModel):
    source_question_id: UUID
    target_question_id: UUID


class AdminQAQueueCluster(BaseModel):
    keyword: str
    count: int
    questions: list[QuestionRead] = Field(default_factory=list)


class AdminQAQueueResponse(BaseModel):
    total_unanswered: int
    total_questions: int
    clusters: list[AdminQAQueueCluster] = Field(default_factory=list)
    recent_questions: list[QuestionRead] = Field(default_factory=list)
