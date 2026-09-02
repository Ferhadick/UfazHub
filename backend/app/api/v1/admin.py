from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response

from app.api.deps import DbSession, require_admin
from app.models import User
from app.models.enums import ActionEventType, ActorType, UserRole, UserStatus
from app.schemas.admin import (
    AdminActionEventRead,
    AdminArticleRead,
    AdminCollectionRead,
    AdminContentItem,
    AdminOverview,
    AdminResourceRead,
    AdminUserCreate,
    AdminUserDetail,
    AdminUserUpdate,
    ContentKind,
    MuteBody,
    ReasonBody,
)
from app.schemas.article import ArticleUpdate
from app.schemas.collection import CollectionUpdate
from app.schemas.common import PaginatedResponse
from app.schemas.resource import ResourceUpdate
from app.schemas.user import UserPublic
from app.services import admin as admin_service

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])
AdminUser = Annotated[User, Depends(require_admin)]


def _content_response(kind: ContentKind, item: Any) -> Any:
    if kind == "resource":
        return AdminResourceRead.model_validate(item)
    if kind == "article":
        return AdminArticleRead.model_validate(item)
    return AdminCollectionRead.model_validate(item)


@router.get("/overview", response_model=AdminOverview)
async def admin_overview(session: DbSession) -> AdminOverview:
    return await admin_service.overview(session)


@router.get("/users", response_model=PaginatedResponse[UserPublic])
async def admin_users(
    session: DbSession,
    q: str | None = None,
    status: UserStatus | None = None,
    role: UserRole | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedResponse[UserPublic]:
    items, total = await admin_service.list_users(session, q=q, status=status, role=role, limit=limit, offset=offset)
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("/users", response_model=UserPublic, status_code=201)
async def admin_create_user(payload: AdminUserCreate, session: DbSession, actor: AdminUser) -> UserPublic:
    return await admin_service.create_admin_account(session, payload, actor)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def admin_user_detail(user_id: UUID, session: DbSession) -> AdminUserDetail:
    return await admin_service.get_user_detail(session, user_id)


@router.patch("/users/{user_id}", response_model=UserPublic)
async def admin_user_update(user_id: UUID, payload: AdminUserUpdate, session: DbSession, actor: AdminUser) -> UserPublic:
    return await admin_service.update_admin_user(session, actor, user_id, payload)


@router.post("/users/{user_id}/warn", response_model=UserPublic)
async def admin_warn(user_id: UUID, payload: ReasonBody, session: DbSession, actor: AdminUser) -> UserPublic:
    return await admin_service.warn_user(session, user_id, payload, actor)


@router.post("/users/{user_id}/mute", response_model=UserPublic)
async def admin_mute(user_id: UUID, payload: MuteBody, session: DbSession, actor: AdminUser) -> UserPublic:
    return await admin_service.mute_user(session, user_id, payload, actor)


@router.post("/users/{user_id}/unmute", response_model=UserPublic)
async def admin_unmute(user_id: UUID, payload: ReasonBody, session: DbSession, actor: AdminUser) -> UserPublic:
    return await admin_service.unmute_user(session, user_id, payload, actor)


@router.post("/users/{user_id}/ban", response_model=UserPublic)
async def admin_ban(user_id: UUID, payload: ReasonBody, session: DbSession, actor: AdminUser) -> UserPublic:
    return await admin_service.ban_user(session, user_id, payload, actor)


@router.post("/users/{user_id}/unban", response_model=UserPublic)
async def admin_unban(user_id: UUID, payload: ReasonBody, session: DbSession, actor: AdminUser) -> UserPublic:
    return await admin_service.unban_user(session, user_id, payload, actor)


@router.get("/content", response_model=PaginatedResponse[AdminContentItem])
async def admin_content(
    session: DbSession,
    kind: ContentKind,
    q: str | None = None,
    hidden: bool | None = None,
    pending_review: bool | None = None,
    author_id: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedResponse[AdminContentItem]:
    items, total = await admin_service.list_content(
        session, kind=kind, q=q, hidden=hidden, pending_review=pending_review, author_id=author_id, limit=limit, offset=offset
    )
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/content/{kind}/{content_id}")
async def admin_content_show(kind: ContentKind, content_id: UUID, session: DbSession) -> Any:
    return await admin_service.get_content(session, kind, content_id)


@router.patch("/content/{kind}/{content_id}")
async def admin_content_update(
    kind: ContentKind, content_id: UUID, payload: dict[str, Any], session: DbSession, actor: AdminUser
) -> Any:
    if kind == "resource":
        parsed: ResourceUpdate | ArticleUpdate | CollectionUpdate = ResourceUpdate.model_validate(payload)
    elif kind == "article":
        parsed = ArticleUpdate.model_validate(payload)
    else:
        parsed = CollectionUpdate.model_validate(payload)
    return await admin_service.patch_content(session, actor, kind, content_id, parsed)


@router.post("/content/{kind}/{content_id}/hide")
async def admin_content_hide(
    kind: ContentKind, content_id: UUID, payload: ReasonBody, session: DbSession, actor: AdminUser
) -> Any:
    return await admin_service.hide_content(session, actor, kind, content_id, payload.reason)


@router.post("/content/{kind}/{content_id}/unhide")
async def admin_content_unhide(
    kind: ContentKind, content_id: UUID, payload: ReasonBody, session: DbSession, actor: AdminUser
) -> Any:
    return await admin_service.unhide_content(session, actor, kind, content_id, payload.reason)


@router.delete("/content/{kind}/{content_id}", status_code=204)
async def admin_content_delete(kind: ContentKind, content_id: UUID, session: DbSession, actor: AdminUser) -> Response:
    await admin_service.delete_content(session, actor, kind, content_id)
    return Response(status_code=204)


@router.post("/content/resource/{content_id}/approve", response_model=AdminResourceRead)
async def admin_resource_approve(content_id: UUID, session: DbSession, actor: AdminUser) -> Any:
    return await admin_service.approve_resource(session, content_id, actor)


@router.get("/events", response_model=PaginatedResponse[AdminActionEventRead])
async def admin_events(
    session: DbSession,
    event_type: ActionEventType | None = None,
    actor_type: ActorType | None = None,
    user_id: UUID | None = None,
    guest_session_id: UUID | None = None,
    date_from: Annotated[datetime | None, Query(alias="from")] = None,
    date_to: Annotated[datetime | None, Query(alias="to")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedResponse[AdminActionEventRead]:
    items, total = await admin_service.list_events(
        session,
        event_type=event_type,
        actor_type=actor_type,
        user_id=user_id,
        guest_session_id=guest_session_id,
        from_=date_from,
        to=date_to,
        limit=limit,
        offset=offset,
    )
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)
