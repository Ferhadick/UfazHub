import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_session
from app.main import create_app

RESOURCE_PAYLOAD = {
    "title": "Linear Algebra visual guide",
    "description": "A resource for matrices, projections, eigenvectors, and fast revision before the DS semester exam.",
    "url": "https://www.3blue1brown.com/topics/linear-algebra",
    "type": "video",
    "category": "Mathematics",
    "difficulty": "beginner",
    "tags": ["math"],
}


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


async def _register(client: AsyncClient, email: str, username: str) -> str:
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": "localpass123", "name": username.title()},
    )
    assert response.status_code == 201
    return response.json()["access_token"]


async def test_non_admin_cannot_access_admin(client: AsyncClient) -> None:
    token = await _register(client, "murad@ufaz.az", "murad")
    blocked = await client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert blocked.status_code == 403
    assert blocked.json()["code"] == "ADMIN_REQUIRED"


async def test_admin_can_hide_content_and_public_get_excludes_it(client: AsyncClient) -> None:
    user_token = await _register(client, "leyla@ufaz.az", "leyla")
    created = await client.post("/api/v1/resources", headers={"Authorization": f"Bearer {user_token}"}, json=RESOURCE_PAYLOAD)
    resource_id = created.json()["id"]
    admin_token = await _register(client, "admin@ufaz.az", "hubadmin")

    hidden = await client.post(
        f"/api/v1/admin/content/resource/{resource_id}/hide",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "Off-topic for the archive"},
    )
    assert hidden.status_code == 200
    assert hidden.json()["is_hidden"] is True

    public_list = await client.get("/api/v1/resources")
    assert all(item["id"] != resource_id for item in public_list.json()["items"])

    public_show = await client.get(f"/api/v1/resources/{resource_id}")
    assert public_show.status_code == 404

    search = await client.get("/api/v1/search?q=Linear")
    assert all(item["id"] != resource_id for item in search.json())


async def test_muted_user_cannot_create_resource(client: AsyncClient) -> None:
    user_token = await _register(client, "amina@ufaz.az", "amina")
    admin_token = await _register(client, "admin@ufaz.az", "hubadmin")
    me = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {user_token}"})
    muted = await client.post(
        f"/api/v1/admin/users/{me.json()['id']}/mute",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "Repeated low-quality submissions", "duration_minutes": 60},
    )
    assert muted.status_code == 200
    assert muted.json()["status"] == "muted"

    created = await client.post("/api/v1/resources", headers={"Authorization": f"Bearer {user_token}"}, json=RESOURCE_PAYLOAD)
    assert created.status_code == 403
    assert created.json()["code"] == "MUTED"


async def test_banned_user_cannot_login(client: AsyncClient) -> None:
    await _register(client, "nigar@ufaz.az", "nigar")
    admin_token = await _register(client, "admin@ufaz.az", "hubadmin")
    people = await client.get("/api/v1/people")
    nigar = next(item for item in people.json()["items"] if item["username"] == "nigar")
    banned = await client.post(
        f"/api/v1/admin/users/{nigar['id']}/ban",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "Spam account"},
    )
    assert banned.status_code == 200

    login = await client.post("/api/v1/auth/login", json={"email": "nigar@ufaz.az", "password": "localpass123"})
    assert login.status_code == 403
    assert login.json()["code"] == "ACCOUNT_BANNED"


async def test_admin_can_promote_another_user(client: AsyncClient) -> None:
    await _register(client, "farid@ufaz.az", "farid")
    admin_token = await _register(client, "admin@ufaz.az", "hubadmin")
    people = await client.get("/api/v1/people")
    farid = next(item for item in people.json()["items"] if item["username"] == "farid")
    promoted = await client.patch(
        f"/api/v1/admin/users/{farid['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "admin"},
    )
    assert promoted.status_code == 200
    assert promoted.json()["role"] == "admin"


async def test_last_admin_cannot_be_demoted(client: AsyncClient) -> None:
    admin_token = await _register(client, "admin@ufaz.az", "hubadmin")
    me = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {admin_token}"})
    demoted = await client.patch(
        f"/api/v1/admin/users/{me.json()['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "user"},
    )
    assert demoted.status_code == 403
    assert demoted.json()["code"] == "LAST_ADMIN"


async def test_admin_cannot_ban_self(client: AsyncClient) -> None:
    admin_token = await _register(client, "admin@ufaz.az", "hubadmin")
    second = await client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": "ops@ufaz.az", "username": "ops", "password": "localpass123", "name": "Ops Desk"},
    )
    assert second.status_code == 201
    me = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {admin_token}"})
    banned = await client.post(
        f"/api/v1/admin/users/{me.json()['id']}/ban",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "I would like to ban myself"},
    )
    assert banned.status_code == 403
    assert banned.json()["code"] == "SELF_ACTION_FORBIDDEN"


async def test_guest_blocked_events_appear_in_overview_and_activity(client: AsyncClient) -> None:
    user_token = await _register(client, "kamran@ufaz.az", "kamran")
    created = await client.post("/api/v1/resources", headers={"Authorization": f"Bearer {user_token}"}, json=RESOURCE_PAYLOAD)
    resource_id = created.json()["id"]
    guest = await client.post("/api/v1/auth/guest")
    assert guest.status_code == 200
    blocked = await client.post(f"/api/v1/resources/{resource_id}/vote", json={"value": 1})
    assert blocked.status_code == 401
    client.cookies.clear()

    admin_token = await _register(client, "admin@ufaz.az", "hubadmin")
    overview = await client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert overview.status_code == 200
    guest_events = overview.json()["recent_blocked_guest_actions"]
    assert guest_events
    assert guest_events[0]["event_type"] == "vote_attempt_blocked"

    activity = await client.get(
        "/api/v1/admin/events?event_type=vote_attempt_blocked",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert activity.status_code == 200
    assert activity.json()["total"] >= 1
    assert activity.json()["items"][0]["guest_session_id"] is not None
