from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.tool import Tool
from ..schemas.chat import ChatRequest



class CompareService:
    @staticmethod
    async def compare_tools(db: AsyncSession, tool_ids: list[int]) -> dict:
        statement = select(Tool).filter(Tool.id.in_(tool_ids))
        result = await db.execute(statement)
        tools = result.scalars().all()
        items = [
            {
                "id": tool.id,
                "name": tool.name,
                "description": tool.description,
                "category_id": tool.category_id,
                "pricing_type": tool.pricing_type,
                "official_website": tool.official_website,
            }
            for tool in tools
        ]
        return {
            "tools": items,
            "summary": f"Comparison of {len(items)} tools against platform metadata.",
        }

    @staticmethod
    def compare_with_context(tool_names: list[str], query: str) -> dict:
        from ..vectorstore.rag import retrieve_relevant_documents

        chunks = retrieve_relevant_documents(query)
        context = [chunk.page_content[:240] for chunk in chunks]
        return {
            "tools": tool_names,
            "contextual_insights": context,
            "message": "Context-aware comparison prepared using uploaded documentation and tool metadata.",
        }
