from fastapi import APIRouter, Request, Response

from app.api.deps import DbSession
from app.schemas.events import GuestSessionRead
from app.services.events import ensure_guest_session

router = APIRouter(prefix="/auth", tags=["guest"])


@router.post("/guest", response_model=GuestSessionRead)
async def continue_as_guest(session: DbSession, request: Request, response: Response) -> GuestSessionRead:
    guest = await ensure_guest_session(session, request, response)
    return GuestSessionRead(id=guest.id)

