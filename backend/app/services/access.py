from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.models import User, UserRole, UserStatus


def is_admin(user: User) -> bool:
    return user.role == UserRole.admin


def assert_author_or_admin(author_id, user: User, action: str = "edit this item") -> None:
    if is_admin(user) or author_id == user.id:
        return
    raise ApiError(403, "FORBIDDEN", f"Only the author can {action}.")


async def expire_mute_if_needed(session: AsyncSession, user: User) -> User:
    if user.status == UserStatus.muted and user.muted_until is not None:
        until = user.muted_until
        if until.tzinfo is None:
            until = until.replace(tzinfo=timezone.utc)
        if until <= datetime.now(timezone.utc):
            user.status = UserStatus.active
            user.muted_until = None
            await session.commit()
            await session.refresh(user)
    return user


async def assert_user_can_write(session: AsyncSession, user: User) -> None:
    await expire_mute_if_needed(session, user)
    if user.status == UserStatus.banned:
        raise ApiError(403, "ACCOUNT_BANNED", "This account is banned.")
    if user.status == UserStatus.muted:
        raise ApiError(403, "MUTED", "This account is muted and cannot publish, edit, or vote.")


def assert_not_banned(user: User) -> None:
    if user.status == UserStatus.banned:
        raise ApiError(403, "ACCOUNT_BANNED", "This account is banned.")
