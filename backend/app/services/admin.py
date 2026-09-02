from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.core.security import hash_password
from app.models import (
    ActionEvent,
    ActionEventType,
    ActorType,
    Article,
    Collection,
    GuestSession,
    Resource,
    User,
    UserModerationEvent,
    UserRole,
    UserStatus,
)
from app.models.enums import ModerationEventType
from app.schemas.admin import (
    AdminActionEventRead,
    AdminArticleRead,
    AdminCollectionRead,
    AdminContentListItem,
    AdminOverview,
    AdminResourceRead,
    AdminUserCreate,
    AdminUserDetail,
    AdminUserUpdate,
    ContentCounts,
    ContentKind,
    ModerationEventRead,
)
from app.schemas.article import ArticleUpdate
from app.schemas.collection import CollectionUpdate
from app.schemas.resource import ResourceUpdate
from app.schemas.user import UserPublic
from app.schemas.admin import MuteBody, ReasonBody
from app.services.articles import get_article_by_id, update_article
from app.services.collections import get_collection, update_collection
from app.services.events import log_action
from app.services.moderation import (
    ban_user as moderate_ban,
    count_admins,
    mute_user as moderate_mute,
    record_moderation_event,
    unban_user as moderate_unban,
    unmute_user as moderate_unmute,
    warn_user as moderate_warn,
)
from app.services.resources import approve_resource as approve_resource_svc, get_resource, update_resource

BLOCKED_GUEST_EVENTS = (ActionEventType.vote_attempt_blocked, ActionEventType.submit_attempt_blocked)


def _serialize_action(event: ActionEvent, username: str | None = None, ip_hash: str | None = None) -> AdminActionEventRead:
    return AdminActionEventRead(
        id=event.id,
        actor_type=event.actor_type,
        event_type=event.event_type,
        user_id=event.user_id,
        username=username,
        guest_session_id=event.guest_session_id,
        ip_hash=ip_hash if event.actor_type == ActorType.guest else None,
        target_type=event.target_type,
        target_id=event.target_id,
        metadata=event.event_metadata or {},
        created_at=event.created_at,
    )


def _serialize_moderation(event: UserModerationEvent, actor_username: str | None = None) -> ModerationEventRead:
    return ModerationEventRead(
        id=event.id,
        user_id=event.user_id,
        actor_id=event.actor_id,
        event_type=event.event_type,
        reason=event.reason,
        duration_minutes=event.duration_minutes,
        expires_at=event.expires_at,
        created_at=event.created_at,
        actor_username=actor_username,
    )


async def get_user_or_404(session: AsyncSession, user_id: UUID) -> User:
    user = await session.get(User, user_id)
    if user is None:
        raise ApiError(404, "USER_NOT_FOUND", "User was not found.")
    return user


