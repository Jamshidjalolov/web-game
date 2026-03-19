import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import QuestionType


class QuestionCreate(BaseModel):
    game_id: str = Field(min_length=2, max_length=100)
    question_type: QuestionType = QuestionType.MULTIPLE_CHOICE
    prompt: str = Field(min_length=3, max_length=5000)
    options: list[str] = Field(default_factory=list)
    correct_index: int | None = None
    answer_text: str | None = Field(default=None, max_length=500)
    hint: str | None = Field(default=None, max_length=1000)
    difficulty: str | None = Field(default=None, max_length=32)
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    teacher_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "QuestionCreate":
        if self.question_type == QuestionType.MULTIPLE_CHOICE:
            if len(self.options) < 2:
                raise ValueError("Multiple-choice savol uchun kamida 2 ta variant kerak.")
            if self.correct_index is None:
                raise ValueError("Multiple-choice savol uchun correct_index majburiy.")
            if self.correct_index < 0 or self.correct_index >= len(self.options):
                raise ValueError("correct_index variantlar diapazonida bo'lishi kerak.")
        if self.question_type == QuestionType.OPEN_TEXT:
            if not self.answer_text or not self.answer_text.strip():
                raise ValueError("Open-text savol uchun answer_text majburiy.")
        return self


class QuestionUpdate(BaseModel):
    game_id: str | None = Field(default=None, min_length=2, max_length=100)
    question_type: QuestionType | None = None
    prompt: str | None = Field(default=None, min_length=3, max_length=5000)
    options: list[str] | None = None
    correct_index: int | None = None
    answer_text: str | None = Field(default=None, max_length=500)
    hint: str | None = Field(default=None, max_length=1000)
    difficulty: str | None = Field(default=None, max_length=32)
    metadata_json: dict[str, Any] | None = None
    is_archived: bool | None = None


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    teacher_id: uuid.UUID
    game_id: str
    question_type: QuestionType
    prompt: str
    options: list[str]
    correct_index: int | None
    answer_text: str | None
    hint: str | None
    difficulty: str | None
    metadata_json: dict[str, Any]
    is_archived: bool
    created_at: datetime
    updated_at: datetime


class AIQuestionGenerateRequest(BaseModel):
    subject: str | None = Field(default=None, max_length=120)
    topic: str = Field(min_length=2, max_length=240)
    count: int = Field(default=1, ge=1, le=20)
    game_id: str | None = Field(default=None, min_length=2, max_length=100)
    difficulty: str | None = Field(default=None, max_length=32)


class AIQuestionItem(BaseModel):
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    answer: str
    correct_index: int = Field(ge=0, le=3)


class AIQuestionGenerateResponse(BaseModel):
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    answer: str
    correct_index: int = Field(ge=0, le=3)
    items: list[AIQuestionItem] = Field(default_factory=list)
    requested_count: int = Field(ge=1, le=20)
    generated_count: int = Field(ge=1, le=20)
    provider: str
