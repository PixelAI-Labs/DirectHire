"""Recruiter Models"""
from beanie import Document
from datetime import datetime

class Job(Document):
    company_id: str
    title: str
    description: str
    requirements: list[str] = []
    skills: list[str] = []
    location: str
    salary_min: float | None = None
    salary_max: float | None = None
    role_type: str = "FULL_TIME"
    remote_option: str = "HYBRID"
    status: str = "OPEN"
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "jobs"