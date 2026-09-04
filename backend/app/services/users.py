from datetime import datetime, timezone

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag, User
from app.models.enums import UserRole, UserStatus


RESEARCH_TERMS = ("research", "researcher", "phd", "doctoral", "professor", "scientist", "laboratory")


def _researcher_filter():
    checks = []
    for term in RESEARCH_TERMS:
        pattern = f"%{term}%"
        checks.extend(
            (
                User.current_role.ilike(pattern),
                User.bio.ilike(pattern),
                User.company_or_institution.ilike(pattern),
                User.degree_level.ilike(pattern),
            )
        )
    return or_(*checks)


def _featured_score():
    profile_links = or_(
        User.github_url.is_not(None),
        User.linkedin_url.is_not(None),
        User.website_url.is_not(None),
        User.youtube_url.is_not(None),
    )
    return (
        User.reputation_score
        + case((User.is_verified.is_(True), 75), else_=0)
        + case((User.role == UserRole.verified_ufazian, 35), else_=0)
        + case((User.role == UserRole.admin, 20), else_=0)
        + case((User.current_role.is_not(None), 24), else_=0)
        + case((User.company_or_institution.is_not(None), 18), else_=0)
        + case((User.bio.is_not(None), 10), else_=0)
        + case((User.avatar_url.is_not(None), 8), else_=0)
        + case((profile_links, 6), else_=0)
    )


async def leaderboard(
    session: AsyncSession,
    limit: int,
    offset: int,
    q: str | None = None,
    group: str = "all",
    faculty: str | None = None,
    sort: str = "featured",
) -> tuple[list[User], int]:
    stmt = select(User)
    count_stmt = select(func.count()).select_from(User)

    filters = [User.status != UserStatus.banned]
    if q:
        pattern = f"%{q.strip()}%"
        filters.append(
            or_(
                User.name.ilike(pattern),
                User.username.ilike(pattern),
                User.faculty.ilike(pattern),
                User.bio.ilike(pattern),
                User.current_role.ilike(pattern),
                User.company_or_institution.ilike(pattern),
            )
        )
    if faculty:
        filters.append(User.faculty.ilike(faculty.strip()))

    current_year = datetime.now(timezone.utc).year
    if group == "verified":
        filters.append(or_(User.is_verified.is_(True), User.role.in_([UserRole.verified_ufazian, UserRole.admin])))
    elif group == "alumni":
        filters.append(
            or_(
                User.degree_level.ilike("%alumni%"),
                and_(User.graduation_year.is_not(None), User.graduation_year <= current_year),
            )
        )
    elif group == "students":
        filters.append(
            and_(
                or_(User.degree_level.is_(None), ~User.degree_level.ilike("%alumni%")),
                or_(User.graduation_year.is_(None), User.graduation_year > current_year),
            )
        )
    elif group == "researchers":
        filters.append(_researcher_filter())

    stmt = stmt.where(*filters)
    count_stmt = count_stmt.where(*filters)

    if sort == "reputation":
        stmt = stmt.order_by(User.reputation_score.desc(), User.created_at.asc())
    elif sort == "newest":
        stmt = stmt.order_by(User.created_at.desc())
    elif sort == "name":
        stmt = stmt.order_by(User.name.asc(), User.username.asc())
    else:
        stmt = stmt.order_by(_featured_score().desc(), User.reputation_score.desc(), User.created_at.asc())

    stmt = stmt.limit(limit).offset(offset)
    return list((await session.scalars(stmt)).all()), int(await session.scalar(count_stmt) or 0)


async def top_tags(session: AsyncSession, limit: int) -> list[Tag]:
    return list((await session.scalars(select(Tag).order_by(Tag.name.asc()).limit(limit))).all())
