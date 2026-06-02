from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..database.session import get_db
from ..services.visited_service import VisitedService
from ..schemas.visited import VisitedCreate, VisitedRead
from ..auth.dependencies import get_current_user
from ..models.user import User

router = APIRouter(prefix="/visited", tags=["visited"])


@router.post("", response_model=VisitedRead, status_code=status.HTTP_201_CREATED)
async def record_visit(payload: VisitedCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await VisitedService.record_visit(db, current_user.id, payload.tool_id)


@router.get("", response_model=list[VisitedRead])
async def get_visited(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await VisitedService.list_visited(db, current_user.id)
