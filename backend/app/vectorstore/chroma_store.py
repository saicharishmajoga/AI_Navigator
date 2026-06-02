from pathlib import Path
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document as LangChainDocument
from ..vectorstore.embeddings import get_embedding_client
from ..core.config import settings


def get_chroma_store(collection_name: str = "ai_navigator") -> Chroma:
    persist_dir = Path(settings.CHROMA_DB_DIR)
    persist_dir.mkdir(parents=True, exist_ok=True)
    return Chroma(
        persist_directory=str(persist_dir),
        embedding_function=get_embedding_client(),
        collection_name=collection_name,
    )


def ingest_documents(documents: list[LangChainDocument], collection_name: str = "ai_navigator") -> Chroma:
    store = get_chroma_store(collection_name)
    store.add_documents(documents)
    store.persist()
    return store


def retrieve_relevant_documents(query: str, k: int = 4, collection_name: str = "ai_navigator"):
    store = get_chroma_store(collection_name)
    return store.similarity_search(query, k=k)
