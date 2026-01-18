from datetime import datetime, timezone
from app.services.timer_service import get_work_or_404, get_open_entry
from sqlalchemy.orm import Session
from app.db.models.work import Work


def close_work(db: Session, *, work_id: str, user_id: str, reason: str | None = None) -> Work:
    w = get_work_or_404(db, work_id=work_id, user_id=user_id)

    # se tiver timer aberto, fecha automaticamente
    open_entry = get_open_entry(db, work_id=work_id)
    if open_entry:
        open_entry.ended_at = datetime.now(timezone.utc)

    w.closed_at = datetime.now(timezone.utc)
    w.closed_reason = reason

    db.commit()
    db.refresh(w)
    return w
