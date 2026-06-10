"""Candidate Schemas"""
from typing import Optional, Any
from pydantic import BaseModel
from datetime import datetime
from apps.jobs.schemas import JobPublicOut

class CandidateProfileUpdate(BaseModel):
    skills: list[str] | None = None
    experience: list[dict[str, Any]] | None = None
    education: list[dict[str, Any]] | None = None
    preferences: dict[str, Any] | None = None

class CandidateProfileOut(BaseModel):
    id: str
    user_id: str
    resume_url: str | None
    skills: list[str]
    experience: list[dict[str, Any]]
    education: list[dict[str, Any]]
    preferences: dict[str, Any]
    created_at: datetime

class ResumeOut(BaseModel):
    id: str
    user_id: str
    file_path: str
    parsed_text: str | None
    created_at: datetime

class ApplicationOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    status: str
    match_score: float | None
    created_at: datetime
    job: JobPublicOut | None = None

class OfferOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    recruiter_id: str
    salary_offered: float
    benefits: str
    status: str
    message: str
    created_at: datetime
    job: JobPublicOut | None = None
