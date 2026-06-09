"""Company Models"""
from beanie import Document

class Company(Document):
    name: str
    logo_url: str | None = None
    description: str = ""
    website: str | None = None
    recruiters: list[str] = []

    class Settings:
        name = "companies"