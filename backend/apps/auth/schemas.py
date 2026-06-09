"""
Auth Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr

from apps.auth.models import UserRole


class RegisterPayload(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"