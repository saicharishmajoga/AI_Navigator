from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    tool_id: int


class BookmarkRead(BaseModel):
    id: int
    user_id: int
    tool_id: int

    model_config = {"from_attributes": True}
