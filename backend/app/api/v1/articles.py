from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, Response

from app.api.deps import DbSession, get_current_user, get_optional_guest, get_optional_user
from app.core.errors import ApiError
from app.models import ActionEventType, GuestSession, User
from app.schemas.article import ArticleCreate, ArticleRead, ArticleUpdate
from app.schemas.common import PaginatedResponse
from app.schemas.resource import VoteRequest
from app.services.articles import create_article, get_article_by_slug, list_articles, update_article, vote_article
from app.services.events import ensure_guest_session, log_action

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=PaginatedResponse[ArticleRead])
async def index(
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedResponse[ArticleRead]:
    items, total = await list_articles(session, limit, offset)
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=ArticleRead, status_code=201)
async def create(payload: ArticleCreate, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> ArticleRead:
    return await create_article(session, payload, user)


@router.post("/blocked-submit", status_code=204)
async def blocked_submit(session: DbSession, request: Request, response: Response) -> Response:
    guest = await ensure_guest_session(session, request, response)
    await log_action(session, ActionEventType.submit_attempt_blocked, guest=guest, metadata={"target": "article"})
    await session.commit()
    return Response(status_code=204)


@router.get("/{slug}", response_model=ArticleRead)
async def show(
    slug: str,
    session: DbSession,
    user: Annotated[User | None, Depends(get_optional_user)],
    guest: Annotated[GuestSession | None, Depends(get_optional_guest)],
) -> ArticleRead:
    article = await get_article_by_slug(session, slug)
    await log_action(session, ActionEventType.view_article, user=user, guest=guest, target_type="article", target_id=article.id)
    await session.commit()
    return article


@router.patch("/{slug}", response_model=ArticleRead)
async def update(slug: str, payload: ArticleUpdate, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> ArticleRead:
    return await update_article(session, slug, payload, user)


@router.post("/{slug}/vote", response_model=ArticleRead)
async def vote(
    slug: str,
    payload: VoteRequest,
    session: DbSession,
    user: Annotated[User | None, Depends(get_optional_user)],
    request: Request,
    response: Response,
) -> ArticleRead:
    article = await get_article_by_slug(session, slug)
    if user is None:
        guest = await ensure_guest_session(session, request, response)
        await log_action(session, ActionEventType.vote_attempt_blocked, guest=guest, target_type="article", target_id=article.id)
        await session.commit()
        raise ApiError(401, "AUTH_REQUIRED", "Create an account to vote and build reputation.")
    return await vote_article(session, slug, payload.value, user)

