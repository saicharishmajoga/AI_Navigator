from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.visited_tool import VisitedTool


class VisitedService:
    @staticmethod
    async def list_visited(db: AsyncSession, user_id: int) -> list[VisitedTool]:
        result = await db.execute(select(VisitedTool).filter(VisitedTool.user_id == user_id).order_by(VisitedTool.visited_at.desc()))
        return result.scalars().all()

    @staticmethod
    async def record_visit(db: AsyncSession, user_id: int, tool_id: int) -> VisitedTool:
        statement = select(VisitedTool).filter(VisitedTool.user_id == user_id, VisitedTool.tool_id == tool_id)
        result = await db.execute(statement)
        visit = result.scalars().first()
        if visit:
            visit.visited_at = datetime.utcnow()
            db.add(visit)
        else:
            visit = VisitedTool(user_id=user_id, tool_id=tool_id)
            db.add(visit)
        await db.commit()
        await db.refresh(visit)
        return visit
