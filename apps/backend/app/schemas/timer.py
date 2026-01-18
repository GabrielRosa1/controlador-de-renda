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
