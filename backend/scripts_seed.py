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

        # ─── SEED ALUMNI USERS (Verified UFAZians) ───────────────────────────
        from app.models.enums import UserRole
        from app.schemas.qa import AnswerCreate, QuestionCreate
        from app.services.qa import create_answer, create_question, pin_answer

        ali = await session.scalar(select(User).where(User.email == "ali.aliyev@alumni.ufaz.az"))
        if ali is None:
            registered_ali = await register_user(
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
            ali = await session.get(User, registered_ali.user.id)
            ali.role = UserRole.verified_ufazian
            ali.is_verified = True
            ali.graduation_year = 2022
            ali.current_role = "Machine Learning Engineer"
            ali.company_or_institution = "Bolt / AILAB Alumni"
            ali.degree_level = "Alumni"
            ali.reputation_score = 450
            await session.commit()
            print("created verified alumni: Ali Aliyev")
        else:
            print("ali already exists")

        nigar = await session.scalar(select(User).where(User.email == "nigar.hasanova@alumni.ufaz.az"))
        if nigar is None:
            registered_nigar = await register_user(
                session,
                UserCreate(
                    email="nigar.hasanova@alumni.ufaz.az",
                    username="nigar_h",
                    password="localpass123",
                    name="Nigar Hasanova",
                    faculty="Computer Science",
                ),
                None,
            )
            nigar = await session.get(User, registered_nigar.user.id)
            nigar.role = UserRole.verified_ufazian
            nigar.is_verified = True
            nigar.graduation_year = 2023
            nigar.current_role = "Master's Researcher"
            nigar.company_or_institution = "Sorbonne University"
            nigar.degree_level = "Alumni"
            nigar.reputation_score = 380
            await session.commit()
            print("created verified alumni: Nigar Hasanova")
        else:
            print("nigar already exists")

        # ─── SEED AILAB ROADMAP COLLECTION ──────────────────────────────────
        ailab_samples = [
            ResourceCreate(
                title="AILAB Track 1: Linear Algebra & Matrix Calculus for ML",
                description="The core mathematical foundations required to understand gradient descent, backprop, eigenvalues, and SVD as taught in Stanford CS229 and UFAZ maths.",
                url="https://mml-book.github.io/",
                type="book",
                category="Mathematics & Foundations",
                difficulty="intermediate",
                use_case="AILAB internship theory screening",
                time_commitment="1-2 weeks",
                prerequisites="L1/L2 linear algebra and multivariable calculus.",
                best_part="Chapter 5 & 6 connect vector derivatives directly to neural network weights.",
                warning="Do not read cover-to-cover; focus on exercises with matrix gradients.",
                student_note="Reviewed this 3 days before my AILAB technical screen. They specifically asked about matrix dimensions in backprop.",
                tags=["mathematics", "linear-algebra", "ailab", "machine-learning"],
            ),
            ResourceCreate(
                title="AILAB Track 2: Classical ML & Scikit-Learn Pipeline Mastery",
                description="End-to-end practical guide to feature encoding, cross-validation, hyperparameter tuning, and decision trees/ensembles before touching neural nets.",
                url="https://scikit-learn.org/stable/tutorial/index.html",
                type="docs",
                category="AI & Data Science",
                difficulty="intermediate",
                use_case="Tabular data modeling & AILAB take-home test",
                time_commitment="Weekend dive",
                prerequisites="Pandas dataframes and basic Python OOP.",
                best_part="Pipeline and ColumnTransformer section eliminates data leakage.",
                warning="Always split train/test before fitting scalers or encoders.",
                student_note="AILAB recruiters heavily check whether your validation strategy has target leakage.",
                tags=["machine-learning", "scikit-learn", "ailab", "python"],
            ),
            ResourceCreate(
                title="AILAB Track 3: Deep Learning with PyTorch & Modern CV/NLP",
                description="Writing clean PyTorch training loops, datasets, dataloaders, and fine-tuning Hugging Face transformers and torchvision vision models.",
                url="https://pytorch.org/tutorials/",
                type="course",
                category="AI & Data Science",
                difficulty="advanced",
                use_case="Computer vision or NLP subteam placement",
                time_commitment="2-3 weeks",
                prerequisites="Python 3, NumPy vector operations, basic neural network concepts.",
                best_part="Clear separation of forward pass, loss calculation, optimizer zero_grad, and backward pass.",
                warning="Ensure you use torch.no_grad() during evaluation to avoid GPU out-of-memory errors.",
                student_note="Keep training loops modular with logging. UFAZ servers have GPUs you can request access to.",
                tags=["pytorch", "deep-learning", "computer-vision", "ailab"],
            ),
            ResourceCreate(
                title="AILAB Track 4: Production ML Serving with FastAPI & Docker",
                description="Packaging ML models into low-latency async REST microservices, writing Pydantic validation schemas, and containerizing with multi-stage Dockerfiles.",
                url="https://fastapi.tiangolo.com/tutorial/",
                type="docs",
                category="Computer Science & Software",
                difficulty="intermediate",
                use_case="Final stage deployment for AILAB projects",
                time_commitment="1 week",
                prerequisites="Python type hints and async/await basics.",
                best_part="Automatic OpenAPI docs at /docs makes testing endpoints immediate.",
                warning="Do not load large PyTorch models inside every request handler; load once at lifespan startup.",
                student_note="This is what separates a student Jupyter notebook from a hireable junior engineer.",
                tags=["fastapi", "docker", "production", "backend", "ailab"],
            ),
        ]

        ailab_resources = []
        for item in ailab_samples:
            res = await session.scalar(select(Resource).where(Resource.title == item.title))
            if res is None:
                res = await create_resource(session, item, ali)
                print(f"created AILAB resource: {item.title}")
            else:
                print(f"resource already exists: {item.title}")
            ailab_resources.append(res)

        ailab_collection_title = "AILAB Internship Roadmap (Summer 2026 Batch)"
        if await session.scalar(select(Collection).where(Collection.title == ailab_collection_title)) is None:
            await create_collection(
                session,
                CollectionCreate(
                    title=ailab_collection_title,
                    description="The official student-curated roadmap to clear the AILAB screening, interview, and project delivery stages. Authored by alumni currently in industry.",
                    resource_ids=[r.id for r in ailab_resources],
                    tags=["ailab", "roadmap", "internship", "machine-learning", "career"],
                ),
                ali,
            )
            print(f"created collection: {ailab_collection_title}")
        else:
            print(f"collection already exists: {ailab_collection_title}")

        # ─── SEED Q&A THREADS ────────────────────────────────────────────────
        from app.models.qa import Question

        q1_title = "How should I prepare for the AILAB computer vision & ML technical interview?"
        q1 = await session.scalar(select(Question).where(Question.title == q1_title))
        if q1 is None:
            q1 = await create_question(
                session,
                QuestionCreate(
                    title=q1_title,
                    body=(
                        "I am in L3 CS and applying for the upcoming AILAB summer internship batch. "
                        "What topics do they focus on during the whiteboard/live-coding round, "
                        "and what should I have ready in my GitHub portfolio?"
                    ),
                    topic_tag="internships",
                    linked_resource_id=ailab_resources[0].id if ailab_resources else None,
                ),
                user,
            )
            print(f"created question: {q1_title}")

            # Answer from Ali (Verified Alumni)
            ans1 = await create_answer(
                session,
                q1.id,
                AnswerCreate(
                    body=(
                        "Having interviewed candidates for AILAB, here is the exact breakdown:\n\n"
                        "1. **Math Screening (30 mins)**: Expect questions on matrix multiplication dimensions, "
                        "why ReLU is preferred over Sigmoid in deep networks (vanishing gradient), and how backpropagation uses the chain rule.\n\n"
                        "2. **Coding (45 mins)**: Usually in pure Python + NumPy. You might be asked to implement IoU (Intersection over Union), "
                        "a simple 2-layer MLP from scratch, or write a custom DataLoader.\n\n"
                        "3. **Portfolio**: One finished project with clean Git commits, a README with architecture diagrams, and a deployed demo is worth 10 cloned tutorial notebooks.\n\n"
                        "Check the AILAB Track 1 and 2 resources linked above — they cover 90% of what we asked last summer!"
                    ),
                    linked_resources=[
                        {"title": "MML Book Linear Algebra", "url": "https://mml-book.github.io/"},
                        {"title": "FastAPI Deployment Guide", "url": "https://fastapi.tiangolo.com/"},
                    ],
                ),
                ali,
            )
            # Question author pins answer
            await pin_answer(session, q1.id, ans1.answers[-1].id, user)
            print("answered and pinned answer for Q1")

        q2_title = "Applying to French Master's programs from UFAZ: Strasbourg vs Sorbonne?"
        q2 = await session.scalar(select(Question).where(Question.title == q2_title))
        if q2 is None:
            q2 = await create_question(
                session,
                QuestionCreate(
                    title=q2_title,
                    body=(
                        "For UFAZ CS students planning to continue in France, what are the key differences between "
                        "University of Strasbourg and Sorbonne in terms of research labs, living costs, and Erasmus scholarships?"
                    ),
                    topic_tag="master",
                ),
                user,
            )
            print(f"created question: {q2_title}")

            # Answer from Nigar (Verified Alumni at Sorbonne)
            ans2 = await create_answer(
                session,
                q2.id,
                AnswerCreate(
                    body=(
                        "Great question! I graduated in 2023 and went directly to Sorbonne for my Master's:\n\n"
                        "• **Academic Rigor**: Strasbourg is our parent university, so credit conversion (ECTS) and "
                        "faculty recommendations are practically automatic. Sorbonne requires a separate Campus France dossier, "
                        "but UFAZ's French double diploma carries immense prestige.\n\n"
                        "• **Living Costs**: Strasbourg is much more student-friendly (~€650-800/month with CROUS housing). "
                        "Paris / Sorbonne is around €1,100-1,400/month.\n\n"
                        "• **Research & Industry**: If your goal is AI research, Sorbonne has close ties to INRIA and FAIR Paris. "
                        "If you want European mobility or aerospace/robotics, Strasbourg's ICube lab is world-class."
                    ),
                    linked_resources=[
                        {"title": "Campus France Azerbaijan", "url": "https://www.azerbaidjan.campusfrance.org/"}
                    ],
                ),
                nigar,
            )
            await pin_answer(session, q2.id, ans2.answers[-1].id, user)
            print("answered and pinned answer for Q2")

        q3_title = "Best strategy for passing Probability & Statistics in L2 semester 2?"
        q3 = await session.scalar(select(Question).where(Question.title == q3_title))
        if q3 is None:
            await create_question(
                session,
                QuestionCreate(
                    title=q3_title,
                    body="Midterms are in 4 weeks. How should we allocate time between theoretical theorems and lab exercises?",
                    topic_tag="exams",
                ),
                user,
            )
            print(f"created question: {q3_title}")


if __name__ == "__main__":
    asyncio.run(main())

