from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.game import Game
from app.schemas.game import GameRead

router = APIRouter(prefix="/games", tags=["games"])


@router.get("", response_model=list[GameRead])
def list_games(active_only: bool = True, db: Session = Depends(get_db)) -> list[GameRead]:
    query: Select[tuple[Game]] = select(Game)
    if active_only:
        query = query.where(Game.is_active.is_(True))
    query = query.order_by(Game.order_index.asc(), Game.title.asc())
    records = db.scalars(query).all()
    return [GameRead.model_validate(record) for record in records]


@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: str, db: Session = Depends(get_db)) -> GameRead:
    record = db.get(Game, game_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="O'yin topilmadi.")
    return GameRead.model_validate(record)
