from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.models import ActionEventType, Resource, User, Vote
from app.schemas.resource import ResourceCreate, ResourceUpdate
from app.services.access import assert_author_or_admin, assert_user_can_write
from app.services.events import log_action
from app.services.tags import resolve_tags


async def create_resource(session: AsyncSession, payload: ResourceCreate, user: User) -> Resource:
    await assert_user_can_write(session, user)
    is_admin = user.role.value == "admin"
    resource = Resource(
        author_id=user.id,
        title=payload.title,
        description=payload.description,
        url=str(payload.url),
        type=payload.type,
        category=payload.category,
        difficulty=payload.difficulty,
        use_case=payload.use_case,
        time_commitment=payload.time_commitment,
        prerequisites=payload.prerequisites,
        best_part=payload.best_part,
        warning=payload.warning,
        student_note=payload.student_note,
        tags=await resolve_tags(session, payload.tags),
        is_hidden=not is_admin,
        is_pending_review=not is_admin,
    )
    session.add(resource)
    user.reputation_score += 5
    await session.flush()
    await log_action(session, ActionEventType.resource_created, user=user, target_type="resource", target_id=resource.id)
    await session.commit()
    return await get_resource(session, resource.id, include_hidden=True)


async def approve_resource(session: AsyncSession, resource_id: UUID, actor: User) -> Resource:
    resource = await get_resource(session, resource_id, include_hidden=True)
    if not resource.is_pending_review:
        raise ApiError(409, "NOT_PENDING", "This resource is not pending review.")
    resource.is_hidden = False
    resource.is_pending_review = False
    await log_action(session, ActionEventType.admin_unhide, user=actor, target_type="resource", target_id=resource_id, metadata={"reason": "Approved from review queue"})
    await session.commit()
    return await get_resource(session, resource_id)


async def list_resources(
    session: AsyncSession,
    limit: int,
    offset: int,
    resource_type: str | None = None,
    include_hidden: bool = False,
) -> tuple[list[Resource], int]:
    stmt = select(Resource).options(selectinload(Resource.author), selectinload(Resource.tags))
    count_stmt = select(func.count()).select_from(Resource)
    if not include_hidden:
        stmt = stmt.where(Resource.is_hidden.is_(False))
        count_stmt = count_stmt.where(Resource.is_hidden.is_(False))
    if resource_type:
        stmt = stmt.where(Resource.type == resource_type)
        count_stmt = count_stmt.where(Resource.type == resource_type)
    stmt = stmt.order_by(Resource.created_at.desc()).limit(limit).offset(offset)
    return list((await session.scalars(stmt)).all()), int(await session.scalar(count_stmt) or 0)


async def get_resource(session: AsyncSession, resource_id: UUID, include_hidden: bool = False) -> Resource:
    stmt = select(Resource).where(Resource.id == resource_id).options(selectinload(Resource.author), selectinload(Resource.tags))
    if not include_hidden:
        stmt = stmt.where(Resource.is_hidden.is_(False))
    resource = await session.scalar(stmt)
    if resource is None:
        raise ApiError(404, "RESOURCE_NOT_FOUND", "Resource was not found.")
    return resource


async def update_resource(
    session: AsyncSession, resource_id: UUID, payload: ResourceUpdate, user: User, *, enforce_write_guard: bool = True
) -> Resource:
    if enforce_write_guard:
        await assert_user_can_write(session, user)
    resource = await get_resource(session, resource_id, include_hidden=True)
    assert_author_or_admin(resource.author_id, user, "edit this resource")
    data = payload.model_dump(exclude_unset=True)
    tag_names = data.pop("tags", None)
    if "url" in data and data["url"] is not None:
        data["url"] = str(data["url"])
    for key, value in data.items():
        setattr(resource, key, value)
    if tag_names is not None:
        resource.tags = await resolve_tags(session, tag_names)
    await session.commit()
    return await get_resource(session, resource_id, include_hidden=True)


async def delete_resource(session: AsyncSession, resource_id: UUID, user: User) -> None:
    await assert_user_can_write(session, user)
    resource = await get_resource(session, resource_id, include_hidden=True)
    assert_author_or_admin(resource.author_id, user, "delete this resource")
    await session.delete(resource)
    await session.commit()


async def vote_resource(session: AsyncSession, resource_id: UUID, value: int, user: User) -> Resource:
    await assert_user_can_write(session, user)
    resource = await get_resource(session, resource_id)
    existing = await session.scalar(
        select(Vote).where(Vote.user_id == user.id, Vote.target_type == "resource", Vote.target_id == resource_id)
    )
    old_value = existing.value if existing else 0
    if value == 0 and existing is not None:
        await session.delete(existing)
    elif existing is not None:
        existing.value = value
    elif value != 0:
        session.add(Vote(user_id=user.id, target_type="resource", target_id=resource_id, value=value))
    resource.upvotes += (1 if value == 1 else 0) - (1 if old_value == 1 else 0)
    resource.downvotes += (1 if value == -1 else 0) - (1 if old_value == -1 else 0)
    await log_action(session, ActionEventType.vote_cast, user=user, target_type="resource", target_id=resource_id, metadata={"value": value})
    await session.commit()
    return await get_resource(session, resource_id)


async def search_resources(session: AsyncSession, query: str, limit: int, offset: int) -> tuple[list[Resource], int]:
    pattern = f"%{query.strip()}%"
    searchable_fields = (
        Resource.title.ilike(pattern),
        Resource.description.ilike(pattern),
        Resource.category.ilike(pattern),
        Resource.use_case.ilike(pattern),
        Resource.prerequisites.ilike(pattern),
        Resource.best_part.ilike(pattern),
        Resource.warning.ilike(pattern),
        Resource.student_note.ilike(pattern),
    )
    stmt = (
        select(Resource)
        .where(Resource.is_hidden.is_(False), or_(*searchable_fields))
        .options(selectinload(Resource.author), selectinload(Resource.tags))
        .order_by(Resource.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    count_stmt = select(func.count()).select_from(Resource).where(Resource.is_hidden.is_(False), or_(*searchable_fields))
    return list((await session.scalars(stmt)).all()), int(await session.scalar(count_stmt) or 0)
