from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://ufaz:ufaz@postgres:5432/ufaz_hub"
    jwt_secret: str = Field(default="change-me-in-production-with-at-least-32-bytes", min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 20
    refresh_token_days: int = 14
    cookie_secure: bool = False
    ip_hash_salt: str = Field(default="local-dev-salt", min_length=8)
    frontend_url: AnyHttpUrl | str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [str(self.frontend_url), "http://127.0.0.1:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
