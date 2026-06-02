from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.bookmark import Bookmark
from ..schemas.bookmark import BookmarkCreate


class BookmarkService:
    @staticmethod
    async def add_bookmark(db: AsyncSession, user_id: int, payload: BookmarkCreate) -> Bookmark:
        bookmark = Bookmark(user_id=user_id, tool_id=payload.tool_id)
        db.add(bookmark)
        await db.commit()
        await db.refresh(bookmark)
        return bookmark

    @staticmethod
    async def list_bookmarks(db: AsyncSession, user_id: int) -> list[Bookmark]:
        result = await db.execute(select(Bookmark).filter(Bookmark.user_id == user_id))
        return result.scalars().all()

    @staticmethod
    async def remove_bookmark(db: AsyncSession, bookmark_id: int, user_id: int) -> bool:
        statement = delete(Bookmark).where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id)
        await db.execute(statement)
        await db.commit()
        return True
