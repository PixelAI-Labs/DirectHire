from datetime import timezone
"""Agent Models"""
from beanie import Document
from datetime import datetime

class AgentEvent(Document):
    agent_type: str  # CAREER or HIRING
    event_type: str
    payload: dict = {}
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "agent_events"


class CareerAgentReport(Document):
    candidate_id: str
    job_id: str | None = None
    offer_id: str | None = None
    report_type: str
    resume_text: str | None = None
    job_context: dict = {}
    offer_context: dict = {}
    match_score: float | None = None
    career_alignment_score: float | None = None
    skill_gap_score: float | None = None
    resume_score: float | None = None
    top_strengths: list[str] = []
    gaps: list[str] = []
    resume_recommendations: list[str] = []
    cover_letter_outline: str | None = None
    interview_questions: list[dict] = []
    interview_tips: list[str] = []
    red_flags: list[str] = []
    green_flags: list[str] = []
    negotiation_advice: str | None = None
    scheduling_suggestion: dict | None = None
    raw_llm_response: str | None = None
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "career_agent_reports"
