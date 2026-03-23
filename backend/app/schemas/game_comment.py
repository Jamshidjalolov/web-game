import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CommentStatus


class GameCommentCreate(BaseModel):
    game_id: str = Field(min_length=2, max_length=100)
    content: str = Field(min_length=3, max_length=2000)


class GameCommentModerateRequest(BaseModel):
    status: CommentStatus | None = None
    admin_reply: str | None = Field(default=None, max_length=2000)


class GameCommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    game_id: str
    game_title: str
    user_id: uuid.UUID
    author_name: str
    author_email: str | None = None
    content: str
    status: CommentStatus
    admin_reply: str | None
    moderator_name: str | None = None
    created_at: datetime
    updated_at: datetime
    moderated_at: datetime | None
