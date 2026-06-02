from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .config import settings


def register_middleware(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:8080",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:8000",
            "https://ai-navigator-1-h3xy.onrender.com",
        ],
        allow_origin_regex="https://.*\\.onrender\\.com|http://localhost:\\d+|http://127\\.0.0\\.1:\\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


async def http_exception_handler(request: Request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail, "detail": exc.detail},
    )


async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "An unexpected error occurred."},
    )
