from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag, User


async def leaderboard(session: AsyncSession, limit: int, offset: int) -> tuple[list[User], int]:
    stmt = select(User).order_by(User.reputation_score.desc(), User.created_at.asc()).limit(limit).offset(offset)
    count_stmt = select(func.count()).select_from(User)
    return list((await session.scalars(stmt)).all()), int(await session.scalar(count_stmt) or 0)


async def top_tags(session: AsyncSession, limit: int) -> list[Tag]:
    return list((await session.scalars(select(Tag).order_by(Tag.name.asc()).limit(limit))).all())

