from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag
from app.services.slug import slugify


async def resolve_tags(session: AsyncSession, names: list[str]) -> list[Tag]:
    clean_names = []
    for name in names:
        stripped = name.strip()
        if stripped and stripped.lower() not in [item.lower() for item in clean_names]:
            clean_names.append(stripped)
    tags: list[Tag] = []
    for name in clean_names:
        slug = slugify(name)
        existing = await session.scalar(select(Tag).where(Tag.slug == slug))
        if existing is None:
            existing = Tag(name=name, slug=slug)
            session.add(existing)
            await session.flush()
        tags.append(existing)
    return tags

