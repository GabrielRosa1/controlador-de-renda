from datetime import datetime, timezone, date
try:
    from zoneinfo import ZoneInfo
    BR_TZ = ZoneInfo("America/Sao_Paulo")
except Exception:
    BR_TZ = None

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def today_iso_br() -> str:
    # retorna YYYY-MM-DD no fuso BR
    if BR_TZ:
        d = datetime.now(BR_TZ).date()
    else:
        d = date.today()
    return d.isoformat()


def clamp_nonnegative_seconds(seconds: int) -> int:
    return max(0, int(seconds))


def seconds_between(started_at: datetime, ended_at: datetime) -> int:
    delta = ended_at - started_at
    return clamp_nonnegative_seconds(int(delta.total_seconds()))
