from pathlib import Path
from ..vectorstore.embeddings import get_embedding_client
from ..core.config import settings

def get_chroma_store(collection_name: str = "ai_navigator"):
    try:
        from langchain_community.vectorstores import Chroma
        persist_dir = Path(settings.CHROMA_DB_DIR)
        persist_dir.mkdir(parents=True, exist_ok=True)
        
        embed_client = get_embedding_client()
        if not embed_client:
            print("Embedding client is not available. Bypassing ChromaDB.")
            return None
            
        return Chroma(
            persist_directory=str(persist_dir),
            embedding_function=embed_client,
            collection_name=collection_name,
        )
    except Exception as e:
        print(f"Lazy ChromaDB store initialization failed: {e}")
        return None

def ingest_documents(documents: list, collection_name: str = "ai_navigator"):
    store = get_chroma_store(collection_name)
    if store:
        store.add_documents(documents)
        store.persist()
        return store
    return None

def retrieve_relevant_documents(query: str, k: int = 4, collection_name: str = "ai_navigator"):
    store = get_chroma_store(collection_name)
    if store:
        return store.similarity_search(query, k=k)
    return []
