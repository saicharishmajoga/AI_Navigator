from fastapi import APIRouter
from .tools import router as tools_router
from .compare import router as compare_router
from .chatbot import router as chat_router
from .documents import router as documents_router
from .bookmarks import router as bookmarks_router
from .visited import router as visited_router
from ..auth.routers import router as auth_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(tools_router)
api_router.include_router(compare_router)
api_router.include_router(chat_router)
api_router.include_router(documents_router)
api_router.include_router(bookmarks_router)
api_router.include_router(visited_router)
