from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database.session import get_db
from ..services.tool_service import ToolService
from ..schemas.tool import ToolCreate, ToolUpdate, ToolRead
from ..auth.dependencies import get_current_user
from ..models.user import User

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=list[ToolRead])
async def list_tools(db: AsyncSession = Depends(get_db)):
    return await ToolService.list_tools(db)


@router.get("/{tool_id}", response_model=ToolRead)
async def get_tool(tool_id: int, db: AsyncSession = Depends(get_db)):
    tool = await ToolService.get_tool(db, tool_id)
    if not tool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found")
    return tool


@router.post("", response_model=ToolRead, status_code=status.HTTP_201_CREATED)
async def create_tool(payload: ToolCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await ToolService.create_tool(db, payload)


@router.put("/{tool_id}", response_model=ToolRead)
async def update_tool(tool_id: int, payload: ToolUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    tool = await ToolService.update_tool(db, tool_id, payload)
    if not tool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found")
    return tool


@router.delete("/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tool(tool_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await ToolService.delete_tool(db, tool_id)
