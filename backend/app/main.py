from fastapi import FastAPI
from .api import api_router
from .core.middleware import register_middleware, http_exception_handler, generic_exception_handler
from .core.exceptions import UnauthorizedException, ForbiddenException
from .database.session import init_db, AsyncSessionLocal

app = FastAPI(
    title="AI Navigator Backend",
    description="Professional AI learning and discovery backend with RAG, vector search, and role-based auth.",
    version="0.1.0",
)

register_middleware(app)
app.include_router(api_router)

app.add_exception_handler(UnauthorizedException, http_exception_handler)
app.add_exception_handler(ForbiddenException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


@app.on_event("startup")
async def on_startup():
    await init_db()
    # Check if database is empty and seed it
    try:
        from .database.seed import seed_database_on_startup
        from .models.tool import Tool
        from sqlalchemy import select
        
        async with AsyncSessionLocal() as session:
            stmt = select(Tool)
            res = await session.execute(stmt)
            all_tools = res.scalars().all()
            if not all_tools:
                await seed_database_on_startup(session)
    except Exception as e:
        print(f"Error checking or seeding database on startup: {e}")


@app.get("/", summary="Health check")
def health_check():
    return {"success": True, "message": "AI Navigator backend is running."}
