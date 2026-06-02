from pydantic import BaseModel
from datetime import datetime


class VisitedCreate(BaseModel):
    tool_id: int


class VisitedRead(BaseModel):
    id: int
    user_id: int
    tool_id: int
    visited_at: datetime

    model_config = {"from_attributes": True}
