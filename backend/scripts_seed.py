import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models import Article, Collection, Resource, User
from app.schemas.resource import ResourceCreate
from app.schemas.article import ArticleCreate
from app.schemas.collection import CollectionCreate
from app.schemas.user import UserCreate
from app.services.auth import register_user
from app.services.articles import create_article
from app.services.collections import create_collection
from app.services.resources import create_resource


async def main() -> None:
    async with AsyncSessionLocal() as session:
        user = await session.scalar(select(User).where(User.email == "leyla.mammadova@ufaz.az"))
        if user is None:
            registered = await register_user(
                session,
                UserCreate(
                    email="leyla.mammadova@ufaz.az",
                    username="leyla",
                    password="localpass123",
                    name="Leyla Mammadova",
                    faculty="Computer Science",
                ),
                None,
            )
            user = await session.get(User, registered.user.id)
            print("created user leyla.mammadova@ufaz.az")
        else:
            print("user already exists")
        if user is None:
            raise RuntimeError("Seed user could not be loaded.")

        samples = [
            ResourceCreate(
                title="Python for Data Analysis notebooks",
                description="A practical notebook set for cleaning CSVs, plotting distributions, and preparing UFAZ statistics lab work.",
                url="https://wesmckinney.com/book/",
                type="book",
                category="Data Science",
                difficulty="beginner",
                use_case="Statistics lab and project cleanup",
                time_commitment="Multi-day reference",
                prerequisites="Basic Python syntax and comfort with notebooks.",
                best_part="The pandas chapters are the most useful when coursework moves from toy data to real CSV files.",
                warning="Use the newest pandas docs when an example uses older syntax.",
                student_note="I kept this open while cleaning messy lab files because it explains the why, not only the command.",
                tags=["python", "pandas", "statistics"],
            ),
            ResourceCreate(
                title="CS50 SQL notes for database week",
                description="A clean companion for relational modeling, joins, indexes, and the parts of SQL that usually show up in project work.",
                url="https://cs50.harvard.edu/sql/",
                type="course",
                category="Databases",
                difficulty="intermediate",
                use_case="Before database week or backend projects",
                time_commitment="1 to 2 hours",
                prerequisites="Know basic tables, rows, and simple SELECT queries.",
                best_part="The schema design and joins sections map well to UFAZ project work.",
                warning="Do not try to finish everything at once. Use it as a targeted reference.",
                student_note="This is strongest when paired with your own small PostgreSQL schema.",
                tags=["sql", "postgresql", "backend"],
            ),
        ]
        created_resources = []
        for item in samples:
            existing_resource = await session.scalar(select(Resource).where(Resource.title == item.title))
            if existing_resource is None:
                existing_resource = await create_resource(session, item, user)
                print(f"created resource: {item.title}")
            else:
                print(f"resource already exists: {item.title}")
            created_resources.append(existing_resource)

        article_title = "How to prepare for a UFAZ data internship"
        if await session.scalar(select(Article).where(Article.title == article_title)) is None:
            await create_article(
                session,
                ArticleCreate(
                    title=article_title,
                    content=(
                        "# How to prepare for a UFAZ data internship\n\n"
                        "Start with one clean project, one SQL-heavy analysis, and one notebook that explains every assumption. "
                        "Recruiters usually care less about the model name and more about whether your work can be read, rerun, and defended."
                    ),
                    status="published",
                    tags=["internships", "data science", "career"],
                ),
                user,
            )
            print(f"created article: {article_title}")
        else:
            print(f"article already exists: {article_title}")

        collection_title = "First semester data science path"
        if await session.scalar(select(Collection).where(Collection.title == collection_title)) is None:
            await create_collection(
                session,
                CollectionCreate(
                    title=collection_title,
                    description="A short sequence for students who want to move from Python basics into SQL-backed project work.",
                    resource_ids=[resource.id for resource in created_resources],
                    tags=["data science", "roadmap"],
                ),
                user,
            )
            print(f"created collection: {collection_title}")
        else:
            print(f"collection already exists: {collection_title}")


if __name__ == "__main__":
    asyncio.run(main())
