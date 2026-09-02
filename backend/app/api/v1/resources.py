from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response

from app.api.deps import DbSession, get_current_user, get_optional_guest, get_optional_user
from app.core.errors import ApiError
from app.models import ActionEventType, GuestSession, User
from app.schemas.common import PaginatedResponse
from app.schemas.resource import ResourceCreate, ResourceRead, ResourceUpdate, VoteRequest
from app.services.events import ensure_guest_session, log_action
from app.services.resources import create_resource, delete_resource, get_resource, list_resources, update_resource, vote_resource

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=PaginatedResponse[ResourceRead])
async def index(
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    type: str | None = None,
    q: str | None = None,
) -> PaginatedResponse[ResourceRead]:
    items, total = await list_resources(session, limit, offset, type, q=q)
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=ResourceRead, status_code=201)
async def create(payload: ResourceCreate, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> ResourceRead:
    return await create_resource(session, payload, user)


@router.post("/blocked-submit", status_code=204)
async def blocked_submit(session: DbSession, request: Request, response: Response) -> Response:
    guest = await ensure_guest_session(session, request, response)
    await log_action(session, ActionEventType.submit_attempt_blocked, guest=guest, metadata={"target": "resource"})
    await session.commit()
    return Response(status_code=204)


@router.get("/{resource_id}", response_model=ResourceRead)
async def show(
    resource_id: UUID,
    session: DbSession,
    user: Annotated[User | None, Depends(get_optional_user)],
    guest: Annotated[GuestSession | None, Depends(get_optional_guest)],
) -> ResourceRead:
    resource = await get_resource(session, resource_id)
    await log_action(session, ActionEventType.view_resource, user=user, guest=guest, target_type="resource", target_id=resource_id)
    await session.commit()
    return resource


@router.patch("/{resource_id}", response_model=ResourceRead)
async def update(resource_id: UUID, payload: ResourceUpdate, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> ResourceRead:
    return await update_resource(session, resource_id, payload, user)


@router.delete("/{resource_id}", status_code=204)
async def destroy(resource_id: UUID, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> Response:
    await delete_resource(session, resource_id, user)
    return Response(status_code=204)


@router.post("/{resource_id}/vote", response_model=ResourceRead)
async def vote(resource_id: UUID, payload: VoteRequest, session: DbSession, user: Annotated[User | None, Depends(get_optional_user)], request: Request, response: Response) -> ResourceRead:
    if user is None:
        guest = await ensure_guest_session(session, request, response)
        await log_action(session, ActionEventType.vote_attempt_blocked, guest=guest, target_type="resource", target_id=resource_id)
        await session.commit()
        raise ApiError(401, "AUTH_REQUIRED", "Create an account to vote and build reputation.")
    return await vote_resource(session, resource_id, payload.value, user)

