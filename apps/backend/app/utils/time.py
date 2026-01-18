from datetime import datetime, timezone

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def clamp_nonnegative_seconds(seconds: int) -> int:
    return max(0, int(seconds))


def seconds_between(started_at: datetime, ended_at: datetime) -> int:
    delta = ended_at - started_at
    return clamp_nonnegative_seconds(int(delta.total_seconds()))
