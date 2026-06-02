from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..database.session import get_db
from ..services.bookmark_service import BookmarkService
from ..schemas.bookmark import BookmarkCreate, BookmarkRead
from ..auth.dependencies import get_current_user
from ..models.user import User

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.post("", response_model=BookmarkRead, status_code=status.HTTP_201_CREATED)
async def add_bookmark(payload: BookmarkCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await BookmarkService.add_bookmark(db, current_user.id, payload)


@router.get("", response_model=list[BookmarkRead])
async def list_bookmarks(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await BookmarkService.list_bookmarks(db, current_user.id)


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_bookmark(bookmark_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await BookmarkService.remove_bookmark(db, bookmark_id, current_user.id)
