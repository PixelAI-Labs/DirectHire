"""Assessment Schemas"""
from datetime import datetime
from pydantic import BaseModel


class AssessmentCreate(BaseModel):
    job_id: str
    candidate_id: str
    title: str
    questions: list[str] = []


class AssessmentOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    recruiter_id: str
    title: str
    questions: list[str]
    candidate_answers: list[str]
    status: str
    technical_score: float
    coding_score: float
    reasoning_score: float
    ai_feedback: str
    created_at: datetime
    submitted_at: datetime | None


class AssessmentSubmit(BaseModel):
    answers: list[str]


class AssessmentEvaluate(BaseModel):
    technical_score: float
    coding_score: float
    reasoning_score: float
    ai_feedback: str