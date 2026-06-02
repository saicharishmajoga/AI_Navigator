from sqlalchemy.ext.asyncio import AsyncSession
from ..models.chat_history import ChatHistory
from ..schemas.chat import ChatRequest


class ChatService:
    @staticmethod
    async def save_history(db: AsyncSession, user_id: int, question: str, response: str) -> ChatHistory:
        history = ChatHistory(user_id=user_id, question=question, response=response)
        db.add(history)
        await db.commit()
        await db.refresh(history)
        return history

    @staticmethod
    async def ask_chat_stream(request: ChatRequest):
        """Yield real-time LLM streaming chunks from the RAG pipeline."""
        from ..vectorstore.rag import ask_rag_stream
        
        async for chunk in ask_rag_stream(request.query):
            yield chunk
