from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from ..database.session import get_db
from ..services.chat_service import ChatService
from ..schemas.chat import ChatRequest
from ..auth.dependencies import get_optional_current_user
from ..models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_class=StreamingResponse)
async def chat_endpoint(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """
    POST route to ask the RAG assistant. Returns a StreamingResponse
    delivering real-time chunks from the Groq/Chroma DB pipeline.
    """
    async def event_generator():
        accumulated_text = []
        async for chunk in ChatService.ask_chat_stream(payload):
            accumulated_text.append(chunk)
            yield chunk

        # Save to database user history if logged in
        if current_user and accumulated_text:
            full_response = "".join(accumulated_text)
            try:
                await ChatService.save_history(db, current_user.id, payload.query, full_response)
            except Exception as e:
                print(f"Error saving chat history: {e}")

    return StreamingResponse(event_generator(), media_type="text/plain")
