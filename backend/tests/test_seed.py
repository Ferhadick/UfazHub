import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db.base import Base
from app.models import Collection, Question, Resource, User
from app.models.enums import UserRole
from app.schemas.article import ArticleCreate
from app.schemas.collection import CollectionCreate
from app.schemas.qa import AnswerCreate, QuestionCreate
from app.schemas.resource import ResourceCreate
from app.schemas.user import UserCreate
from app.services.articles import create_article
from app.services.auth import register_user
from app.services.collections import create_collection
from app.services.qa import create_answer, create_question, pin_answer
from app.services.resources import create_resource


@pytest.mark.asyncio
async def test_seed_database_flow():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as session:
        # 1. Register student user
        reg_user = await register_user(
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
        user = await session.get(User, reg_user.user.id)
        assert user is not None

        # 2. Register verified alumni Ali
        reg_ali = await register_user(
            session,
            UserCreate(
                email="ali.aliyev@alumni.ufaz.az",
                username="ali_alumni",
                password="localpass123",
                name="Ali Aliyev",
                faculty="Computer Science",
            ),
            None,
        )
        ali = await session.get(User, reg_ali.user.id)
        ali.role = UserRole.verified_ufazian
        ali.is_verified = True
        ali.graduation_year = 2022
        ali.current_role = "Machine Learning Engineer"
        ali.company_or_institution = "Bolt / AILAB Alumni"
        ali.degree_level = "Alumni"
        ali.reputation_score = 450
        await session.commit()

        # 3. Create AILAB track resource
        ailab_res = await create_resource(
            session,
            ResourceCreate(
                title="AILAB Track 1: Linear Algebra & Matrix Calculus",
                description="Mathematical foundations required for deep learning screening at AILAB.",
                url="https://mml-book.github.io/",
                type="book",
                category="Mathematics & Foundations",
                difficulty="intermediate",
                use_case="AILAB interview prep",
                tags=["ailab", "mathematics"],
            ),
            ali,
        )
        assert ailab_res.title.startswith("AILAB Track 1")

        # 4. Create AILAB roadmap collection
        ailab_coll = await create_collection(
            session,
            CollectionCreate(
                title="AILAB Internship Roadmap (Summer 2026 Batch)",
                description="The official student-curated roadmap to clear the AILAB screening.",
                resource_ids=[ailab_res.id],
                tags=["ailab", "roadmap"],
            ),
            ali,
        )
        assert len(ailab_coll.items) == 1

        # 5. Create Q&A question and verified answer
        q = await create_question(
            session,
            QuestionCreate(
                title="How should I prepare for the AILAB computer vision interview?",
                body="What topics do they focus on during the live-coding round?",
                topic_tag="internships",
                linked_resource_id=ailab_res.id,
            ),
            user,
        )
        assert q.author_id == user.id

        question_with_ans = await create_answer(
            session,
            q.id,
            AnswerCreate(
                body="Focus on matrix gradients, backprop, and pure NumPy implementation of convolution.",
                linked_resources=[{"title": "MML Book", "url": "https://mml-book.github.io/"}],
            ),
            ali,
        )
        assert len(question_with_ans.answers) == 1
        created_ans = question_with_ans.answers[0]
        assert created_ans.author.is_verified is True

        # 6. Author pins the verified answer
        pinned_q = await pin_answer(session, q.id, created_ans.id, user)
        assert pinned_q.status.value == "answered"
        assert any(a.is_pinned for a in pinned_q.answers)
