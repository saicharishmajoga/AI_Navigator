import asyncio
from sqlalchemy import select
from app.database.session import AsyncSessionLocal, engine
from app.models.user import User

async def test_db():
    db = AsyncSessionLocal()
    try:
        stmt = select(User).limit(1)
        res = await db.execute(stmt)
        user = res.scalars().first()
        print("Database query succeeded! The users table is fully operational.")
    except Exception as e:
        print(f"Database verification failed: {e}")
    finally:
        await db.close()
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_db())
