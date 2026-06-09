"""Company Schemas"""
from pydantic import BaseModel


class CompanyCreate(BaseModel):
    name: str
    logo_url: str | None = None
    description: str = ""
    website: str | None = None


class CompanyUpdate(BaseModel):
    name: str | None = None
    logo_url: str | None = None
    description: str | None = None
    website: str | None = None


class CompanyOut(BaseModel):
    id: str
    name: str
    logo_url: str | None
    description: str
    website: str | None
    recruiters: list[str]
    created_by: str