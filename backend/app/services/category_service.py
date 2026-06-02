from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.category import Category
from ..schemas.category import CategoryCreate, CategoryRead


class CategoryService:
    @staticmethod
    async def list_categories(db: AsyncSession) -> list[Category]:
        result = await db.execute(select(Category))
        return result.scalars().all()

    @staticmethod
    async def create_category(db: AsyncSession, payload: CategoryCreate) -> Category:
        category = Category(**payload.model_dump())
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def update_category(db: AsyncSession, category_id: int, payload: CategoryCreate) -> Category | None:
        statement = update(Category).where(Category.id == category_id).values(**payload.model_dump()).returning(Category)
        result = await db.execute(statement)
        category = result.scalars().first()
        if category:
            await db.commit()
            await db.refresh(category)
        return category

    @staticmethod
    async def delete_category(db: AsyncSession, category_id: int) -> bool:
        statement = delete(Category).where(Category.id == category_id)
        await db.execute(statement)
        await db.commit()
        return True
