from pydantic import BaseModel, Field


class WorkCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    sprint_name: str = Field(min_length=1, max_length=100)
    start_date: str = Field(min_length=10, max_length=10)  # YYYY-MM-DD
    end_date: str = Field(min_length=10, max_length=10)
    hourly_rate_cents: int = Field(ge=0, le=10_000_000)
    currency: str = Field(default="BRL", min_length=3, max_length=10)


class WorkCreateResponse(BaseModel):
    id: str


class WorkListItem(BaseModel):
    id: str
    title: str
    sprint_name: str
    hourly_rate_cents: int
    currency: str


class WorksListResponse(BaseModel):
    items: list[WorkListItem]
