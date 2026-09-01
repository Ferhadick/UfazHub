from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import ApiError
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.models import ActionEventType, GuestSession, User
from app.schemas.user import LoginRequest, TokenResponse, UserCreate
from app.services.events import convert_guest_history, log_action


async def register_user(session: AsyncSession, payload: UserCreate, guest: GuestSession | None) -> TokenResponse:
    existing = await session.scalar(select(User).where((User.email == payload.email) | (User.username == payload.username)))
    if existing is not None:
        raise ApiError(409, "USER_EXISTS", "A user with this email or username already exists.")
    user = User(
        email=str(payload.email).lower(),
        username=payload.username,
        password_hash=hash_password(payload.password),
        name=payload.name,
        faculty=payload.faculty,
    )
    session.add(user)
    await session.flush()
    await convert_guest_history(session, guest, user)
    await log_action(session, ActionEventType.signup_completed, user=user, guest=guest)
    await session.commit()
    await session.refresh(user)
    return _token_response(user)


async def login_user(session: AsyncSession, payload: LoginRequest, guest: GuestSession | None) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == str(payload.email).lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise ApiError(401, "INVALID_CREDENTIALS", "The email or password is incorrect.")
    await convert_guest_history(session, guest, user)
    await log_action(session, ActionEventType.login, user=user, guest=guest)
    await session.commit()
    await session.refresh(user)
    return _token_response(user)


def _token_response(user: User) -> TokenResponse:
    access = create_token(user.id, "access", timedelta(minutes=settings.access_token_minutes))
    return TokenResponse(access_token=access, user=user)


def create_refresh_token(user: User) -> str:
    return create_token(user.id, "refresh", timedelta(days=settings.refresh_token_days))


async def refresh_access_token(session: AsyncSession, refresh_token: str | None) -> TokenResponse:
    if not refresh_token:
        raise ApiError(401, "REFRESH_REQUIRED", "Refresh token is missing.")
    user_id = decode_token(refresh_token, "refresh")
    user = await session.get(User, user_id)
    if user is None:
        raise ApiError(401, "USER_NOT_FOUND", "The authenticated user no longer exists.")
    return _token_response(user)
