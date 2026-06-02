from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


class ToolBase(BaseModel):
    name: str = Field(..., min_length=2)
    slug: str = Field(..., min_length=2)
    description: str | None = None
    category_id: int | None = None
    logo_url: HttpUrl | None = None
    pricing_type: str | None = None
    official_website: HttpUrl | None = None


class ToolCreate(ToolBase):
    pass


class ToolUpdate(ToolBase):
    pass


class ToolRead(ToolBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
