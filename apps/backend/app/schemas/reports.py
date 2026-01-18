from pydantic import BaseModel

class WorkSummaryItem(BaseModel):
    work_id: str
    title: str
    sprint_name: str
    total_seconds: int
    total_earned_cents: int
    currency: str

class SummaryResponse(BaseModel):
    from_: str
    to: str
    total_seconds: int
    total_earned_cents: int
    currency: str
    by_work: list[WorkSummaryItem]
