from datetime import timezone
"""
Candidate Models
"""

from beanie import Document
from datetime import datetime

class CandidateProfile(Document):
    user_id: str
    resume_url: str | None = None
    skills: list[str] = []
    experience: list[dict] = []
    education: list[dict] = []
    preferences: dict = {}
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "candidate_profiles"

class Resume(Document):
    user_id: str
    file_path: str
    parsed_text: str | None = None
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "resumes"

class Application(Document):
    job_id: str
    candidate_id: str
    status: str = "APPLIED"
    match_score: float | None = None
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "applications"
