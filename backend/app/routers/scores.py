from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import GameType, Score, User
from app.schemas import ScoreCreate, ScoreOut, leaderboard_label

router = APIRouter(prefix="/scores", tags=["scores"])


def _score_to_out(
    score: Score,
    player_name: str | None = None,
    player_phone: str | None = None,
) -> ScoreOut:
    label = leaderboard_label(player_name, player_phone)
    return ScoreOut(
        id=score.id,
        user_id=score.user_id,
        game_type=score.game_type.value if hasattr(score.game_type, "value") else str(score.game_type),
        score=score.score,
        correct_answers=score.correct_answers,
        wrong_answers=score.wrong_answers,
        game_duration=score.game_duration,
        level=score.level,
        difficulty=score.difficulty,
        player_mode=score.player_mode,
        game_mode=score.game_mode,
        time_mode=score.time_mode,
        created_at=score.created_at,
        player_name=label,
        player_phone=player_phone,
    )


@router.post("/", response_model=ScoreOut, status_code=status.HTTP_201_CREATED)
def create_score(
    payload: ScoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScoreOut:
    game_type = GameType(payload.game_type)

    score = Score(
        user_id=current_user.id,
        game_type=game_type,
        score=payload.score,
        correct_answers=payload.correct_answers,
        wrong_answers=payload.wrong_answers,
        game_duration=payload.game_duration,
        level=payload.level,
        difficulty=payload.difficulty,
        player_mode=payload.player_mode,
        game_mode=payload.game_mode,
        time_mode=payload.time_mode,
    )
    db.add(score)

    if game_type == GameType.match and payload.score > current_user.best_score_match:
        current_user.best_score_match = payload.score
    elif game_type == GameType.matrix and payload.score > current_user.best_score_matrix:
        current_user.best_score_matrix = payload.score

    db.commit()
    db.refresh(score)

    return _score_to_out(score, player_name=current_user.name, player_phone=current_user.phone)


@router.get("/me", response_model=list[ScoreOut])
def my_scores(
    game: str | None = Query(default=None, pattern="^(match|matrix)$"),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ScoreOut]:
    query = db.query(Score).filter(Score.user_id == current_user.id)
    if game:
        query = query.filter(Score.game_type == GameType(game))

    rows = query.order_by(Score.created_at.desc()).limit(limit).all()
    return [
        _score_to_out(row, player_name=current_user.name, player_phone=current_user.phone)
        for row in rows
    ]


@router.get("/leaderboard", response_model=list[ScoreOut])
def leaderboard(
    game: str = Query(..., pattern="^(match|matrix)$"),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[ScoreOut]:
    # One row per user: their highest score for this game (Postgres DISTINCT ON)
    rows = (
        db.query(Score)
        .options(joinedload(Score.user))
        .filter(Score.game_type == GameType(game))
        .distinct(Score.user_id)
        .order_by(Score.user_id, Score.score.desc(), Score.created_at.asc())
        .all()
    )
    rows.sort(key=lambda s: (-s.score, s.created_at or 0))
    rows = rows[:limit]
    return [
        _score_to_out(
            row,
            player_name=row.user.name if row.user else None,
            player_phone=row.user.phone if row.user else None,
        )
        for row in rows
    ]
