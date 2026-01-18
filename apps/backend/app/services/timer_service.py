from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.errors import not_found
from app.db.models.work import Work
from app.db.models.time_entry import TimeEntry


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
