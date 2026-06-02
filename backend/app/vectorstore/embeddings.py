from langchain_community.embeddings import HuggingFaceEmbeddings
from ..core.config import settings


def get_embedding_client() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
