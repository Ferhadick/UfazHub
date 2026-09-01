from datetime import datetime, timezone
from hashlib import sha256
from uuid import UUID

from fastapi import Request, Response
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import ActionEvent, ActionEventType, ActorType, GuestSession, User


def _hash_ip(ip: str | None) -> str | None:
    if not ip:
        return None
    return sha256(f"{settings.ip_hash_salt}:{ip}".encode("utf-8")).hexdigest()


async def ensure_guest_session(session: AsyncSession, request: Request, response: Response) -> GuestSession:
    existing = request.cookies.get("ufaz_guest")
    if existing:
        try:
            existing_id = UUID(existing)
        except ValueError:
            existing_id = None
        guest = await session.get(GuestSession, existing_id) if existing_id is not None else None
        if guest is not None and guest.converted_user_id is None:
            guest.last_seen_at = datetime.now(timezone.utc)
            await session.commit()
            response.set_cookie("ufaz_guest", str(guest.id), httponly=True, samesite="lax", secure=settings.cookie_secure)
            return guest

    guest = GuestSession(
        ip_hash=_hash_ip(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    session.add(guest)
    await session.commit()
    await session.refresh(guest)
    response.set_cookie("ufaz_guest", str(guest.id), httponly=True, samesite="lax", secure=settings.cookie_secure)
    return guest


async def log_action(
    session: AsyncSession,
    event_type: ActionEventType,
    user: User | None = None,
    guest: GuestSession | None = None,
    target_type: str | None = None,
    target_id: UUID | None = None,
    metadata: dict[str, object] | None = None,
) -> None:
    actor_type = ActorType.user if user is not None else ActorType.guest
    if user is None and guest is None:
        return
    session.add(
        ActionEvent(
            actor_type=actor_type,
            user_id=user.id if user else None,
            guest_session_id=guest.id if guest else None,
            event_type=event_type,
            target_type=target_type,
            target_id=target_id,
            event_metadata=metadata or {},
        )
    )


async def convert_guest_history(session: AsyncSession, guest: GuestSession | None, user: User) -> None:
    if guest is None:
        return
    now = datetime.now(timezone.utc)
    guest.converted_user_id = user.id
    guest.converted_at = now
    await session.execute(
        update(ActionEvent)
        .where(ActionEvent.guest_session_id == guest.id)
        .values(actor_type=ActorType.user, user_id=user.id)
    )
