from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database.session import get_db
from ..services.compare_service import CompareService
from pydantic import BaseModel

class CompareRequest(BaseModel):
    tool_ids: list[int]
    query: str | None = None

router = APIRouter(prefix="/compare", tags=["compare"])


@router.post("", response_model=dict)
async def compare(payload: CompareRequest, db: AsyncSession = Depends(get_db)):
    if not payload.tool_ids:
        raise HTTPException(status_code=400, detail="At least one tool ID is required")
    base_result = await CompareService.compare_tools(db, payload.tool_ids)
    if payload.query:
        context_result = CompareService.compare_with_context([str(id) for id in payload.tool_ids], payload.query)
        base_result["context"] = context_result
    return base_result
