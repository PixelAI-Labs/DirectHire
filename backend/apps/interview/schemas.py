"""Interview Schemas"""
from datetime import datetime
from pydantic import BaseModel


class InterviewCreate(BaseModel):
    job_id: str
    candidate_id: str
    scheduled_at: datetime | None = None
    format: str = "VIDEO"


class InterviewOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    recruiter_id: str
    scheduled_at: datetime | None
    format: str
    status: str
    notes: str
    communication_score: float
    technical_score: float
    confidence_score: float
    behavioral_analysis: str
    created_at: datetime


class InterviewUpdate(BaseModel):
    scheduled_at: datetime | None = None
    format: str | None = None
    status: str | None = None
    notes: str | None = None
    communication_score: float | None = None
    technical_score: float | None = None
    confidence_score: float | None = None
    behavioral_analysis: str | None = None