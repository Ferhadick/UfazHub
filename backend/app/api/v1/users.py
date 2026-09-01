from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.schemas.common import PaginatedResponse
from app.schemas.resource import TagRead
from app.schemas.user import UserPublic
from app.services.users import leaderboard, top_tags

router = APIRouter(tags=["users"])


@router.get("/people", response_model=PaginatedResponse[UserPublic])
async def people(
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedResponse[UserPublic]:
    items, total = await leaderboard(session, limit, offset)
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/tags", response_model=list[TagRead])
async def tags(session: DbSession, limit: Annotated[int, Query(ge=1, le=50)] = 20) -> list[TagRead]:
    return await top_tags(session, limit)

