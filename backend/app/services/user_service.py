from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import User
from ..core.security import hash_password


class UserService:
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
        """Get user by email."""
        statement = select(User).filter(User.email == email.lower())
        result = await db.execute(statement)
        return result.scalars().first()

    @staticmethod
    async def get_all_users(db: AsyncSession) -> list[User]:
        """Get all users."""
        statement = select(User)
        result = await db.execute(statement)
        return result.scalars().all()
