from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.errors import not_found, bad_request
from app.utils.time import today_iso_br
from app.db.models.work import Work
from app.db.models.time_entry import TimeEntry
from app.utils.time import seconds_between
from fastapi import HTTPException


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_work_or_404(db: Session, *, work_id: str, user_id: str) -> Work:
    w = db.query(Work).filter(Work.id == work_id, Work.user_id == user_id).first()
    if not w:
        raise not_found("Work not found")
    return w


def get_open_entry(db: Session, *, work_id: str) -> TimeEntry | None:
    return (
        db.query(TimeEntry)
        .filter(
            TimeEntry.work_id == work_id,
            TimeEntry.ended_at.is_(None),
            TimeEntry.deleted_at.is_(None),
        )
        .first()
    )


def start_timer(db: Session, *, work_id: str, user_id: str) -> tuple[TimeEntry, bool]:
    w = get_work_or_404(db, work_id=work_id, user_id=user_id)
    ensure_work_is_active(w)

    open_entry = get_open_entry(db, work_id=work_id)
    if open_entry:
        return open_entry, False

    e = TimeEntry(work_id=work_id, started_at=_utcnow(), ended_at=None)
    db.add(e)
    db.commit()
    db.refresh(e)
    return e, True


def stop_timer(db: Session, *, work_id: str, user_id: str) -> TimeEntry | None:
    _ = get_work_or_404(db, work_id=work_id, user_id=user_id)

    open_entry = get_open_entry(db, work_id=work_id)
    if not open_entry:
        return None

    open_entry.ended_at = _utcnow()
    db.commit()
    db.refresh(open_entry)
    return open_entry


def get_total_closed_seconds(db: Session, *, work_id: str) -> int:
    rows = (
        db.query(TimeEntry)
        .filter(
            TimeEntry.work_id == work_id,
            TimeEntry.ended_at.is_not(None),
            TimeEntry.deleted_at.is_(None),
        )
        .all()
    )

    total = 0
    for e in rows:
        total += seconds_between(e.started_at, e.ended_at)  # type: ignore[arg-type]
    return total


def get_timer_state(db: Session, *, work_id: str, user_id: str) -> dict:
    w = get_work_or_404(db, work_id=work_id, user_id=user_id)

    open_entry = get_open_entry(db, work_id=work_id)
    total_closed = get_total_closed_seconds(db, work_id=work_id)

    blocked_reason: str | None = None
    is_finished = False

    if w.closed_at is not None:
        is_finished = True
        blocked_reason = "CLOSED"
    elif today_iso_br() > w.end_date:
        is_finished = True
        blocked_reason = "EXPIRED"

    return {
        "running": open_entry is not None,
        "started_at": open_entry.started_at if open_entry else None,
        "total_closed_seconds": total_closed,
        "is_finished": is_finished,
        "blocked_reason": blocked_reason,
        "end_date": w.end_date,
        "closed_at": w.closed_at,
    }


def list_entries(db: Session, *, work_id: str, user_id: str, limit: int = 200) -> list[dict]:
    _ = get_work_or_404(db, work_id=work_id, user_id=user_id)

    entries = (
        db.query(TimeEntry)
        .filter(
            TimeEntry.work_id == work_id,
            TimeEntry.deleted_at.is_(None),
        )
        .order_by(TimeEntry.started_at.desc())
        .limit(limit)
        .all()
    )

    items: list[dict] = []
    for e in entries:
        duration = 0
        if e.ended_at is not None:
            duration = seconds_between(e.started_at, e.ended_at)
        items.append(
            {
                "id": e.id,
                "started_at": e.started_at,
                "ended_at": e.ended_at,
                "duration_seconds": duration,
            }
        )
    return items


def ensure_work_is_active(w: Work) -> None:
    if w.closed_at is not None:
        raise bad_request("esse trabalho já terminou")
    if today_iso_br() > w.end_date:
        raise bad_request("esse trabalho já terminou")


def soft_delete_time_entry(db: Session, *, work_id: str, entry_id: str, user_id: str) -> None:
    # garante que o work é do user
    _ = get_work_or_404(db, work_id=work_id, user_id=user_id)

    entry = (
        db.query(TimeEntry)
        .filter(
            TimeEntry.id == entry_id,
            TimeEntry.work_id == work_id,
            TimeEntry.deleted_at.is_(None),
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="time entry não encontrado")
    if entry.ended_at is None:
        raise HTTPException(status_code=400, detail="não é possível apagar uma entry em execução")


    entry.deleted_at = _utcnow()
    db.commit()
