# AI Navigator Backend

Professional backend architecture for the AI Navigator platform built with FastAPI, PostgreSQL, SQLAlchemy, JWT authentication, LangChain, and ChromaDB.

## Features

- Role-based JWT authentication
- Client authorization
- AI tool catalog CRUD
- PDF document ingestion with PyPDF2 and pdfplumber
- RAG retrieval pipeline with HuggingFace embeddings and ChromaDB
- Groq-powered chatbot integration
- Bookmark and visited tool tracking for authenticated users
- User management and analytics endpoints

## Project Structure

- `app/main.py` - FastAPI application entrypoint
- `app/api/` - route modules for auth, tools, chat, documents, bookmarks, visited
- `app/auth/` - authentication services and dependencies
- `app/core/` - configuration, security, middleware, and exception handling
- `app/database/` - async database configuration and session management
- `app/models/` - SQLAlchemy ORM models
- `app/schemas/` - Pydantic request/response schemas
- `app/services/` - domain services and business logic
- `app/vectorstore/` - embedding and RAG utilities
- `uploads/` - uploaded document storage
- `chroma_db/` - persisted Chroma vector database

## Setup

1. Create a virtual environment.
2. Install core backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. If you need RAG, embedding, or PDF ingestion support, install the full backend dependencies as well:
   ```bash
   pip install -r requirements-full.txt
   ```
4. Copy `.env.example` to `.env` and update your database and Groq credentials.
5. Run the application:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Notes

- Default admin user creation is disabled. Tool management and document upload endpoints now require authenticated users.
- Chat history and visit tracking are stored only for authenticated users.
