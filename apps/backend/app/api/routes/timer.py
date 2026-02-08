from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.db.models.user import User
from app.schemas.timer import (
    TimerStartResponse,
    TimerStopResponse,
    TimerStateResponse,
    TimeEntriesResponse,
    TimeEntryItem,
)
from app.services.timer_service import (
    start_timer,
    stop_timer,
    get_timer_state,
    list_entries,
    soft_delete_time_entry,
)

router = APIRouter(prefix="/works", tags=["timer"])


@router.get("/{work_id}/timer", response_model=TimerStateResponse)
def timer_state(
    work_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    state = get_timer_state(db, work_id=work_id, user_id=current_user.id)
    return TimerStateResponse(**state)


@router.get("/{work_id}/entries", response_model=TimeEntriesResponse)
def entries(
    work_id: str,
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = list_entries(db, work_id=work_id, user_id=current_user.id, limit=limit)
    return TimeEntriesResponse(items=[TimeEntryItem(**x) for x in items])


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


@router.delete("/{work_id}/entries/{entry_id}")
def delete_entry(
    work_id: str,
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    soft_delete_time_entry(db, work_id=work_id, entry_id=entry_id, user_id=current_user.id)
    return {"ok": True}
