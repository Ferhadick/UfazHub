from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.models import ActionEventType, Article, ArticleStatus, Tag, User, Vote
from app.schemas.article import ArticleCreate, ArticleUpdate
from app.services.access import assert_author_or_admin, assert_user_can_write
from app.services.events import log_action
from app.services.slug import slugify
from app.services.tags import resolve_tags


def _reading_time(content: str) -> int:
    words = len(content.split())
    return max(1, round(words / 220))


def _excerpt(title: str, content: str, provided: str | None) -> str:
    if provided:
        return provided
    compact = " ".join(content.replace("#", "").split())
    return compact[:220] or title


async def _unique_slug(session: AsyncSession, title: str, current_slug: str | None = None) -> str:
    base = slugify(title)
    slug = base
    index = 2
    while True:
        existing = await session.scalar(select(Article).where(Article.slug == slug))
        if existing is None or existing.slug == current_slug:
            return slug
        slug = f"{base}-{index}"
        index += 1


async def create_article(session: AsyncSession, payload: ArticleCreate, user: User) -> Article:
    await assert_user_can_write(session, user)
    is_admin = user.role.value == "admin"
    is_pending = (payload.status == ArticleStatus.published) and (not is_admin)
    published_at = datetime.now(timezone.utc) if payload.status == ArticleStatus.published else None
    article = Article(
        author_id=user.id,
        title=payload.title,
        slug=await _unique_slug(session, payload.title),
        content=payload.content,
        excerpt=_excerpt(payload.title, payload.content, payload.excerpt),
        cover_image_url=str(payload.cover_image_url) if payload.cover_image_url else None,
        reading_time=_reading_time(payload.content),
        status=payload.status,
        published_at=published_at,
        is_hidden=is_pending,
        is_pending_review=is_pending,
        tags=await resolve_tags(session, payload.tags),
    )
    session.add(article)
    user.reputation_score += 10 if payload.status == ArticleStatus.published else 2
    await session.flush()
    if payload.status == ArticleStatus.published:
        await log_action(session, ActionEventType.article_published, user=user, target_type="article", target_id=article.id)
    await session.commit()
    return await get_article_by_slug(session, article.slug, include_drafts=True, include_hidden=True)


async def list_articles(
    session: AsyncSession,
    limit: int,
    offset: int,
    include_drafts: bool = False,
    include_hidden: bool = False,
    q: str | None = None,
) -> tuple[list[Article], int]:
    stmt = select(Article).options(selectinload(Article.author), selectinload(Article.tags))
    count_stmt = select(func.count()).select_from(Article)
    if not include_drafts:
        stmt = stmt.where(Article.status == ArticleStatus.published)
        count_stmt = count_stmt.where(Article.status == ArticleStatus.published)
    if not include_hidden:
        stmt = stmt.where(Article.is_hidden.is_(False))
        count_stmt = count_stmt.where(Article.is_hidden.is_(False))
    if q:
        pattern = f"%{q.strip()}%"
        search = or_(
            Article.title.ilike(pattern),
            Article.excerpt.ilike(pattern),
            Article.content.ilike(pattern),
            Article.tags.any(Tag.name.ilike(pattern)),
            Article.author.has(or_(User.name.ilike(pattern), User.username.ilike(pattern))),
        )
        stmt = stmt.where(search)
        count_stmt = count_stmt.where(search)
    stmt = stmt.order_by(Article.created_at.desc()).limit(limit).offset(offset)
    return list((await session.scalars(stmt)).all()), int(await session.scalar(count_stmt) or 0)


async def get_article_by_id(session: AsyncSession, article_id: UUID, include_hidden: bool = False, include_drafts: bool = False) -> Article:
    stmt = select(Article).where(Article.id == article_id).options(selectinload(Article.author), selectinload(Article.tags))
    if not include_drafts:
        stmt = stmt.where(Article.status == ArticleStatus.published)
    if not include_hidden:
        stmt = stmt.where(Article.is_hidden.is_(False))
    article = await session.scalar(stmt)
    if article is None:
        raise ApiError(404, "ARTICLE_NOT_FOUND", "Article was not found.")
    return article


