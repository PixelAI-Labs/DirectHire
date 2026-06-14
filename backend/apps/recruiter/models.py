"""Recruiter Models"""
from beanie import Document
from datetime import datetime, timezone
from pymongo import IndexModel, TEXT


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
    embedding: list[float] | None = None
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "jobs"
        # A text index is required for $text queries (used by /api/jobs/?q=...).
        # Beanie's text-index support requires an explicit pymongo.IndexModel —
        # bare tuples like ("title", "text") are interpreted as compound ascending
        # indexes, which is why $text queries against this collection used to fail.
        indexes = [
            IndexModel(
                [("title", TEXT), ("description", TEXT)],
                name="title_description_text_idx",
            ),
        ]


class Ranking(Document):
    job_id: str
    candidate_id: str
    resume_score: float = 0.0
    assessment_score: float = 0.0
    match_score: float = 0.0
    overall_score: float = 0.0
    ranking_formula: dict = {}
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "rankings"


class Offer(Document):
    job_id: str
    candidate_id: str
    recruiter_id: str
    salary_offered: float
    benefits: str = ""
    status: str = "PENDING"
    message: str = ""
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "offers"