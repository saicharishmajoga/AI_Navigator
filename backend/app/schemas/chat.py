from pydantic import BaseModel, Field
from typing import List


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=2)
    history: List[str] = []


class ChatResponse(BaseModel):
    query: str
    answer: str
    sources: List[str] = []
