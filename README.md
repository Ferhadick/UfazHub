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
- Public leaderboard and profile pages
- Next.js App Router frontend with an archival homepage and API-backed discovery pages

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

Frontend: `http://localhost:3000`

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

The app is intentionally host-portable. For AWS, the clean path is PostgreSQL on RDS, backend on ECS/Fargate or App Runner, and frontend on Amplify, Vercel, or a container service. Required runtime configuration is environment-variable based: `DATABASE_URL`, `JWT_SECRET`, `IP_HASH_SALT`, `FRONTEND_URL`, `NEXT_PUBLIC_API_BASE_URL`, and `API_INTERNAL_BASE_URL`. Keep `COOKIE_SECURE=true` behind HTTPS.

Before a public launch, add managed secrets, HTTPS-only cookies, a real domain in CORS, database backups, and API rate limiting at the edge or gateway. The application code does not assume AWS-specific services, so the same containers can move to another provider.

## Architecture Decisions

PostgreSQL is the primary database because the product needs relational integrity for users, content, tags, votes, ordered collections, and auditable reputation/action logs. UUIDs are used for public identifiers. Votes and action events use polymorphic targets for MVP velocity; tag joins stay explicit per content type to keep foreign-key integrity as the product expands.

Typography uses Georgia for editorial headings and Aptos/Segoe UI for body text. The pairing gives the platform a journal/catalogue tone without depending on external font loading. The color system uses warm paper, ink, redwood, moss, and clay tokens to avoid a generic SaaS palette.

## Next Build Slice

- PostgreSQL `tsvector` search migration for all content types
- Persistent refresh-token rotation/revocation
- Auth and write-action rate limiting
- CI workflow and production container hardening
- Better authenticated frontend session handling without manually pasting access tokens
