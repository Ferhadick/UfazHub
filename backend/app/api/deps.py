from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.core.security import decode_token
from app.db.session import get_session
from app.models import GuestSession, User, UserRole, UserStatus
from app.services.access import assert_not_banned, expire_mute_if_needed

DbSession = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(
    session: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise ApiError(401, "AUTH_REQUIRED", "You need to log in to continue.")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = decode_token(token, "access")
    user = await session.get(User, user_id)
    if user is None:
        raise ApiError(401, "USER_NOT_FOUND", "The authenticated user no longer exists.")
    assert_not_banned(user)
    return await expire_mute_if_needed(session, user)


async def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != UserRole.admin:
        raise ApiError(403, "ADMIN_REQUIRED", "Admin access is required.")
    return user


async def get_optional_guest(
    session: DbSession,
    request: Request,
    guest_session_id: Annotated[str | None, Cookie(alias="ufaz_guest")] = None,
) -> GuestSession | None:
    if guest_session_id is None:
        return None
    try:
        guest_id = UUID(guest_session_id)
    except ValueError:
        return None
    guest = await session.get(GuestSession, guest_id)
    if guest is not None:
        request.state.guest_session = guest
    return guest


async def get_optional_user(
    session: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        user = await session.get(User, decode_token(authorization.removeprefix("Bearer ").strip(), "access"))
    except ApiError:
        return None
    if user is None or user.status == UserStatus.banned:
        return None
    return await expire_mute_if_needed(session, user)
