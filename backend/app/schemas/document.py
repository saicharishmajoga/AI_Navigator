from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


class DocumentRead(BaseModel):
    id: int
    tool_id: int | None
    file_name: str
    file_path: str
    uploaded_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentUploadResponse(BaseModel):
    success: bool = True
    document: DocumentRead
