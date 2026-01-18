from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.db.models.user import User
from app.schemas.timer import TimerStartResponse, TimerStopResponse
from app.services.timer_service import start_timer, stop_timer

router = APIRouter(prefix="/works", tags=["timer"])


@router.post("/{work_id}/timer/start", response_model=TimerStartResponse)
def timer_start(
    work_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry, created = start_timer(db, work_id=work_id, user_id=current_user.id)
    status = "started" if created else "already_running"
    return TimerStartResponse(status=status, entry_id=entry.id, started_at=entry.started_at)


@router.post("/{work_id}/timer/stop", response_model=TimerStopResponse)
def timer_stop(
    work_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = stop_timer(db, work_id=work_id, user_id=current_user.id)
    if entry is None:
        return TimerStopResponse(status="not_running")
    return TimerStopResponse(status="stopped", entry_id=entry.id, ended_at=entry.ended_at)
