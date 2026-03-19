from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VisualIqRankingCreate(BaseModel):
    game_id: str = Field(default="visual-brain-teasers", min_length=1, max_length=100)
    player_name: str = Field(min_length=2, max_length=120)
    age: int = Field(ge=6, le=99)
    iq_score: int = Field(ge=70, le=160)
    percentile: int = Field(ge=1, le=99)
    correct_answers: int = Field(ge=0, le=100)
    round_count: int = Field(ge=1, le=100)
    accuracy_percent: int = Field(ge=0, le=100)
    speed_percent: int = Field(ge=0, le=100)
    total_time_seconds: int = Field(ge=0, le=36000)
    difficulty_label: str = Field(min_length=2, max_length=32)


class VisualIqRankingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    game_id: str
    player_name: str
    age: int
    iq_score: int
    percentile: int
    correct_answers: int
    round_count: int
    accuracy_percent: int
    speed_percent: int
    total_time_seconds: int
    difficulty_label: str
    created_at: datetime
