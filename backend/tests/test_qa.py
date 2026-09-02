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


async def test_qa_flow_and_permissions(client: AsyncClient) -> None:
    # 1. Register admin
    admin_reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "admin@ufaz.az", "username": "admin_ufaz", "password": "password123", "name": "UFAZ Admin"},
    )
    admin_token = admin_reg.json()["access_token"]
    assert admin_reg.json()["user"]["role"] == "admin"

    # 2. Register regular contributor
    contributor_reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "student@ufaz.az", "username": "student_ali", "password": "password123", "name": "Ali Student"},
    )
    contributor_token = contributor_reg.json()["access_token"]

    # 3. Register alumni/verified candidate
    alumni_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "alumni@ufaz.az",
            "username": "alumni_rashad",
            "password": "password123",
            "name": "Rashad Alumni",
            "graduation_year": 2022,
            "current_role": "ML Engineer",
            "company_or_institution": "Bolt",
        },
    )
    alumni_token = alumni_reg.json()["access_token"]
    alumni_id = alumni_reg.json()["user"]["id"]

    # 4. Student posts a question
    q_res = await client.post(
        "/api/v1/qa/questions",
        headers={"Authorization": f"Bearer {contributor_token}"},
        json={
            "title": "How to prepare for AILAB summer internship technical interview?",
            "body": "What kind of data structures and ML fundamentals are typically asked?",
            "topic_tag": "internships",
        },
    )
    assert q_res.status_code == 201
    question_id = q_res.json()["id"]
    assert q_res.json()["status"] == "open"
    assert q_res.json()["topic_tag"] == "internships"

    # 5. Regular unverified student tries to answer -> should be 403
    ans_forbidden = await client.post(
        f"/api/v1/qa/questions/{question_id}/answers",
        headers={"Authorization": f"Bearer {contributor_token}"},
        json={"body": "I think you just need Leetcode medium."},
    )
    assert ans_forbidden.status_code == 403
    assert ans_forbidden.json()["code"] == "VERIFIED_REQUIRED"

    # 6. Admin verifies the alumni
    verify_res = await client.patch(
        f"/api/v1/admin/users/{alumni_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "verified_ufazian", "is_verified": True, "reason": "Alumni graduation verified"},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True
    assert verify_res.json()["role"] == "verified_ufazian"

    # 7. Verified alumni answers the question
    ans_success = await client.post(
        f"/api/v1/qa/questions/{question_id}/answers",
        headers={"Authorization": f"Bearer {alumni_token}"},
        json={
            "body": "Focus on PyTorch basics, Linear Algebra matrix calculus, and Python algorithmic complexity. Review the AILAB roadmap collection on the Hub.",
            "linked_resources": [{"title": "AILAB Roadmap", "url": "/collections/ailab-roadmap"}],
        },
    )
    assert ans_success.status_code == 201
    thread = ans_success.json()
    assert thread["status"] == "answered"
    assert len(thread["answers"]) == 1
    answer_id = thread["answers"][0]["id"]
    assert thread["answers"][0]["author"]["is_verified"] is True

    # 8. Student marks answer as helpful / pinned
    pin_res = await client.post(
        f"/api/v1/qa/questions/{question_id}/pin-answer/{answer_id}",
        headers={"Authorization": f"Bearer {contributor_token}"},
    )
    assert pin_res.status_code == 200
    assert pin_res.json()["answers"][0]["is_pinned"] is True
    assert pin_res.json()["answers"][0]["is_helpful"] is True

    # 9. Upvote question & answer
    q_vote = await client.post(
        f"/api/v1/qa/questions/{question_id}/vote",
        headers={"Authorization": f"Bearer {alumni_token}"},
        json={"value": 1},
    )
    assert q_vote.status_code == 200
    assert q_vote.json()["upvotes"] == 1

    a_vote = await client.post(
        f"/api/v1/qa/answers/{answer_id}/vote",
        headers={"Authorization": f"Bearer {contributor_token}"},
        json={"value": 1},
    )
    assert a_vote.status_code == 200
    assert a_vote.json()["answers"][0]["upvotes"] == 1

    # 10. Admin QA queue keyword sorting
    admin_queue = await client.get(
        "/api/v1/admin/qa/queue",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_queue.status_code == 200
    queue_data = admin_queue.json()
    assert queue_data["total_questions"] >= 1
    assert any(c["keyword"] == "internship" for c in queue_data["clusters"])
