from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response

from app.api.deps import DbSession, get_current_user, get_optional_guest, get_optional_user
from app.core.errors import ApiError
from app.models import ActionEventType, GuestSession, User
from app.schemas.collection import CollectionCreate, CollectionRead, CollectionUpdate
from app.schemas.common import PaginatedResponse
from app.schemas.resource import VoteRequest
from app.services.collections import create_collection, delete_collection, get_collection, list_collections, update_collection, vote_collection
from app.services.events import ensure_guest_session, log_action

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("", response_model=PaginatedResponse[CollectionRead])
async def index(
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    q: str | None = None,
) -> PaginatedResponse[CollectionRead]:
    items, total = await list_collections(session, limit, offset, q=q)
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=CollectionRead, status_code=201)
async def create(payload: CollectionCreate, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> CollectionRead:
    return await create_collection(session, payload, user)


@router.post("/blocked-submit", status_code=204)
async def blocked_submit(session: DbSession, request: Request, response: Response) -> Response:
    guest = await ensure_guest_session(session, request, response)
    await log_action(session, ActionEventType.submit_attempt_blocked, guest=guest, metadata={"target": "collection"})
    await session.commit()
    return Response(status_code=204)


@router.get("/{collection_id}", response_model=CollectionRead)
async def show(
    collection_id: UUID,
    session: DbSession,
    user: Annotated[User | None, Depends(get_optional_user)],
    guest: Annotated[GuestSession | None, Depends(get_optional_guest)],
) -> CollectionRead:
    collection = await get_collection(session, collection_id)
    await log_action(session, ActionEventType.view_collection, user=user, guest=guest, target_type="collection", target_id=collection_id)
    await session.commit()
    return collection


@router.patch("/{collection_id}", response_model=CollectionRead)
async def update(
    collection_id: UUID,
    payload: CollectionUpdate,
    session: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> CollectionRead:
    return await update_collection(session, collection_id, payload, user)


@router.delete("/{collection_id}", status_code=204)
async def destroy(
    collection_id: UUID,
    session: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    await delete_collection(session, collection_id, user)
    return Response(status_code=204)


@router.post("/{collection_id}/vote", response_model=CollectionRead)
async def vote(
    collection_id: UUID,
    payload: VoteRequest,
    session: DbSession,
    user: Annotated[User | None, Depends(get_optional_user)],
    request: Request,
    response: Response,
) -> CollectionRead:
    if user is None:
        guest = await ensure_guest_session(session, request, response)
        await log_action(session, ActionEventType.vote_attempt_blocked, guest=guest, target_type="collection", target_id=collection_id)
        await session.commit()
        raise ApiError(401, "AUTH_REQUIRED", "Create an account to vote and build reputation.")
    return await vote_collection(session, collection_id, payload.value, user)