async def overview(session: AsyncSession) -> AdminOverview:
    users_total = int(await session.scalar(select(func.count()).select_from(User)) or 0)
    users_active = int(await session.scalar(select(func.count()).select_from(User).where(User.status == UserStatus.active)) or 0)
    users_muted = int(await session.scalar(select(func.count()).select_from(User).where(User.status == UserStatus.muted)) or 0)
    users_banned = int(await session.scalar(select(func.count()).select_from(User).where(User.status == UserStatus.banned)) or 0)
    admins = await count_admins(session)
    content_counts = ContentCounts(
        resources=int(await session.scalar(select(func.count()).select_from(Resource)) or 0),
        articles=int(await session.scalar(select(func.count()).select_from(Article)) or 0),
        collections=int(await session.scalar(select(func.count()).select_from(Collection)) or 0),
    )
    hidden_counts = ContentCounts(
        resources=int(await session.scalar(select(func.count()).select_from(Resource).where(Resource.is_hidden.is_(True))) or 0),
        articles=int(await session.scalar(select(func.count()).select_from(Article).where(Article.is_hidden.is_(True))) or 0),
        collections=int(await session.scalar(select(func.count()).select_from(Collection).where(Collection.is_hidden.is_(True))) or 0),
    )
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    event_rows = (await session.execute(
        select(ActionEvent.event_type, func.count()).where(ActionEvent.created_at >= week_ago).group_by(ActionEvent.event_type)
    )).all()
    events_last_7_days = {row[0].value: int(row[1]) for row in event_rows}

    moderation_rows = (
        await session.execute(
            select(UserModerationEvent, User.username)
            .join(User, UserModerationEvent.actor_id == User.id)
            .order_by(UserModerationEvent.created_at.desc())
            .limit(10)
        )
    ).all()
    blocked_rows = (
        await session.execute(
            select(ActionEvent, GuestSession.ip_hash)
            .outerjoin(GuestSession, ActionEvent.guest_session_id == GuestSession.id)
            .where(ActionEvent.event_type.in_(BLOCKED_GUEST_EVENTS), ActionEvent.actor_type == ActorType.guest)
            .order_by(ActionEvent.created_at.desc())
            .limit(10)
        )
    ).all()

    return AdminOverview(
        users_total=users_total,
        users_active=users_active,
        users_muted=users_muted,
        users_banned=users_banned,
        admins=admins,
        content_counts=content_counts,
        hidden_counts=hidden_counts,
        events_last_7_days=events_last_7_days,
        recent_moderation_events=[_serialize_moderation(event, username) for event, username in moderation_rows],
        recent_blocked_guest_actions=[_serialize_action(event, ip_hash=ip_hash) for event, ip_hash in blocked_rows],
    )


async def list_users(
    session: AsyncSession,
    *,
    q: str | None,
    status: UserStatus | None,
    role: UserRole | None,
    limit: int,
    offset: int,
) -> tuple[list[User], int]:
    stmt = select(User)
    count_stmt = select(func.count()).select_from(User)
    if q:
        pattern = f"%{q.strip()}%"
        search = or_(User.username.ilike(pattern), User.email.ilike(pattern), User.name.ilike(pattern))
        stmt = stmt.where(search)
        count_stmt = count_stmt.where(search)
    if status:
        stmt = stmt.where(User.status == status)
        count_stmt = count_stmt.where(User.status == status)
    if role:
        stmt = stmt.where(User.role == role)
        count_stmt = count_stmt.where(User.role == role)
    stmt = stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)
    return list((await session.scalars(stmt)).all()), int(await session.scalar(count_stmt) or 0)


async def create_admin_account(session: AsyncSession, payload: AdminUserCreate, actor: User) -> User:
    existing = await session.scalar(select(User).where((User.email == str(payload.email).lower()) | (User.username == payload.username)))
    if existing is not None:
        raise ApiError(409, "USER_EXISTS", "A user with this email or username already exists.")
    user = User(
        email=str(payload.email).lower(),
        username=payload.username,
        password_hash=hash_password(payload.password),
        name=payload.name,
        faculty=payload.faculty,
        role=UserRole.admin,
        status=UserStatus.active,
    )
    session.add(user)
    await session.flush()
    await record_moderation_event(
        session,
        user=user,
        actor=actor,
        event_type=ModerationEventType.role_change,
        reason="Created as admin from the moderation panel.",
        metadata={"role": UserRole.admin.value},
    )
    await log_action(
        session,
        ActionEventType.admin_role_change,
        user=actor,
        target_type="user",
        target_id=user.id,
        metadata={"role": UserRole.admin.value, "created": True},
    )
    await session.commit()
    await session.refresh(user)
    return user


