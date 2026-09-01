from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.schemas.feed import FeedItem
from app.services.articles import list_articles
from app.services.collections import list_collections
from app.services.resources import list_resources

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=list[FeedItem])
async def feed(session: DbSession, limit: Annotated[int, Query(ge=1, le=30)] = 12) -> list[FeedItem]:
    resources, _ = await list_resources(session, limit, 0)
    articles, _ = await list_articles(session, limit, 0)
    collections, _ = await list_collections(session, limit, 0)
    items: list[FeedItem] = []
    for resource in resources:
        items.append(
            FeedItem(
                id=str(resource.id),
                kind=resource.type.value,
                title=resource.title,
                description=resource.description,
                href=resource.url,
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
