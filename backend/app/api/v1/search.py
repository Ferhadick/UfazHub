from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, get_optional_guest, get_optional_user
from app.models import ActionEventType, GuestSession, User
from app.schemas.feed import FeedItem
from app.services.articles import search_articles
from app.services.collections import search_collections
from app.services.events import log_action
from app.services.resources import search_resources

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=list[FeedItem])
async def search(
    session: DbSession,
    user: Annotated[User | None, Depends(get_optional_user)],
    guest: Annotated[GuestSession | None, Depends(get_optional_guest)],
    q: Annotated[str, Query(min_length=1, max_length=120)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[FeedItem]:
    resources, _ = await search_resources(session, q, limit, offset)
    articles = await search_articles(session, q, limit)
    collections = await search_collections(session, q, limit)
    await log_action(session, ActionEventType.search_query, user=user, guest=guest, metadata={"query": q})
    await session.commit()
    items: list[FeedItem] = []
    for resource in resources:
        items.append(
            FeedItem(
                id=str(resource.id),
                kind=resource.type.value,
                title=resource.title,
                description=resource.description,
                href=f"/resources/{resource.id}",
                author_name=resource.author.name,
                author_username=resource.author.username,
                tags=[tag.name for tag in resource.tags],
                score=resource.upvotes - resource.downvotes,
                meta=resource.difficulty.value,
                created_at=resource.created_at,
            )
        )
    for article in articles:
        items.append(
            FeedItem(
                id=article.slug,
                kind="article",
                title=article.title,
                description=article.excerpt,
                href=f"/articles/{article.slug}",
                author_name=article.author.name,
                author_username=article.author.username,
                tags=[tag.name for tag in article.tags],
                score=article.upvotes - article.downvotes,
                meta=f"{article.reading_time} min read",
                created_at=article.created_at,
            )
        )
    for collection in collections:
        items.append(
            FeedItem(
                id=str(collection.id),
                kind="collection",
                title=collection.title,
                description=collection.description,
                href=f"/collections/{collection.id}",
                author_name=collection.author.name,
                author_username=collection.author.username,
                tags=[tag.name for tag in collection.tags],
                score=collection.upvotes - collection.downvotes,
                meta=f"{len(collection.items)} resources",
                created_at=collection.created_at,
            )
        )
    return sorted(items, key=lambda item: item.created_at, reverse=True)[:limit]
