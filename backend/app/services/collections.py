from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.models import ActionEventType, Collection, CollectionItem, Resource, User, Vote
from app.schemas.collection import CollectionCreate, CollectionUpdate
from app.services.access import assert_author_or_admin, assert_user_can_write
from app.services.events import log_action
from app.services.tags import resolve_tags


async def _build_items(session: AsyncSession, resource_ids: list[UUID]) -> list[CollectionItem]:
    if len(set(resource_ids)) != len(resource_ids):
        raise ApiError(422, "DUPLICATE_COLLECTION_RESOURCE", "A collection cannot include the same resource twice.")
    resources = list((await session.scalars(select(Resource).where(Resource.id.in_(resource_ids)))).all()) if resource_ids else []
    if len(resources) != len(resource_ids):
        raise ApiError(404, "COLLECTION_RESOURCE_NOT_FOUND", "One or more resources were not found.")
    return [CollectionItem(resource_id=resource_id, position=index + 1) for index, resource_id in enumerate(resource_ids)]


async def create_collection(session: AsyncSession, payload: CollectionCreate, user: User) -> Collection:
    await assert_user_can_write(session, user)
    collection = Collection(
        author_id=user.id,
        title=payload.title,
        description=payload.description,
        tags=await resolve_tags(session, payload.tags),
        items=await _build_items(session, payload.resource_ids),
    )
    session.add(collection)
    user.reputation_score += 8
    await session.flush()
    await log_action(session, ActionEventType.collection_created, user=user, target_type="collection", target_id=collection.id)
    await session.commit()
    return await get_collection(session, collection.id)


async def list_collections(session: AsyncSession, limit: int, offset: int, include_hidden: bool = False) -> tuple[list[Collection], int]:
    stmt = select(Collection).options(
        selectinload(Collection.author),
        selectinload(Collection.tags),
        selectinload(Collection.items).selectinload(CollectionItem.resource).selectinload(Resource.author),
        selectinload(Collection.items).selectinload(CollectionItem.resource).selectinload(Resource.tags),
    )
    count_stmt = select(func.count()).select_from(Collection)
    if not include_hidden:
        stmt = stmt.where(Collection.is_hidden.is_(False))
        count_stmt = count_stmt.where(Collection.is_hidden.is_(False))
    stmt = stmt.order_by(Collection.created_at.desc()).limit(limit).offset(offset)
    return list((await session.scalars(stmt)).all()), int(await session.scalar(count_stmt) or 0)


async def get_collection(session: AsyncSession, collection_id: UUID, include_hidden: bool = False) -> Collection:
    stmt = (
        select(Collection)
        .where(Collection.id == collection_id)
        .options(
            selectinload(Collection.author),
            selectinload(Collection.tags),
            selectinload(Collection.items).selectinload(CollectionItem.resource).selectinload(Resource.author),
            selectinload(Collection.items).selectinload(CollectionItem.resource).selectinload(Resource.tags),
        )
    )
    if not include_hidden:
        stmt = stmt.where(Collection.is_hidden.is_(False))
    collection = await session.scalar(stmt)
    if collection is None:
        raise ApiError(404, "COLLECTION_NOT_FOUND", "Collection was not found.")
    return collection


async def update_collection(
    session: AsyncSession, collection_id: UUID, payload: CollectionUpdate, user: User, *, enforce_write_guard: bool = True
) -> Collection:
    if enforce_write_guard:
        await assert_user_can_write(session, user)
    collection = await get_collection(session, collection_id, include_hidden=True)
    assert_author_or_admin(collection.author_id, user, "edit this collection")
    data = payload.model_dump(exclude_unset=True)
    tag_names = data.pop("tags", None)
    resource_ids = data.pop("resource_ids", None)
    for key, value in data.items():
        setattr(collection, key, value)
    if tag_names is not None:
        collection.tags = await resolve_tags(session, tag_names)
    if resource_ids is not None:
        collection.items = await _build_items(session, resource_ids)
    await session.commit()
    return await get_collection(session, collection_id, include_hidden=True)


async def vote_collection(session: AsyncSession, collection_id: UUID, value: int, user: User) -> Collection:
    await assert_user_can_write(session, user)
    collection = await get_collection(session, collection_id)
    existing = await session.scalar(select(Vote).where(Vote.user_id == user.id, Vote.target_type == "collection", Vote.target_id == collection.id))
    old_value = existing.value if existing else 0
    if value == 0 and existing is not None:
        await session.delete(existing)
    elif existing is not None:
        existing.value = value
    elif value != 0:
        session.add(Vote(user_id=user.id, target_type="collection", target_id=collection.id, value=value))
    collection.upvotes += (1 if value == 1 else 0) - (1 if old_value == 1 else 0)
    collection.downvotes += (1 if value == -1 else 0) - (1 if old_value == -1 else 0)
    await log_action(session, ActionEventType.vote_cast, user=user, target_type="collection", target_id=collection.id, metadata={"value": value})
    await session.commit()
    return await get_collection(session, collection.id)


async def search_collections(session: AsyncSession, query: str, limit: int) -> list[Collection]:
    pattern = f"%{query.strip()}%"
    stmt = (
        select(Collection)
        .where(Collection.is_hidden.is_(False), or_(Collection.title.ilike(pattern), Collection.description.ilike(pattern)))
        .options(selectinload(Collection.author), selectinload(Collection.tags), selectinload(Collection.items))
        .order_by(Collection.created_at.desc())
        .limit(limit)
    )
    return list((await session.scalars(stmt)).all())

