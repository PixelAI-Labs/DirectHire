"""
Auth Models — User, Role definitions
"""

from enum import Enum
from beanie import Document
from pydantic import EmailStr

class UserRole(str, Enum):
    CANDIDATE = "CANDIDATE"
    RECRUITER = "RECRUITER"
    ADMIN = "ADMIN"

class User(Document):
    email: EmailStr
    full_name: str
    hashed_password: str
    role: UserRole
    is_active: bool = True
    avatar_url: str | None = None
    company_id: str | None = None  # For recruiters

    class Settings:
        name = "users"
        indexes = [
            [("email", 1)],
        ]
