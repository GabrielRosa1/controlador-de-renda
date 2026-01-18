from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.errors import bad_request
from app.db.models.user import User
from app.db.models.work import Work
from app.schemas.work import WorkCreateRequest, WorkCreateResponse, WorksListResponse, WorkListItem

router = APIRouter(prefix="/works", tags=["works"])


@router.post("", response_model=WorkCreateResponse)
def create_work(
    payload: WorkCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.start_date > payload.end_date:
        raise bad_request("start_date cannot be after end_date")

    w = Work(
        user_id=current_user.id,
        title=payload.title,
        sprint_name=payload.sprint_name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        hourly_rate_cents=payload.hourly_rate_cents,
        currency=payload.currency,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return WorkCreateResponse(id=w.id)


@router.get("", response_model=WorksListResponse)
def list_works(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    works = (
        db.query(Work)
        .filter(Work.user_id == current_user.id)
        .order_by(Work.start_date.desc())
        .all()
    )

    return WorksListResponse(
        items=[
            WorkListItem(
                id=w.id,
                title=w.title,
                sprint_name=w.sprint_name,
                hourly_rate_cents=w.hourly_rate_cents,
                currency=w.currency,
            )
            for w in works
        ]
    )
