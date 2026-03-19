"""Initial schema with users, games and questions.

Revision ID: 20260304_0001
Revises:
Create Date: 2026-03-04 12:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260304_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    user_role = sa.Enum("admin", "teacher", name="user_role")
    question_type = sa.Enum("multiple_choice", "open_text", name="question_type")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("firebase_uid", sa.String(length=128), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("photo_url", sa.String(length=500), nullable=True),
        sa.Column("role", user_role, nullable=False, server_default=sa.text("'teacher'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_firebase_uid", "users", ["firebase_uid"], unique=True)

    op.create_table(
        "games",
        sa.Column("id", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("desc", sa.Text(), nullable=False),
        sa.Column("players", sa.String(length=32), nullable=False),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column("duration", sa.String(length=32), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("tone", sa.String(length=64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("game_id", sa.String(length=100), nullable=False),
        sa.Column("question_type", question_type, nullable=False, server_default=sa.text("'multiple_choice'")),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("options", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("correct_index", sa.Integer(), nullable=True),
        sa.Column("answer_text", sa.String(length=500), nullable=True),
        sa.Column("hint", sa.Text(), nullable=True),
        sa.Column("difficulty", sa.String(length=32), nullable=True),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["teacher_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_questions_teacher_id", "questions", ["teacher_id"], unique=False)
    op.create_index("ix_questions_game_id", "questions", ["game_id"], unique=False)

    games_table = sa.table(
        "games",
        sa.column("id", sa.String),
        sa.column("title", sa.String),
        sa.column("desc", sa.Text),
        sa.column("players", sa.String),
        sa.column("level", sa.String),
        sa.column("duration", sa.String),
        sa.column("category", sa.String),
        sa.column("tone", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("order_index", sa.Integer),
    )

    op.bulk_insert(
        games_table,
        [
            {
                "id": "baraban-metodi",
                "title": "Baraban metodi",
                "desc": "Tasodifiy tanlov orqali sinfda faollikni oshiradigan o'yin.",
                "players": "1.2k+",
                "level": "Oddiy",
                "duration": "5 daqiqa",
                "category": "Jamoaviy",
                "tone": "from-cyan-500 to-blue-500",
                "is_active": True,
                "order_index": 1,
            },
            {
                "id": "arqon-tortish",
                "title": "Arqon tortish o'yini",
                "desc": "Jamoaviy hamkorlik va tez qaror qilishni kuchaytiradi.",
                "players": "1.4k+",
                "level": "O'rta",
                "duration": "8 daqiqa",
                "category": "Jamoaviy",
                "tone": "from-orange-500 to-amber-500",
                "is_active": True,
                "order_index": 2,
            },
            {
                "id": "soz-qidiruv",
                "title": "So'z qidiruv o'yini",
                "desc": "Harflar ichidan yashirilgan so'zlarni topish topshirig'i.",
                "players": "1.7k+",
                "level": "Murakkab",
                "duration": "10 daqiqa",
                "category": "Tillar",
                "tone": "from-emerald-500 to-lime-500",
                "is_active": True,
                "order_index": 3,
            },
            {
                "id": "millioner",
                "title": "Millioner viktorina",
                "desc": "2 jamoa bir xil savolda bellashadi: birinchi to'g'ri topgan ko'proq ball oladi.",
                "players": "1.1k+",
                "level": "O'rta",
                "duration": "12 daqiqa",
                "category": "Jamoaviy",
                "tone": "from-indigo-500 to-violet-500",
                "is_active": True,
                "order_index": 4,
            },
            {
                "id": "puzzle-mozaika",
                "title": "Puzzle mozaika",
                "desc": "Rasm bo'laklarini to'g'ri joylab mantiq va diqqatni rivojlantiring.",
                "players": "1.0k+",
                "level": "O'rta",
                "duration": "7 daqiqa",
                "category": "Mantiq",
                "tone": "from-sky-500 to-indigo-500",
                "is_active": True,
                "order_index": 5,
            },
            {
                "id": "inglizcha-soz",
                "title": "Inglizcha so'z o'yini",
                "desc": "Yangi so'zlarni rasm bilan bog'lab tez yod olish usuli.",
                "players": "1.9k+",
                "level": "O'rta",
                "duration": "9 daqiqa",
                "category": "Tillar",
                "tone": "from-rose-500 to-pink-500",
                "is_active": True,
                "order_index": 6,
            },
            {
                "id": "bayroq-topish",
                "title": "Bayroq topish o'yini",
                "desc": "Bayroqni ko'rib to'g'ri davlat nomini topadigan jamoaviy viktorina.",
                "players": "1.2k+",
                "level": "O'rta",
                "duration": "8 daqiqa",
                "category": "Jamoaviy",
                "tone": "from-cyan-500 to-blue-500",
                "is_active": True,
                "order_index": 7,
            },
            {
                "id": "tezkor-hisob",
                "title": "Tezkor hisob",
                "desc": "Qisqa vaqtda misollarni yechib hisoblash tezligini oshiring.",
                "players": "1.3k+",
                "level": "O'rta",
                "duration": "6 daqiqa",
                "category": "Matematika",
                "tone": "from-sky-500 to-indigo-500",
                "is_active": True,
                "order_index": 8,
            },
            {
                "id": "jumla-ustasi",
                "title": "Jumla ustasi",
                "desc": "Aralash so'zlarni to'g'ri tartiblab jumla hosil qiling.",
                "players": "1.1k+",
                "level": "O'rta",
                "duration": "8 daqiqa",
                "category": "Tillar",
                "tone": "from-purple-500 to-fuchsia-500",
                "is_active": True,
                "order_index": 9,
            },
            {
                "id": "ranglar-olami",
                "title": "Ranglar olami",
                "desc": "Rang va shakllarni tanish bo'yicha qiziqarli mini-topshiriq.",
                "players": "940+",
                "level": "Oddiy",
                "duration": "6 daqiqa",
                "category": "Ijodiy",
                "tone": "from-amber-500 to-orange-500",
                "is_active": True,
                "order_index": 10,
            },
            {
                "id": "xotira-zanjiri",
                "title": "Xotira zanjiri",
                "desc": "Ketma-ketlikni eslab qolish orqali e'tiborni kuchaytiring.",
                "players": "1.0k+",
                "level": "O'rta",
                "duration": "7 daqiqa",
                "category": "Mantiq",
                "tone": "from-emerald-500 to-teal-500",
                "is_active": True,
                "order_index": 11,
            },
            {
                "id": "box-jang",
                "title": "Math Box jang",
                "desc": "Kim tez va to'g'ri topsa, o'sha birinchi zarba beradigan matematik duel.",
                "players": "1.0k+",
                "level": "O'rta",
                "duration": "8 daqiqa",
                "category": "Matematika",
                "tone": "from-cyan-500 to-blue-500",
                "is_active": True,
                "order_index": 12,
            },
            {
                "id": "car-racing-math",
                "title": "Car Racing Math",
                "desc": "Misolni kim tez va to'g'ri topsa, o'sha mashinasi oldinga yuradigan poyga.",
                "players": "920+",
                "level": "O'rta",
                "duration": "9 daqiqa",
                "category": "Matematika",
                "tone": "from-sky-500 to-blue-600",
                "is_active": True,
                "order_index": 13,
            },
            {
                "id": "jumanji",
                "title": "Jumanji board quest",
                "desc": "Savolga javob berib zar tashlang va 30 qadamli taxtada finishga birinchi yeting.",
                "players": "860+",
                "level": "O'rta",
                "duration": "10 daqiqa",
                "category": "Jamoaviy",
                "tone": "from-emerald-600 to-amber-600",
                "is_active": True,
                "order_index": 14,
            },
            {
                "id": "quiz-battle",
                "title": "Quiz Battle",
                "desc": "Bamboozle uslubida 2-3 jamoali viktorina: kartalar, random eventlar va jonli scoreboard.",
                "players": "1.5k+",
                "level": "O'rta",
                "duration": "10 daqiqa",
                "category": "Jamoaviy",
                "tone": "from-cyan-500 to-indigo-500",
                "is_active": True,
                "order_index": 15,
            },
            {
                "id": "topqirlik-kvest",
                "title": "Topqirlik kvesti",
                "desc": "Ketma-ket jumboqlar bilan kichik sarguzasht rejimi.",
                "players": "870+",
                "level": "Murakkab",
                "duration": "12 daqiqa",
                "category": "Ijodiy",
                "tone": "from-fuchsia-500 to-indigo-500",
                "is_active": True,
                "order_index": 16,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_questions_game_id", table_name="questions")
    op.drop_index("ix_questions_teacher_id", table_name="questions")
    op.drop_table("questions")
    op.drop_table("games")
    op.drop_index("ix_users_firebase_uid", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    question_type = sa.Enum("multiple_choice", "open_text", name="question_type")
    user_role = sa.Enum("admin", "teacher", name="user_role")
    question_type.drop(op.get_bind(), checkfirst=True)
    user_role.drop(op.get_bind(), checkfirst=True)
