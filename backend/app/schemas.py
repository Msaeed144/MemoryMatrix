from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


def normalize_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone.strip() if ch.isdigit())
    if digits.startswith("98") and len(digits) == 12:
        digits = "0" + digits[2:]
    if digits.startswith("9") and len(digits) == 10:
        digits = "0" + digits
    return digits


class SignupRequest(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    phone: str = Field(min_length=8, max_length=20)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: object) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, value: str) -> str:
        normalized = normalize_phone(value)
        if len(normalized) < 10:
            raise ValueError("Phone number is too short")
        return normalized

class LoginRequest(BaseModel):
    phone: str = Field(min_length=8, max_length=20)
    name: str | None = Field(default=None, max_length=100)

    @field_validator("name", mode="before")
    @classmethod
    def strip_login_name(cls, value: object) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, value: str) -> str:
        normalized = normalize_phone(value)
        if len(normalized) < 10:
            raise ValueError("Phone number is too short")
        return normalized


class UserOut(BaseModel):
    id: UUID
    name: str
    phone: str
    best_score_match: int
    best_score_matrix: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ScoreCreate(BaseModel):
    game_type: Literal["match", "matrix"]
    score: int = Field(ge=0)

    correct_answers: int | None = Field(default=None, ge=0)
    wrong_answers: int | None = Field(default=None, ge=0)
    game_duration: int | None = Field(default=None, ge=0)

    level: int | None = Field(default=None, ge=0)
    difficulty: str | None = Field(default=None, max_length=32)
    player_mode: str | None = Field(default=None, max_length=32)
    game_mode: str | None = Field(default=None, max_length=32)
    time_mode: str | None = Field(default=None, max_length=32)

    @model_validator(mode="after")
    def require_game_fields(self) -> "ScoreCreate":
        if self.game_type == "match":
            if self.correct_answers is None or self.wrong_answers is None:
                raise ValueError("Match scores require correct_answers and wrong_answers")
            if self.game_duration is None:
                raise ValueError("Match scores require game_duration")
        elif self.game_type == "matrix":
            if self.level is None:
                raise ValueError("Matrix scores require level")
        return self


class ScoreOut(BaseModel):
    id: UUID
    user_id: UUID
    game_type: str
    score: int
    correct_answers: int | None = None
    wrong_answers: int | None = None
    game_duration: int | None = None
    level: int | None = None
    difficulty: str | None = None
    player_mode: str | None = None
    game_mode: str | None = None
    time_mode: str | None = None
    created_at: datetime
    player_name: str | None = None
    player_phone: str | None = None

    model_config = {"from_attributes": True}


def leaderboard_label(name: str | None, phone: str | None) -> str:
    """Prefer a real name; fall back to phone; show both when useful."""
    cleaned = (name or "").strip()
    phone_val = (phone or "").strip()
    if cleaned and cleaned != "Player" and cleaned != phone_val:
        return f"{cleaned} · {phone_val}" if phone_val else cleaned
    return phone_val or cleaned or "Player"
