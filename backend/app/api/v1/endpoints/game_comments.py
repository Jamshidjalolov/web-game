from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.enums import CommentStatus
from app.models.game import Game
from app.models.game_comment import GameComment
from app.models.user import User
from app.schemas.game_comment import (
    GameCommentCreate,
    GameCommentModerateRequest,
    GameCommentRead,
)

router = APIRouter(prefix="/game-comments", tags=["game-comments"])


def _to_comment_read(comment: GameComment, include_email: bool) -> GameCommentRead:
    author_name = comment.author.full_name or comment.author.email
    return GameCommentRead(
        id=comment.id,
        game_id=comment.game_id,
        game_title=comment.game.title,
        user_id=comment.user_id,
        author_name=author_name,
        author_email=comment.author.email if include_email else None,
        content=comment.content,
        status=comment.status,
        admin_reply=comment.admin_reply,
        moderator_name=comment.approved_by.full_name or comment.approved_by.email if comment.approved_by else None,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        moderated_at=comment.moderated_at,
    )


@router.get("", response_model=list[GameCommentRead])
def list_approved_comments(
    game_id: str = Query(min_length=2, max_length=100),
    db: Session = Depends(get_db),
) -> list[GameCommentRead]:
    comments = db.scalars(
        select(GameComment)
        .options(
            selectinload(GameComment.author),
            selectinload(GameComment.approved_by),
            selectinload(GameComment.game),
        )
        .where(
            GameComment.game_id == game_id,
            GameComment.status == CommentStatus.APPROVED,
        )
        .order_by(GameComment.created_at.desc()),
    ).all()
    return [_to_comment_read(comment, include_email=False) for comment in comments]


@router.post("", response_model=GameCommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(
    payload: GameCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GameCommentRead:
    game = db.get(Game, payload.game_id)
    if game is None or not game.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="O'yin topilmadi.")

    comment = GameComment(
        game_id=payload.game_id,
        user_id=current_user.id,
        content=payload.content.strip(),
        status=CommentStatus.PENDING,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    hydrated = db.scalar(
        select(GameComment)
        .options(
            selectinload(GameComment.author),
            selectinload(GameComment.approved_by),
            selectinload(GameComment.game),
        )
        .where(GameComment.id == comment.id),
    )
    assert hydrated is not None
    return _to_comment_read(hydrated, include_email=True)


@router.get("/admin", response_model=list[GameCommentRead])
def list_comments_for_admin(
    status_filter: CommentStatus | None = Query(default=None, alias="status"),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[GameCommentRead]:
    query = (
        select(GameComment)
        .options(
            selectinload(GameComment.author),
            selectinload(GameComment.approved_by),
            selectinload(GameComment.game),
        )
        .order_by(GameComment.created_at.desc())
    )
    if status_filter is not None:
        query = query.where(GameComment.status == status_filter)

    comments = db.scalars(query).all()
    return [_to_comment_read(comment, include_email=True) for comment in comments]


@router.patch("/{comment_id}", response_model=GameCommentRead)
def moderate_comment(
    comment_id: UUID,
    payload: GameCommentModerateRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> GameCommentRead:
    comment = db.scalar(
        select(GameComment)
        .options(
            selectinload(GameComment.author),
            selectinload(GameComment.approved_by),
            selectinload(GameComment.game),
        )
        .where(GameComment.id == comment_id),
    )
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Izoh topilmadi.")

    if payload.status is not None:
        comment.status = payload.status
        comment.approved_by_id = admin_user.id
        comment.moderated_at = datetime.now(timezone.utc)

    if payload.admin_reply is not None:
        stripped = payload.admin_reply.strip()
        comment.admin_reply = stripped or None
        if stripped:
            comment.approved_by_id = admin_user.id
            comment.moderated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(comment)

    hydrated = db.scalar(
        select(GameComment)
        .options(
            selectinload(GameComment.author),
            selectinload(GameComment.approved_by),
            selectinload(GameComment.game),
        )
        .where(GameComment.id == comment_id),
    )
    assert hydrated is not None
    return _to_comment_read(hydrated, include_email=True)