async def get_user_detail(session: AsyncSession, user_id: UUID) -> AdminUserDetail:
    user = await get_user_or_404(session, user_id)
    history_rows = (
        await session.execute(
            select(UserModerationEvent, User.username)
            .join(User, UserModerationEvent.actor_id == User.id)
            .where(UserModerationEvent.user_id == user_id)
            .order_by(UserModerationEvent.created_at.desc())
            .limit(50)
        )
    ).all()
    action_rows = (
        await session.execute(
            select(ActionEvent, User.username, GuestSession.ip_hash)
            .outerjoin(User, ActionEvent.user_id == User.id)
            .outerjoin(GuestSession, ActionEvent.guest_session_id == GuestSession.id)
            .where(ActionEvent.user_id == user_id)
            .order_by(ActionEvent.created_at.desc())
            .limit(20)
        )
    ).all()
    return AdminUserDetail(
        user=UserPublic.model_validate(user),
        moderation_history=[_serialize_moderation(event, username) for event, username in history_rows],
        content_counts=ContentCounts(
            resources=int(await session.scalar(select(func.count()).select_from(Resource).where(Resource.author_id == user_id)) or 0),
            articles=int(await session.scalar(select(func.count()).select_from(Article).where(Article.author_id == user_id)) or 0),
            collections=int(await session.scalar(select(func.count()).select_from(Collection).where(Collection.author_id == user_id)) or 0),
        ),
        recent_action_events=[_serialize_action(event, username, ip_hash) for event, username, ip_hash in action_rows],
    )


async def update_admin_user(session: AsyncSession, actor: User, user_id: UUID, payload: AdminUserUpdate) -> User:
    user = await get_user_or_404(session, user_id)
    data = payload.model_dump(exclude_unset=True)
    new_role = data.pop("role", None)
    role_reason = data.pop("reason", None)
    if "email" in data and data["email"] is not None:
        data["email"] = str(data["email"]).lower()
    if "username" in data or "email" in data:
        username = data.get("username", user.username)
        email = data.get("email", user.email)
        clash = await session.scalar(
            select(User).where(User.id != user.id).where((User.username == username) | (User.email == email))
        )
        if clash is not None:
            raise ApiError(409, "USER_EXISTS", "A user with this email or username already exists.")
    for key, value in data.items():
        setattr(user, key, value)
    if data:
        await log_action(
            session,
            ActionEventType.admin_user_edit,
            user=actor,
            target_type="user",
            target_id=user.id,
            metadata={"fields": sorted(data.keys())},
        )
    if new_role is not None and new_role != user.role:
        await _change_role(session, actor, user, new_role, reason=role_reason)
    await session.commit()
    await session.refresh(user)
    return user


async def _change_role(session: AsyncSession, actor: User, user: User, new_role: UserRole, reason: str | None = None) -> None:
    if user.role == UserRole.admin and new_role != UserRole.admin and await count_admins(session) <= 1:
        raise ApiError(403, "LAST_ADMIN", "The last remaining admin cannot be demoted.")
    if user.id == actor.id and new_role != UserRole.admin:
        raise ApiError(403, "SELF_ACTION_FORBIDDEN", "You cannot demote yourself.")
    previous = user.role
    user.role = new_role
    await record_moderation_event(
        session,
        user=user,
        actor=actor,
        event_type=ModerationEventType.role_change,
        reason=reason or f"Role changed from {previous.value} to {new_role.value}.",
        metadata={"from": previous.value, "to": new_role.value},
    )
    await log_action(
        session,
        ActionEventType.admin_role_change,
        user=actor,
        target_type="user",
        target_id=user.id,
        metadata={"from": previous.value, "to": new_role.value},
    )


