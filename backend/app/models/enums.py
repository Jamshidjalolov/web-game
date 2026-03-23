from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"


class CommentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    OPEN_TEXT = "open_text"
