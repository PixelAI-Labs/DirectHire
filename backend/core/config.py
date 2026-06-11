"""
Application configuration
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017/directhire"
    MONGODB_DB_NAME: str = "directhire"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174"]

    # AI APIs
    GEMMA_API_KEY: str = ""
    GEMMA_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMMA_E4B_MODEL: str = "gemma-4-26b-a4b-it"
    GEMMA_MOE_MODEL: str = "gemma-4-31b-it"
    GEMMA_DENSE_MODEL: str = "gemma-4-31b-it"

    # Gemini APIs (Main Brain)
    GEMINI_API_KEY: str = ""
    GEMINI_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Hugging Face API (STT / Whisper Large v3)
    HUGGINGFACE_API_KEY: str = ""
    HUGGINGFACE_STT_URL: str = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"


    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    MAX_FILE_SIZE: int = 5242880  # 5MB (backwards compat)
    ALLOWED_UPLOAD_TYPES: set[str] = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}
    UPLOAD_TYPE_DIRS: dict[str, str] = {
        "resume": "resumes",
        "logo": "logos",
        "avatar": "avatars",
    }

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
