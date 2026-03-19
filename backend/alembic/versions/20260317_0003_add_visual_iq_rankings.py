"""Add visual IQ rankings table.

Revision ID: 20260317_0003
Revises: 20260304_0002
Create Date: 2026-03-17 19:10:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260317_0003"
down_revision: str | None = "20260304_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "visual_iq_rankings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("game_id", sa.String(length=100), nullable=False),
        sa.Column("player_name", sa.String(length=120), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("iq_score", sa.Integer(), nullable=False),
        sa.Column("percentile", sa.Integer(), nullable=False),
        sa.Column("correct_answers", sa.Integer(), nullable=False),
        sa.Column("round_count", sa.Integer(), nullable=False),
        sa.Column("accuracy_percent", sa.Integer(), nullable=False),
        sa.Column("speed_percent", sa.Integer(), nullable=False),
        sa.Column("total_time_seconds", sa.Integer(), nullable=False),
        sa.Column("difficulty_label", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_visual_iq_rankings_game_id", "visual_iq_rankings", ["game_id"], unique=False)
    op.create_index("ix_visual_iq_rankings_player_name", "visual_iq_rankings", ["player_name"], unique=False)
    op.create_index("ix_visual_iq_rankings_iq_score", "visual_iq_rankings", ["iq_score"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_visual_iq_rankings_iq_score", table_name="visual_iq_rankings")
    op.drop_index("ix_visual_iq_rankings_player_name", table_name="visual_iq_rankings")
    op.drop_index("ix_visual_iq_rankings_game_id", table_name="visual_iq_rankings")
    op.drop_table("visual_iq_rankings")