async def get_article_by_slug(session: AsyncSession, slug: str, include_drafts: bool = False, include_hidden: bool = False) -> Article:
    stmt = select(Article).where(Article.slug == slug).options(selectinload(Article.author), selectinload(Article.tags))
    if not include_drafts:
        stmt = stmt.where(Article.status == ArticleStatus.published)
    if not include_hidden:
        stmt = stmt.where(Article.is_hidden.is_(False))
    article = await session.scalar(stmt)
    if article is None:
        raise ApiError(404, "ARTICLE_NOT_FOUND", "Article was not found.")
    return article


async def update_article(
    session: AsyncSession, slug: str, payload: ArticleUpdate, user: User, *, enforce_write_guard: bool = True
) -> Article:
    if enforce_write_guard:
        await assert_user_can_write(session, user)
    article = await get_article_by_slug(session, slug, include_drafts=True, include_hidden=True)
    assert_author_or_admin(article.author_id, user, "edit this article")
    old_status = article.status
    data = payload.model_dump(exclude_unset=True)
    tag_names = data.pop("tags", None)
    if "cover_image_url" in data and data["cover_image_url"] is not None:
        data["cover_image_url"] = str(data["cover_image_url"])
    for key, value in data.items():
        setattr(article, key, value)
    if payload.title is not None:
        article.slug = await _unique_slug(session, payload.title, current_slug=slug)
    if payload.content is not None:
        article.reading_time = _reading_time(payload.content)
        article.excerpt = _excerpt(article.title, payload.content, payload.excerpt)
    if article.status == ArticleStatus.published and old_status != ArticleStatus.published:
        article.published_at = datetime.now(timezone.utc)
        user.reputation_score += 8
        await log_action(session, ActionEventType.article_published, user=user, target_type="article", target_id=article.id)
    if tag_names is not None:
        article.tags = await resolve_tags(session, tag_names)
    await session.commit()
    return await get_article_by_slug(session, article.slug, include_drafts=True, include_hidden=True)


async def vote_article(session: AsyncSession, slug: str, value: int, user: User) -> Article:
    await assert_user_can_write(session, user)
    article = await get_article_by_slug(session, slug)
    existing = await session.scalar(select(Vote).where(Vote.user_id == user.id, Vote.target_type == "article", Vote.target_id == article.id))
    old_value = existing.value if existing else 0
    if value == 0 and existing is not None:
        await session.delete(existing)
    elif existing is not None:
        existing.value = value
    elif value != 0:
        session.add(Vote(user_id=user.id, target_type="article", target_id=article.id, value=value))
    article.upvotes += (1 if value == 1 else 0) - (1 if old_value == 1 else 0)
    article.downvotes += (1 if value == -1 else 0) - (1 if old_value == -1 else 0)
    await log_action(session, ActionEventType.vote_cast, user=user, target_type="article", target_id=article.id, metadata={"value": value})
    await session.commit()
    return await get_article_by_slug(session, article.slug)


async def delete_article(session: AsyncSession, slug: str, user: User) -> None:
    await assert_user_can_write(session, user)
    article = await get_article_by_slug(session, slug, include_drafts=True, include_hidden=True)
    assert_author_or_admin(article.author_id, user, "delete this article")
    await session.delete(article)
    await session.commit()


async def approve_article(session: AsyncSession, article_id: UUID, actor: User) -> Article:
    article = await get_article_by_id(session, article_id, include_hidden=True, include_drafts=True)
    if not article.is_pending_review:
        raise ApiError(409, "NOT_PENDING", "This article is not pending review.")
    article.is_hidden = False
    article.is_pending_review = False
    await log_action(session, ActionEventType.admin_unhide, user=actor, target_type="article", target_id=article_id, metadata={"reason": "Approved from review queue"})
    await session.commit()
    return await get_article_by_id(session, article_id, include_drafts=True)


async def search_articles(session: AsyncSession, query: str, limit: int) -> list[Article]:
    pattern = f"%{query.strip()}%"
    stmt = (
        select(Article)
        .where(
            Article.status == ArticleStatus.published,
            Article.is_hidden.is_(False),
            or_(Article.title.ilike(pattern), Article.excerpt.ilike(pattern), Article.content.ilike(pattern), Article.tags.any(Tag.name.ilike(pattern)), Article.author.has(or_(User.name.ilike(pattern), User.username.ilike(pattern)))),
        )
        .options(selectinload(Article.author), selectinload(Article.tags))
        .order_by(Article.created_at.desc())
        .limit(limit)
    )
    return list((await session.scalars(stmt)).all())


