"""Public Jobs Schemas"""
from pydantic import BaseModel
from apps.recruiter.schemas import JobOut

class CompanyPublicOut(BaseModel):
    id: str
    name: str
    logo_url: str | None
    description: str
    website: str | None

class JobPublicOut(JobOut):
    company: CompanyPublicOut
