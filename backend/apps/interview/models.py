"""Interview Models"""
from beanie import Document
from datetime import datetime


class Interview(Document):
    job_id: str
    candidate_id: str
    recruiter_id: str
    scheduled_at: datetime | None = None
    format: str = "VIDEO"
    status: str = "SCHEDULED"
    notes: str = ""
    communication_score: float = 0.0
    technical_score: float = 0.0
    confidence_score: float = 0.0
    behavioral_analysis: str = ""
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "interviews"