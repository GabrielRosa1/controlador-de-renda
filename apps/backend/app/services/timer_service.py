from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.errors import not_found
from app.db.models.work import Work
from app.db.models.time_entry import TimeEntry
from app.utils.time import seconds_between


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_work_or_404(db: Session, *, work_id: str, user_id: str) -> Work:
    w = db.query(Work).filter(Work.id == work_id, Work.user_id == user_id).first()
    if not w:
        raise not_found("Work not found")
    return w


def get_open_entry(db: Session, *, work_id: str) -> TimeEntry | None:
    return db.query(TimeEntry).filter(TimeEntry.work_id == work_id, TimeEntry.ended_at.is_(None)).first()


def start_timer(db: Session, *, work_id: str, user_id: str) -> tuple[TimeEntry, bool]:
    _ = get_work_or_404(db, work_id=work_id, user_id=user_id)

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
        .filter(TimeEntry.work_id == work_id, TimeEntry.ended_at.is_not(None))
        .all()
    )
    total = 0
    for e in rows:
        total += seconds_between(e.started_at, e.ended_at)  # type: ignore[arg-type]
    return total


def get_timer_state(db: Session, *, work_id: str, user_id: str) -> dict:
    _ = get_work_or_404(db, work_id=work_id, user_id=user_id)

    open_entry = get_open_entry(db, work_id=work_id)
    total_closed = get_total_closed_seconds(db, work_id=work_id)

    return {
        "running": open_entry is not None,
        "started_at": open_entry.started_at if open_entry else None,
        "total_closed_seconds": total_closed,
    }


def list_entries(db: Session, *, work_id: str, user_id: str, limit: int = 200) -> list[dict]:
    _ = get_work_or_404(db, work_id=work_id, user_id=user_id)

    entries = (
        db.query(TimeEntry)
        .filter(TimeEntry.work_id == work_id)
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