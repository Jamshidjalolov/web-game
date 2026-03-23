from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _resolve_database_url() -> str:
    database_url = settings.database_url

    if database_url.startswith("postgresql+psycopg2://"):
        try:
            import psycopg2  # noqa: F401
        except ModuleNotFoundError:
            try:
                import psycopg  # noqa: F401
            except ModuleNotFoundError:
                return database_url
            return database_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

    return database_url


engine = create_engine(_resolve_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
