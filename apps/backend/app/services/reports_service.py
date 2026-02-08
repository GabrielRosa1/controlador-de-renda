from dataclasses import dataclass
from datetime import datetime, date, timezone, timedelta
from typing import Dict, List

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.db.models.work import Work
from app.db.models.time_entry import TimeEntry
from app.utils.time import seconds_between
from app.utils.money import cents_from_hourly_rate


def _to_date(s: str) -> date:
    # s = "YYYY-MM-DD"
    return date.fromisoformat(s)


def _start_of_day_utc(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=timezone.utc)


def _end_of_day_utc(d: date) -> datetime:
    return _start_of_day_utc(d) + timedelta(days=1)


@dataclass
class WorkSummary:
    work_id: str
    title: str
    sprint_name: str
    total_seconds: int
    total_earned_cents: int
    currency: str


def get_summary(db: Session, *, user_id: str, date_from: str, date_to: str) -> Dict:
    """
    date_from/date_to em YYYY-MM-DD. Intervalo inclusivo.
    Regras:
    - Considera sessões fechadas (ended_at != NULL)
    - Filtra entradas cuja started_at esteja dentro do range (MVP simples)
      (Se quiser lidar com sessões que atravessam dias, a gente melhora depois.)
    """
    d_from = _to_date(date_from)
    d_to = _to_date(date_to)

    start_dt = datetime(d_from.year, d_from.month, d_from.day, tzinfo=timezone.utc)
    end_dt = datetime(d_to.year, d_to.month, d_to.day, tzinfo=timezone.utc)  # 00:00 do dia 'to'
    end_dt = end_dt.replace(hour=23, minute=59, second=59)

    works = db.query(Work).filter(Work.user_id == user_id).all()
    work_map = {w.id: w for w in works}

    entries = (
        db.query(TimeEntry)
        .join(Work, Work.id == TimeEntry.work_id)
        .filter(
            Work.user_id == user_id,
            TimeEntry.deleted_at.is_(None),
            TimeEntry.ended_at.is_not(None),
            and_(TimeEntry.started_at >= start_dt, TimeEntry.started_at <= end_dt),
        )
        .all()
    )

    per_work_seconds: Dict[str, int] = {}
    for e in entries:
        sec = seconds_between(e.started_at, e.ended_at)  # type: ignore[arg-type]
        per_work_seconds[e.work_id] = per_work_seconds.get(e.work_id, 0) + sec

    items: List[WorkSummary] = []
    total_seconds = 0
    total_earned_cents = 0

    for work_id, sec in per_work_seconds.items():
        w = work_map.get(work_id)
        if not w:
            continue
        earned = cents_from_hourly_rate(w.hourly_rate_cents, sec)
        items.append(
            WorkSummary(
                work_id=w.id,
                title=w.title,
                sprint_name=w.sprint_name,
                total_seconds=sec,
                total_earned_cents=earned,
                currency=w.currency,
            )
        )
        total_seconds += sec
        total_earned_cents += earned

    # Ordena por ganho desc
    items.sort(key=lambda x: x.total_earned_cents, reverse=True)

    return {
        "from": date_from,
        "to": date_to,
        "total_seconds": total_seconds,
        "total_earned_cents": total_earned_cents,
        "currency": "BRL",  
        "by_work": [
            {
                "work_id": i.work_id,
                "title": i.title,
                "sprint_name": i.sprint_name,
                "total_seconds": i.total_seconds,
                "total_earned_cents": i.total_earned_cents,
                "currency": i.currency,
            }
            for i in items
        ],
    }
