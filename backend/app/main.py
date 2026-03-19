import logging

from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, select, text

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.game import Game
from app.seed.games_seed import GAMES_SEED

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

logger = logging.getLogger("uvicorn.error")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.warning("422 validation error on %s: %s", request.url.path, exc.errors())
    return await request_validation_exception_handler(request, exc)


def _bootstrap_database() -> None:
    # Fallback for development: ensures core tables exist even before Alembic run.
    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
        inspector = inspect(connection)
        if "users" in inspector.get_table_names():
            columns = {column["name"] for column in inspector.get_columns("users")}
            if "password_hash" not in columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))

    with SessionLocal() as db:
        existing_ids = set(db.scalars(select(Game.id)).all())
        missing_games = [item for item in GAMES_SEED if item["id"] not in existing_ids]
        if missing_games:
            db.add_all([Game(**item) for item in missing_games])
            db.commit()


@app.on_event("startup")
def on_startup() -> None:
    _bootstrap_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
