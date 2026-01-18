from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.db.models.user import User
from app.services.reports_service import get_summary

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
def summary(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_summary(db, user_id=current_user.id, date_from=date_from, date_to=date_to)

    # Ajuste do campo 'from' para evitar conflito em python
    return {
        "from": data["from"],
        "to": data["to"],
        "total_seconds": data["total_seconds"],
        "total_earned_cents": data["total_earned_cents"],
        "currency": data["currency"],
        "by_work": data["by_work"],
    }
