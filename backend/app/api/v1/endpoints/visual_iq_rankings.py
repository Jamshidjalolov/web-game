from fastapi import APIRouter, Depends, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.visual_iq_ranking import VisualIqRanking
from app.schemas.visual_iq_ranking import VisualIqRankingCreate, VisualIqRankingRead

router = APIRouter(prefix="/visual-iq-rankings", tags=["visual-iq-rankings"])


@router.get("", response_model=list[VisualIqRankingRead])
def list_visual_iq_rankings(
    limit: int = 10,
    game_id: str = "visual-brain-teasers",
    db: Session = Depends(get_db),
) -> list[VisualIqRankingRead]:
    safe_limit = max(1, min(limit, 50))
    query: Select[tuple[VisualIqRanking]] = (
        select(VisualIqRanking)
        .where(VisualIqRanking.game_id == game_id)
        .order_by(
            VisualIqRanking.iq_score.desc(),
            VisualIqRanking.accuracy_percent.desc(),
            VisualIqRanking.speed_percent.desc(),
            VisualIqRanking.total_time_seconds.asc(),
            VisualIqRanking.created_at.asc(),
        )
        .limit(safe_limit)
    )
    records = db.scalars(query).all()
    return [VisualIqRankingRead.model_validate(record) for record in records]


@router.post("", response_model=VisualIqRankingRead, status_code=status.HTTP_201_CREATED)
def create_visual_iq_ranking(
    payload: VisualIqRankingCreate,
    db: Session = Depends(get_db),
) -> VisualIqRankingRead:
    record = VisualIqRanking(
        game_id=payload.game_id.strip(),
        player_name=payload.player_name.strip(),
        age=payload.age,
        iq_score=payload.iq_score,
        percentile=payload.percentile,
        correct_answers=payload.correct_answers,
        round_count=payload.round_count,
        accuracy_percent=payload.accuracy_percent,
        speed_percent=payload.speed_percent,
        total_time_seconds=payload.total_time_seconds,
        difficulty_label=payload.difficulty_label.strip(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return VisualIqRankingRead.model_validate(record)
