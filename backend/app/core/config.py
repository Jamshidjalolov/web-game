from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Game Web API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/game_web"
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"],
    )

    jwt_secret_key: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    firebase_credentials_path: str | None = None
    firebase_project_id: str | None = None

    admin_emails: Annotated[list[str], NoDecode] = Field(default_factory=list)

    ai_hf_api_token: str | None = None
    ai_hf_model: str = "google/flan-t5-large"
    ai_request_timeout_seconds: float = 35.0

    @field_validator("cors_origins", "admin_emails", mode="before")
    @classmethod
    def parse_csv_fields(cls, value: object) -> object:
        if value is None:
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("admin_emails")
    @classmethod
    def normalize_admin_emails(cls, value: list[str]) -> list[str]:
        return [item.lower() for item in value]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
