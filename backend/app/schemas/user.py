from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole, UserStatus


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    username: str
    name: str
    bio: str | None
    faculty: str | None
    graduation_year: int | None = None
    current_role: str | None = None
    company_or_institution: str | None = None
    degree_level: str | None = None
    is_verified: bool = False
    avatar_url: str | None
    github_url: str | None = None
    linkedin_url: str | None = None
    telegram_url: str | None = None
    youtube_url: str | None = None
    website_url: str | None = None
    reputation_score: int
    role: UserRole
    status: UserStatus
    muted_until: datetime | None
    warning_count: int
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=2, max_length=120)
    faculty: str | None = Field(default=None, max_length=120)
    graduation_year: int | None = Field(default=None, ge=2015, le=2035)
    current_role: str | None = Field(default=None, max_length=120)
    company_or_institution: str | None = Field(default=None, max_length=120)
    degree_level: str | None = Field(default=None, max_length=60)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    bio: str | None = Field(default=None, max_length=1000)
    faculty: str | None = Field(default=None, max_length=120)
    graduation_year: int | None = Field(default=None, ge=2015, le=2035)
    current_role: str | None = Field(default=None, max_length=120)
    company_or_institution: str | None = Field(default=None, max_length=120)
    degree_level: str | None = Field(default=None, max_length=60)
    avatar_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=255)
    telegram_url: str | None = Field(default=None, max_length=255)
    youtube_url: str | None = Field(default=None, max_length=255)
    website_url: str | None = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
