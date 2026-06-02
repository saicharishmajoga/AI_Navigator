import os
from pathlib import Path
from dotenv import load_dotenv
try:
    # pydantic v1
    from pydantic import BaseSettings, Field, PostgresDsn
except Exception:
    # pydantic v2+ (BaseSettings moved to pydantic-settings)
    try:
        from pydantic.env_settings import BaseSettings
    except Exception:
        from pydantic_settings import BaseSettings
    from pydantic import Field
    from pydantic.networks import PostgresDsn

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / "../.env")

class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=120, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    GROQ_API_KEY: str | None = Field(default=None, env="GROQ_API_KEY")
    EMBEDDING_MODEL: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", env="EMBEDDING_MODEL")
    CHROMA_DB_DIR: str = Field(default="./chroma_db", env="CHROMA_DB_DIR")
    UPLOAD_DIRECTORY: str = Field(default="./uploads", env="UPLOAD_DIRECTORY")
    BACKEND_CORS_ORIGINS: list[str] = Field(default=["*"])
    SMTP_HOST: str | None = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: int | None = Field(default=None, env="SMTP_PORT")
    SMTP_USER: str | None = Field(default=None, env="SMTP_USER")
    SMTP_PASSWORD: str | None = Field(default=None, env="SMTP_PASSWORD")

    class Config:
        env_file = BASE_DIR / "../.env"

settings = Settings()
