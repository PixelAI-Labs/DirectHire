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

    # AI
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5242880  # 5MB

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
