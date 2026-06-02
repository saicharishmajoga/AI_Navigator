from langchain.text_splitter import CharacterTextSplitter
from langchain_core.documents import Document as LangChainDocument
from langchain.chains import RetrievalQA
from langchain.llms.fake import FakeListLLM
from ..vectorstore.chroma_store import ingest_documents, retrieve_relevant_documents, get_chroma_store
from ..vectorstore.embeddings import get_embedding_client
from ..core.config import settings

try:
    from langchain.llms import Groq
except ImportError:
    Groq = None


def extract_text_from_pdf(path: str) -> str:
    from pypdf import PdfReader
    import pdfplumber

    text = []
    reader = PdfReader(path)
    for page in reader.pages:
        page_text = page.extract_text() or ""
        if page_text.strip():
            text.append(page_text)

    if not text:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text.append(page_text)

    return "\n\n".join(text)


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> list[LangChainDocument]:
    splitter = CharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", " "],
    )
    chunks = splitter.split_text(text)
    return [LangChainDocument(page_content=chunk, metadata={}) for chunk in chunks if chunk.strip()]


def ingest_pdf(path: str, collection_name: str = "ai_navigator") -> int:
    raw_text = extract_text_from_pdf(path)
    documents = chunk_text(raw_text)
    ingest_documents(documents, collection_name=collection_name)
    return len(documents)


def build_retriever(collection_name: str = "ai_navigator"):
    store = get_chroma_store(collection_name)
    return store.as_retriever(search_kwargs={"k": 4})


def create_chat_chain():
    if Groq is not None and settings.GROQ_API_KEY:
        try:
            llm = Groq(api_key=settings.GROQ_API_KEY)
        except Exception:
            llm = FakeListLLM(responses=["Hello! The AI Navigator backend is running with a fallback LLM."])
    else:
        llm = FakeListLLM(responses=["Hello! The AI Navigator backend is running with a fallback LLM."])

    retriever = build_retriever()
    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
    )
