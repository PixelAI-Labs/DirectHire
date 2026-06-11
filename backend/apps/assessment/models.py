from datetime import timezone
"""Assessment Models"""
from beanie import Document
from datetime import datetime


class Assessment(Document):
    job_id: str
    candidate_id: str
    recruiter_id: str
    title: str
    questions: list[str] = []
    candidate_answers: list[str] = []
    status: str = "ASSIGNED"
    technical_score: float = 0.0
    coding_score: float = 0.0
    reasoning_score: float = 0.0
    ai_feedback: str = ""
    created_at: datetime = datetime.now(timezone.utc)
    submitted_at: datetime | None = None

    class Settings:
        name = "assessments"