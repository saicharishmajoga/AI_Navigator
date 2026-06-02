from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.security import decode_access_token
from ..database.session import get_db
from ..models.user import User
from ..core.config import settings
from ..core.exceptions import UnauthorizedException, ForbiddenException
from sqlalchemy import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_current_user(token: str | None = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    if not token:
        raise UnauthorizedException()
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
        if user_id is None:
            raise UnauthorizedException()
    except Exception:
        raise UnauthorizedException()

    statement = select(User).filter(User.id == user_id)
    result = await db.execute(statement)
    user = result.scalars().first()
    if not user:
        raise UnauthorizedException()
    return user


async def get_optional_current_user(token: str | None = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User | None:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
        if user_id is None:
            return None
    except Exception:
        return None

    statement = select(User).filter(User.id == user_id)
    result = await db.execute(statement)
    return result.scalars().first()

