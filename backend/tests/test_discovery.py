import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_session
from app.main import create_app


@pytest.fixture()
async def client():
    previous = settings.admin_emails
    settings.admin_emails = "admin@ufaz.az"
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
    settings.admin_emails = previous


async def _register(client: AsyncClient, email: str, username: str, name: str) -> tuple[str, dict]:
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": "localpass123", "name": name},
    )
    assert response.status_code == 201
    return response.json()["access_token"], response.json()["user"]


async def test_people_research_filter_and_featured_sort(client: AsyncClient) -> None:
    admin_token, admin = await _register(client, "admin@ufaz.az", "hubadmin", "Hub Admin")
    researcher_token, researcher = await _register(client, "nigar@ufaz.az", "nigar", "Nigar Researcher")
    await _register(client, "plain@ufaz.az", "plain", "Plain Student")

    profile_update = await client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {researcher_token}"},
        json={"current_role": "Master's Researcher", "company_or_institution": "Sorbonne University", "bio": "Working on computer vision research."},
    )
    assert profile_update.status_code == 200

    verify = await client.patch(
        f"/api/v1/admin/users/{researcher['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "verified_ufazian", "is_verified": True, "reason": "Verified researcher"},
    )
    assert verify.status_code == 200

    researchers = await client.get("/api/v1/people?group=researchers&sort=featured")
    assert researchers.status_code == 200
    usernames = [item["username"] for item in researchers.json()["items"]]
    assert "nigar" in usernames
    assert "plain" not in usernames

    featured = await client.get("/api/v1/people?sort=featured")
    assert featured.status_code == 200
    featured_usernames = [item["username"] for item in featured.json()["items"]]
    assert featured_usernames.index("nigar") < featured_usernames.index("plain")

    me = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert me.status_code == 200
    assert me.json()["id"] == admin["id"]
    assert me.json()["role"] == "admin"


async def test_resource_and_article_search_include_tags_and_authors(client: AsyncClient) -> None:
    admin_token, _ = await _register(client, "admin@ufaz.az", "hubadmin", "Hub Admin")

    resource = await client.post(
        "/api/v1/resources",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Graph learning reading list",
            "description": "A compact reading list for graph learning experiments and reproducible project work.",
            "url": "https://example.com/graph-learning.pdf",
            "type": "docs",
            "category": "Research",
            "difficulty": "intermediate",
            "tags": ["research", "graph-neural-networks"],
        },
    )
    assert resource.status_code == 201

    by_tag = await client.get("/api/v1/resources?q=graph-neural-networks")
    assert by_tag.status_code == 200
    assert any(item["id"] == resource.json()["id"] for item in by_tag.json()["items"])

    by_author = await client.get("/api/v1/resources?q=hubadmin")
    assert by_author.status_code == 200
    assert any(item["id"] == resource.json()["id"] for item in by_author.json()["items"])

    article = await client.post(
        "/api/v1/articles",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "A small reproducibility study",
            "content": "## Abstract\n\nWe reproduced a baseline and documented the experiment setup.",
            "status": "published",
            "tags": ["research", "reproducibility"],
        },
    )
    assert article.status_code == 201

    article_search = await client.get("/api/v1/articles?q=reproducibility")
    assert article_search.status_code == 200
    assert any(item["id"] == article.json()["id"] for item in article_search.json()["items"])
