def cents_from_hourly_rate(rate_per_hour_cents: int, seconds: int) -> int:
    """
    Converte segundos trabalhados em centavos, usando rate por hora em centavos.
    Arredonda pro inteiro mais próximo (você pode preferir floor).
    """
    if seconds <= 0:
        return 0
    return int(round(rate_per_hour_cents * (seconds / 3600.0)))


def safe_int(v, default: int = 0) -> int:
    try:
        return int(v)
    except Exception:
        return default
