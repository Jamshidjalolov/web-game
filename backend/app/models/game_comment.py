import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base
from app.models.enums import CommentStatus

if TYPE_CHECKING:
    from app.models.game import Game
    from app.models.user import User


def _enum_values(enum_cls: type[CommentStatus]) -> list[str]:
    return [item.value for item in enum_cls]


class GameComment(Base):
    __tablename__ = "game_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("games.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[CommentStatus] = mapped_column(
        Enum(CommentStatus, name="comment_status", values_callable=_enum_values),
        nullable=False,
        default=CommentStatus.PENDING,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    admin_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    moderated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    game: Mapped["Game"] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship(
        back_populates="game_comments",
        foreign_keys=[user_id],
    )
    approved_by: Mapped["User | None"] = relationship(
        back_populates="moderated_comments",
        foreign_keys=[approved_by_id],
    )
