from pydantic import BaseModel, Field

class WorkCloseRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=120)

class WorkCloseResponse(BaseModel):
    id: str
    closed_at: str
    closed_reason: str | None = None
