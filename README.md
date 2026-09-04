# UFAZ Hub

UFAZ Hub is a student-built archive for resources, notes, course material, and practical writeups. This repository is being built in vertical slices, starting with auth, guest sessions, action tracking, resources, articles, collections, and public discovery.

## Current Slice

- FastAPI backend with async SQLAlchemy 2.0 models
- Alembic migration for users, resources, tags, votes, guest sessions, and action events
- JWT access-token auth
- Refresh-token cookie flow
- Guest session cookie flow with hashed IP storage
- Resource, article, and collection CRUD foundations
- Ordered collection items
- Unified feed and search across resources, articles, and collections
- Voting and blocked guest action tracking
- Unified Markdown-first author composer with optional links and file attachments
- Research discovery page for papers, projects, theses, datasets, research notes, and researchers
- Rich resource previews for PDFs, images, text/Markdown/CSV files, YouTube, repositories, and external links
- Public people directory with featured ranking plus researcher, verification, student/alumni, faculty, and sort filters
- Public profile pages with research signals, contributions, topics, and resource previews
- Next.js App Router frontend with a simple, search-first homepage and API-backed discovery pages
- Admin moderation panel at `/admin` for users, content, and action events
- Roles `user` and `admin`, plus mute / ban / warning states
- Hidden content excluded from public list, feed, search, and show

## Setup

1. Copy `.env.example` to `.env`.
2. Run:

```bash
docker compose up --build
```

3. Seed sample data:

```bash
docker compose exec backend uv run python scripts_seed.py
```

Promote an operator, or bootstrap via `ADMIN_EMAILS` (comma-separated) so matching addresses become admins on register/login. Existing admin roles are never reset or demoted by this bootstrap path:

```bash
docker compose exec backend uv run python scripts_promote_admin.py leyla.mammadova@ufaz.az
```

Frontend: `http://localhost:3000`

Admin desk: `http://localhost:3000/admin`

Backend OpenAPI: `http://localhost:8000/docs`

## Local Backend Commands

Use `uv` for Python dependency management:

```bash
cd backend
uv sync --extra dev
uv run pytest
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

If `uv` reports a cache directory conflict on Windows, keep the cache in the workspace:

```powershell
$env:UV_CACHE_DIR='C:\Users\x\.uv-cache'
uv run pytest
```

## Deployment Notes

After pulling this version, run `uv run alembic upgrade head` before starting the API. Migration `0007_qa_enum_consistency` fixes the Q&A PostgreSQL enum mismatch and extends the existing action-event enum with the Q&A audit events used by question and answer writes. Docker Compose already runs Alembic on backend startup.

The app is intentionally host-portable. For AWS, the clean path is PostgreSQL on RDS, backend on ECS/Fargate or App Runner, and frontend on Amplify, Vercel, or a container service. Required runtime configuration is environment-variable based: `DATABASE_URL`, `JWT_SECRET`, `IP_HASH_SALT`, `FRONTEND_URL`, `NEXT_PUBLIC_API_BASE_URL`, `API_INTERNAL_BASE_URL`, and `ADMIN_EMAILS`. Keep `COOKIE_SECURE=true` behind HTTPS.

Before a public launch, add managed secrets, HTTPS-only cookies, a real domain in CORS, database backups, and API rate limiting at the edge or gateway. The application code does not assume AWS-specific services, so the same containers can move to another provider.

## Architecture Decisions

PostgreSQL is the primary database because the product needs relational integrity for users, content, tags, votes, ordered collections, and auditable reputation/action logs. UUIDs are used for public identifiers. Votes and action events use polymorphic targets for MVP velocity; tag joins stay explicit per content type to keep foreign-key integrity as the product expands.

The public UI uses system sans-serif typography, restrained serif display headings, neutral surfaces, subtle borders, and a single blue accent. The design stays dependency-light while following conventional institutional, editorial, and accessibility patterns. Authoring is Markdown-first: contributors can type or paste text, add a link, attach a common document/image/archive, or mark a post as research without choosing backend content types themselves. Research posts are collected through existing tags/content models instead of a separate backend silo.

## Next Build Slice

- PostgreSQL `tsvector` search migration for all content types
- Persistent refresh-token rotation/revocation
- Auth and write-action rate limiting
- CI workflow and production container hardening
- Better authenticated frontend session handling without manually pasting access tokens
