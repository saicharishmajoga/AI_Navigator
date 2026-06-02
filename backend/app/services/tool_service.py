from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.tool import Tool
from ..schemas.tool import ToolCreate, ToolUpdate


class ToolService:
    @staticmethod
    async def list_tools(db: AsyncSession) -> list[Tool]:
        result = await db.execute(select(Tool))
        return result.scalars().all()

    @staticmethod
    async def get_tool(db: AsyncSession, tool_id: int) -> Tool | None:
        result = await db.execute(select(Tool).filter(Tool.id == tool_id))
        return result.scalars().first()

    @staticmethod
    async def create_tool(db: AsyncSession, payload: ToolCreate) -> Tool:
        tool = Tool(**payload.model_dump())
        db.add(tool)
        await db.commit()
        await db.refresh(tool)
        return tool

    @staticmethod
    async def update_tool(db: AsyncSession, tool_id: int, payload: ToolUpdate) -> Tool | None:
        statement = update(Tool).where(Tool.id == tool_id).values(**payload.model_dump(exclude_none=True)).returning(Tool)
        result = await db.execute(statement)
        tool = result.scalars().first()
        if tool:
            await db.commit()
            await db.refresh(tool)
        return tool

    @staticmethod
    async def delete_tool(db: AsyncSession, tool_id: int) -> bool:
        statement = delete(Tool).where(Tool.id == tool_id)
        await db.execute(statement)
        await db.commit()
        return True
