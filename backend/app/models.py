import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GameType(str, enum.Enum):
    match = "match"
    matrix = "matrix"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    best_score_match: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_score_matrix: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    scores: Mapped[list["Score"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    game_type: Mapped[GameType] = mapped_column(
        Enum(GameType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)

    # Memory Match fields
    correct_answers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wrong_answers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    game_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Memory Matrix fields
    level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(32), nullable=True)
    player_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    game_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    time_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="scores")
