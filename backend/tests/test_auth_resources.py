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
    # Register admin to approve
    admin_reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "admin@ufaz.az", "username": "adminuser", "password": "localpass123", "name": "Admin User"},
    )
    admin_token = admin_reg.json()["access_token"]
    # Change role to admin directly via DB/mock or register regular user
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

    # Before approval, items are pending and hidden from public search
    search_pre = await client.get("/api/v1/search?q=Erasmus")
    assert search_pre.status_code == 200
    assert len(search_pre.json()) == 0


async def test_refresh_token_profile_socials_and_avatar(client: AsyncClient) -> None:
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
        json={
            "bio": "Computer science student collecting useful data resources.",
            "github_url": "https://github.com/nigarkarimova",
            "linkedin_url": "https://linkedin.com/in/nigarkarimova",
            "telegram_url": "https://t.me/nigar",
        },
    )
    assert profile.status_code == 200
    assert profile.json()["github_url"] == "https://github.com/nigarkarimova"
    assert profile.json()["linkedin_url"] == "https://linkedin.com/in/nigarkarimova"

    # Avatar upload
    avatar_upload = await client.post(
        "/api/v1/users/me/avatar",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("avatar.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRfakeimagebytes", "image/png")},
    )
    assert avatar_upload.status_code == 200
    assert avatar_upload.json()["avatar_url"] is not None

    # Avatar fetch
    avatar_get = await client.get("/api/v1/users/nigar/avatar")
    assert avatar_get.status_code == 200
    assert avatar_get.headers["content-type"] == "image/png"
    assert avatar_get.content == b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRfakeimagebytes"

    # Avatar delete
    avatar_del = await client.delete("/api/v1/users/me/avatar", headers={"Authorization": f"Bearer {token}"})
    assert avatar_del.status_code == 200
    assert avatar_del.json()["avatar_url"] is None


async def test_author_can_delete_own_content(client: AsyncClient) -> None:
    register = await client.post(
        "/api/v1/auth/register",
        json={"email": "rashad@ufaz.az", "username": "rashad", "password": "localpass123", "name": "Rashad Aliyev"},
    )
    token = register.json()["access_token"]

    res = await client.post(
        "/api/v1/resources",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Temp resource to delete",
            "description": "Will be deleted by author right away.",
            "url": "https://example.com/temp",
            "type": "website",
            "category": "Test",
            "difficulty": "beginner",
            "tags": ["test"],
        },
    )
    res_id = res.json()["id"]

    art = await client.post(
        "/api/v1/articles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Temp article to delete",
            "content": "Will be deleted by author right away for testing delete functionality.",
            "status": "published",
            "tags": ["test"],
        },
    )
    art_slug = art.json()["slug"]

    col = await client.post(
        "/api/v1/collections",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Temp collection to delete",
            "description": "Will be deleted by author right away.",
            "resource_ids": [res_id],
            "tags": ["test"],
        },
    )
    col_id = col.json()["id"]

    # Delete resource
    del_res = await client.delete(f"/api/v1/resources/{res_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 204

    # Delete article
    del_art = await client.delete(f"/api/v1/articles/{art_slug}", headers={"Authorization": f"Bearer {token}"})
    assert del_art.status_code == 204

    # Delete collection
    del_col = await client.delete(f"/api/v1/collections/{col_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_col.status_code == 204


async def test_upload_then_publish_resource_link(client: AsyncClient) -> None:
    register = await client.post(
        "/api/v1/auth/register",
        json={"email": "samir@ufaz.az", "username": "samir", "password": "localpass123", "name": "Samir Hasanov"},
    )
    token = register.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    upload = await client.post(
        "/api/v1/resources/upload",
        headers=headers,
        files={"file": ("week-4.md", b"## Week 4\n\nUseful revision notes.", "text/markdown")},
    )
    assert upload.status_code == 201
    uploaded_url = upload.json()["url"]
    assert uploaded_url.startswith("http://test/uploads/resources/")

    created = await client.post(
        "/api/v1/resources",
        headers=headers,
        json={
            "title": "Week 4 notes",
            "description": "## Week 4\n\nUseful revision notes shared as Markdown.",
            "url": uploaded_url,
            "type": "docs",
            "category": "General",
            "difficulty": "beginner",
            "tags": ["notes"],
        },
    )
    assert created.status_code == 201
    assert created.json()["url"] == uploaded_url
    assert created.json()["description"].startswith("## Week 4")
