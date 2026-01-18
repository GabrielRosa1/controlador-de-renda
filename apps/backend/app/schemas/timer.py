from datetime import datetime
from pydantic import BaseModel


class TimerStartResponse(BaseModel):
    status: str  # "started" | "already_running"
    entry_id: str | None = None
    started_at: datetime | None = None


class TimerStopResponse(BaseModel):
    status: str  # "stopped" | "not_running"
    entry_id: str | None = None
    ended_at: datetime | None = None


class TimerStateResponse(BaseModel):
    running: bool
    started_at: datetime | None = None
    total_closed_seconds: int

    is_finished: bool
    blocked_reason: str | None = None  # "CLOSED" | "EXPIRED" | None

    end_date: str | None = None        # YYYY-MM-DD (pra UI)
    closed_at: datetime | None = None  # pra UI


class TimeEntryItem(BaseModel):
    id: str
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int


class TimeEntriesResponse(BaseModel):
    items: list[TimeEntryItem]