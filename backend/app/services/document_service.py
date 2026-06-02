import shutil
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.document import Document
from ..models.tool import Tool

from ..core.config import settings


class DocumentService:
    @staticmethod
    async def list_documents(db: AsyncSession) -> list[Document]:
        result = await db.execute(select(Document))
        return result.scalars().all()

    @staticmethod
    async def upload_document(db: AsyncSession, uploaded_by: int, file_name: str, file_path: str, tool_id: int | None) -> Document:
        document = Document(
            tool_id=tool_id,
            file_name=file_name,
            file_path=file_path,
            uploaded_by=uploaded_by,
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)
        return document

    @staticmethod
    async def ingest_pdf_file(db: AsyncSession, file_location: str, file_name: str, uploaded_by: int, tool_id: int | None) -> Document:
        saved_path = Path(settings.UPLOAD_DIRECTORY)
        saved_path.mkdir(parents=True, exist_ok=True)
        target_file = saved_path / file_name
        shutil.copy(file_location, target_file)
        from ..vectorstore.rag import ingest_pdf

        ingest_pdf(str(target_file))
        return await DocumentService.upload_document(db, uploaded_by, file_name, str(target_file), tool_id)
