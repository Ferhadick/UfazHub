import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import get_session
from app.main import create_app


@pytest.fixture()
async def client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async def override_session():
        async with Session() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_session] = override_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as test_client:
        yield test_client


async def test_register_and_create_resource(client: AsyncClient) -> None:
    register = await client.post(
        "/api/v1/auth/register",
        json={"email": "murad@ufaz.az", "username": "murad", "password": "localpass123", "name": "Murad Aliyev"},
    )
    assert register.status_code == 201
    token = register.json()["access_token"]

    created = await client.post(
        "/api/v1/resources",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Linear Algebra visual guide",
            "description": "A resource for matrices, projections, eigenvectors, and fast revision before the DS semester exam.",
            "url": "https://www.3blue1brown.com/topics/linear-algebra",
            "type": "video",
            "category": "Mathematics",
            "difficulty": "beginner",
            "tags": ["math", "linear algebra"],
        },
    )
    assert created.status_code == 201
    assert created.json()["author"]["username"] == "murad"


async def test_guest_vote_is_blocked_and_tracked(client: AsyncClient) -> None:
    register = await client.post(
        "/api/v1/auth/register",
        json={"email": "leyla@ufaz.az", "username": "leyla", "password": "localpass123", "name": "Leyla Mammadova"},
    )
    token = register.json()["access_token"]
    created = await client.post(
        "/api/v1/resources",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "PostgreSQL indexing notes",
            "description": "Practical notes on B-tree and GIN indexes for backend projects at UFAZ.",
            "url": "https://www.postgresql.org/docs/current/indexes.html",
            "type": "docs",
            "category": "Backend",
            "difficulty": "intermediate",
            "tags": ["postgresql"],
        },
    )
    resource_id = created.json()["id"]
    guest = await client.post("/api/v1/auth/guest")
    assert guest.status_code == 200

    blocked = await client.post(f"/api/v1/resources/{resource_id}/vote", json={"value": 1})
    assert blocked.status_code == 401
    assert blocked.json()["code"] == "AUTH_REQUIRED"


async def test_create_article_collection_and_unified_search(client: AsyncClient) -> None:
    register = await client.post(
        "/api/v1/auth/register",
        json={"email": "amina@ufaz.az", "username": "amina", "password": "localpass123", "name": "Amina Huseynli"},
    )
    token = register.json()["access_token"]
    resource = await client.post(
        "/api/v1/resources",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Erasmus preparation checklist",
            "description": "A practical checklist for documents, deadlines, interviews, and course matching before Erasmus applications.",
            "url": "https://example.com/erasmus-checklist",
            "type": "website",
            "category": "Erasmus",
            "difficulty": "beginner",
            "tags": ["erasmus"],
        },
    )
    resource_id = resource.json()["id"]
    article = await client.post(
        "/api/v1/articles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "How I planned Erasmus from UFAZ",
            "content": "# Erasmus plan\n\nThis writeup covers timelines, faculty paperwork, learning agreements, and interview preparation in detail.",
            "status": "published",
            "tags": ["erasmus", "mobility"],
        },
    )
    assert article.status_code == 201
    assert article.json()["slug"] == "how-i-planned-erasmus-from-ufaz"

    collection = await client.post(
        "/api/v1/collections",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Erasmus first steps",
            "description": "A compact path for students starting their Erasmus preparation from zero.",
            "resource_ids": [resource_id],
            "tags": ["erasmus"],
        },
    )
    assert collection.status_code == 201
    assert collection.json()["items"][0]["position"] == 1

    search = await client.get("/api/v1/search?q=Erasmus")
    assert search.status_code == 200
    kinds = {item["kind"] for item in search.json()}
    assert {"website", "article", "collection"}.issubset(kinds)


async def test_refresh_token_and_profile(client: AsyncClient) -> None:
    register = await client.post(
        "/api/v1/auth/register",
        json={"email": "nigar@ufaz.az", "username": "nigar", "password": "localpass123", "name": "Nigar Karimova"},
    )
    assert register.status_code == 201
    assert "ufaz_refresh" in client.cookies

    refreshed = await client.post("/api/v1/auth/refresh")
    assert refreshed.status_code == 200
    token = refreshed.json()["access_token"]

    profile = await client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"bio": "Computer science student collecting useful data resources."},
    )
    assert profile.status_code == 200
    assert profile.json()["bio"] == "Computer science student collecting useful data resources."
