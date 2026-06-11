"""Interview Models"""
from beanie import Document
from datetime import datetime
from pydantic import Field


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
    transcript: str = ""
    qa_history: list[dict] = Field(default_factory=list)
    evaluation_summary: str = ""
    overall_score: float = 0.0
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "interviews"