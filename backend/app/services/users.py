from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag, User


async def leaderboard(session: AsyncSession, limit: int, offset: int, q: str | None = None) -> tuple[list[User], int]:
    stmt = select(User)
    count_stmt = select(func.count()).select_from(User)
    if q:
        pattern = f"%{q.strip()}%"
        search = or_(User.name.ilike(pattern), User.username.ilike(pattern), User.faculty.ilike(pattern), User.bio.ilike(pattern))
        stmt = stmt.where(search)
        count_stmt = count_stmt.where(search)
    stmt = stmt.order_by(User.reputation_score.desc(), User.created_at.asc()).limit(limit).offset(offset)
    return list((await session.scalars(stmt)).all()), int(await session.scalar(count_stmt) or 0)


async def top_tags(session: AsyncSession, limit: int) -> list[Tag]:
    return list((await session.scalars(select(Tag).order_by(Tag.name.asc()).limit(limit))).all())

