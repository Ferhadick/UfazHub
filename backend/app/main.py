from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import install_error_handlers


def create_app() -> FastAPI:
    app = FastAPI(title="UFAZ Hub API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    install_error_handlers(app)
    app.include_router(api_router, prefix="/api/v1")

    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
