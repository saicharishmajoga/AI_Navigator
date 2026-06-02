from ..core.config import settings

def get_embedding_client():
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
    except Exception as e:
        print(f"Lazy Embedding initialization failed: {e}")
        return None