async def list_content(
    session: AsyncSession,
    *,
    kind: ContentKind,
    q: str | None,
    hidden: bool | None,
    pending_review: bool | None = None,
    author_id: UUID | None,
    limit: int,
    offset: int,
) -> tuple[list[AdminContentListItem], int]:
    model = {"resource": Resource, "article": Article, "collection": Collection}[kind]
    stmt = select(model).options(selectinload(model.author))
    count_stmt = select(func.count()).select_from(model)
    if q:
        pattern = f"%{q.strip()}%"
        search = model.title.ilike(pattern)
        stmt = stmt.where(search)
        count_stmt = count_stmt.where(search)
    if hidden is not None:
        stmt = stmt.where(model.is_hidden.is_(hidden))
        count_stmt = count_stmt.where(model.is_hidden.is_(hidden))
    if pending_review is not None and kind == "resource":
        stmt = stmt.where(Resource.is_pending_review.is_(pending_review))
        count_stmt = count_stmt.where(Resource.is_pending_review.is_(pending_review))
    if author_id is not None:
        stmt = stmt.where(model.author_id == author_id)
        count_stmt = count_stmt.where(model.author_id == author_id)
    stmt = stmt.order_by(model.created_at.desc()).limit(limit).offset(offset)
    rows = list((await session.scalars(stmt)).all())
    items = [
        AdminContentListItem(
            kind=kind,
            id=row.id,
            title=row.title,
            slug=getattr(row, "slug", None),
            is_hidden=row.is_hidden,
            is_pending_review=getattr(row, "is_pending_review", False),
            hidden_reason=row.hidden_reason,
            author_id=row.author_id,
            author_username=row.author.username,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return items, int(await session.scalar(count_stmt) or 0)


async def get_content(session: AsyncSession, kind: ContentKind, content_id: UUID):
    if kind == "resource":
        return AdminResourceRead.model_validate(await get_resource(session, content_id, include_hidden=True))
    if kind == "article":
        return AdminArticleRead.model_validate(await get_article_by_id(session, content_id, include_hidden=True, include_drafts=True))
    return AdminCollectionRead.model_validate(await get_collection(session, content_id, include_hidden=True))


async def patch_content(
    session: AsyncSession,
    actor: User,
    kind: ContentKind,
    content_id: UUID,
    payload: ResourceUpdate | ArticleUpdate | CollectionUpdate,
):
    if kind == "resource":
        resource = await update_resource(session, content_id, payload, actor, enforce_write_guard=False)
        return AdminResourceRead.model_validate(resource)
    if kind == "article":
        article = await get_article_by_id(session, content_id, include_hidden=True, include_drafts=True)
        updated = await update_article(session, article.slug, payload, actor, enforce_write_guard=False)
        return AdminArticleRead.model_validate(updated)
    collection = await update_collection(session, content_id, payload, actor, enforce_write_guard=False)
    return AdminCollectionRead.model_validate(collection)


async def hide_content(session: AsyncSession, actor: User, kind: ContentKind, content_id: UUID, reason: str):
    entity = await _load_content(session, kind, content_id)
    entity.is_hidden = True
    entity.hidden_reason = reason
    entity.hidden_at = datetime.now(timezone.utc)
    entity.hidden_by_id = actor.id
    await log_action(
        session,
        ActionEventType.admin_hide,
        user=actor,
        target_type=kind,
        target_id=entity.id,
        metadata={"reason": reason},
    )
    await session.commit()
    return await get_content(session, kind, content_id)


async def unhide_content(session: AsyncSession, actor: User, kind: ContentKind, content_id: UUID, reason: str):
    entity = await _load_content(session, kind, content_id)
    entity.is_hidden = False
    entity.hidden_reason = None
    entity.hidden_at = None
    entity.hidden_by_id = None
    await log_action(
        session,
        ActionEventType.admin_unhide,
        user=actor,
        target_type=kind,
        target_id=entity.id,
        metadata={"reason": reason},
    )
    await session.commit()
    return await get_content(session, kind, content_id)


async def delete_content(session: AsyncSession, actor: User, kind: ContentKind, content_id: UUID) -> None:
    entity = await _load_content(session, kind, content_id)
    await log_action(
        session,
        ActionEventType.admin_delete,
        user=actor,
        target_type=kind,
        target_id=entity.id,
        metadata={"title": entity.title},
    )
    await session.delete(entity)
    await session.commit()


async def _load_content(session: AsyncSession, kind: ContentKind, content_id: UUID) -> Resource | Article | Collection:
    if kind == "resource":
        return await get_resource(session, content_id, include_hidden=True)
    if kind == "article":
        return await get_article_by_id(session, content_id, include_hidden=True, include_drafts=True)
    return await get_collection(session, content_id, include_hidden=True)


async def list_events(
    session: AsyncSession,
    *,
    event_type: ActionEventType | None,
    actor_type: ActorType | None,
    user_id: UUID | None,
    guest_session_id: UUID | None,
    from_: datetime | None,
    to: datetime | None,
    limit: int,
    offset: int,
) -> tuple[list[AdminActionEventRead], int]:
    stmt = (
        select(ActionEvent, User.username, GuestSession.ip_hash)
        .outerjoin(User, ActionEvent.user_id == User.id)
        .outerjoin(GuestSession, ActionEvent.guest_session_id == GuestSession.id)
    )
    count_stmt = select(func.count()).select_from(ActionEvent)
    if event_type:
        stmt = stmt.where(ActionEvent.event_type == event_type)
        count_stmt = count_stmt.where(ActionEvent.event_type == event_type)
    if actor_type:
        stmt = stmt.where(ActionEvent.actor_type == actor_type)
        count_stmt = count_stmt.where(ActionEvent.actor_type == actor_type)
    if user_id:
        stmt = stmt.where(ActionEvent.user_id == user_id)
        count_stmt = count_stmt.where(ActionEvent.user_id == user_id)
    if guest_session_id:
        stmt = stmt.where(ActionEvent.guest_session_id == guest_session_id)
        count_stmt = count_stmt.where(ActionEvent.guest_session_id == guest_session_id)
    if from_:
        stmt = stmt.where(ActionEvent.created_at >= from_)
        count_stmt = count_stmt.where(ActionEvent.created_at >= from_)
    if to:
        stmt = stmt.where(ActionEvent.created_at <= to)
        count_stmt = count_stmt.where(ActionEvent.created_at <= to)
    stmt = stmt.order_by(ActionEvent.created_at.desc()).limit(limit).offset(offset)
    rows = (await session.execute(stmt)).all()
    items = [_serialize_action(event, username, ip_hash) for event, username, ip_hash in rows]
    return items, int(await session.scalar(count_stmt) or 0)


async def warn_user(session: AsyncSession, user_id: UUID, payload: ReasonBody, actor: User) -> User:
    user = await get_user_or_404(session, user_id)
    return await moderate_warn(session, actor, user, payload.reason)


async def mute_user(session: AsyncSession, user_id: UUID, payload: MuteBody, actor: User) -> User:
    user = await get_user_or_404(session, user_id)
    return await moderate_mute(session, actor, user, payload.reason, payload.duration_minutes, commit=True)


async def unmute_user(session: AsyncSession, user_id: UUID, payload: ReasonBody, actor: User) -> User:
    user = await get_user_or_404(session, user_id)
    return await moderate_unmute(session, actor, user, payload.reason)


async def ban_user(session: AsyncSession, user_id: UUID, payload: ReasonBody, actor: User) -> User:
    user = await get_user_or_404(session, user_id)
    return await moderate_ban(session, actor, user, payload.reason)


async def unban_user(session: AsyncSession, user_id: UUID, payload: ReasonBody, actor: User) -> User:
    user = await get_user_or_404(session, user_id)
    return await moderate_unban(session, actor, user, payload.reason)


async def approve_resource(session: AsyncSession, resource_id: UUID, actor: User) -> AdminResourceRead:
    resource = await approve_resource_svc(session, resource_id, actor)
    return AdminResourceRead.model_validate(resource)


__all__ = [
    "approve_resource",
    "ban_user",
    "create_admin_account",
    "delete_content",
    "get_content",
    "get_user_detail",
    "hide_content",
    "list_content",
    "list_events",
    "list_users",
    "mute_user",
    "overview",
    "patch_content",
    "unban_user",
    "unhide_content",
    "unmute_user",
    "update_admin_user",
    "warn_user",
]
