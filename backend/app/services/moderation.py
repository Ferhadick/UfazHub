from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import ApiError
from app.models import ActionEventType, User, UserModerationEvent, UserRole, UserStatus
from app.models.enums import ModerationEventType
from app.services.events import log_action

AUTO_MUTE_AFTER_WARNINGS = 3
AUTO_MUTE_MINUTES = 24 * 60


def bootstrap_admin_role(user: User) -> None:
    if user.email.lower() in settings.bootstrap_admin_emails:
        user.role = UserRole.admin


async def count_admins(session: AsyncSession) -> int:
    return int(await session.scalar(select(func.count()).select_from(User).where(User.role == UserRole.admin)) or 0)


async def record_moderation_event(
    session: AsyncSession,
    *,
    user: User,
    actor: User,
    event_type: ModerationEventType,
    reason: str,
    duration_minutes: int | None = None,
    expires_at: datetime | None = None,
    metadata: dict[str, object] | None = None,
) -> UserModerationEvent:
    event = UserModerationEvent(
        user_id=user.id,
        actor_id=actor.id,
        event_type=event_type,
        reason=reason,
        duration_minutes=duration_minutes,
        expires_at=expires_at,
        event_metadata=metadata or {},
    )
    session.add(event)
    await session.flush()
    return event


async def warn_user(session: AsyncSession, actor: User, user: User, reason: str) -> User:
    user.warning_count += 1
    await record_moderation_event(session, user=user, actor=actor, event_type=ModerationEventType.warning, reason=reason)
    await log_action(
        session,
        ActionEventType.admin_warn,
        user=actor,
        target_type="user",
        target_id=user.id,
        metadata={"reason": reason, "warning_count": user.warning_count},
    )
    if (
        user.warning_count >= AUTO_MUTE_AFTER_WARNINGS
        and user.warning_count % AUTO_MUTE_AFTER_WARNINGS == 0
        and user.status == UserStatus.active
    ):
        await mute_user(
            session,
            actor,
            user,
            reason="Automatic mute after three warnings.",
            duration_minutes=AUTO_MUTE_MINUTES,
            metadata={"automatic": True, "source": "warning_threshold"},
        )
    await session.commit()
    await session.refresh(user)
    return user


async def mute_user(
    session: AsyncSession,
    actor: User,
    user: User,
    reason: str,
    duration_minutes: int | None,
    metadata: dict[str, object] | None = None,
    commit: bool = False,
) -> User:
    expires_at = None
    if duration_minutes is not None:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)
    user.status = UserStatus.muted
    user.muted_until = expires_at
    await record_moderation_event(
        session,
        user=user,
        actor=actor,
        event_type=ModerationEventType.mute,
        reason=reason,
        duration_minutes=duration_minutes,
        expires_at=expires_at,
        metadata=metadata,
    )
    await log_action(
        session,
        ActionEventType.admin_mute,
        user=actor,
        target_type="user",
        target_id=user.id,
        metadata={"reason": reason, "duration_minutes": duration_minutes},
    )
    if commit:
        await session.commit()
        await session.refresh(user)
    return user


async def unmute_user(session: AsyncSession, actor: User, user: User, reason: str) -> User:
    user.status = UserStatus.active
    user.muted_until = None
    await record_moderation_event(session, user=user, actor=actor, event_type=ModerationEventType.unmute, reason=reason)
    await log_action(session, ActionEventType.admin_unmute, user=actor, target_type="user", target_id=user.id, metadata={"reason": reason})
    await session.commit()
    await session.refresh(user)
    return user


async def ban_user(session: AsyncSession, actor: User, user: User, reason: str) -> User:
    if user.id == actor.id:
        raise ApiError(403, "SELF_ACTION_FORBIDDEN", "You cannot ban yourself.")
    if user.role == UserRole.admin and await count_admins(session) <= 1:
        raise ApiError(403, "LAST_ADMIN", "The last remaining admin cannot be banned.")
    user.status = UserStatus.banned
    user.muted_until = None
    await record_moderation_event(session, user=user, actor=actor, event_type=ModerationEventType.ban, reason=reason)
    await log_action(session, ActionEventType.admin_ban, user=actor, target_type="user", target_id=user.id, metadata={"reason": reason})
    await session.commit()
    await session.refresh(user)
    return user


async def unban_user(session: AsyncSession, actor: User, user: User, reason: str) -> User:
    user.status = UserStatus.active
    await record_moderation_event(session, user=user, actor=actor, event_type=ModerationEventType.unban, reason=reason)
    await log_action(session, ActionEventType.admin_unban, user=actor, target_type="user", target_id=user.id, metadata={"reason": reason})
    await session.commit()
    await session.refresh(user)
    return user
