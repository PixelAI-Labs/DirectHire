"""Recruiter Schemas"""
from datetime import datetime
from pydantic import BaseModel


class JobCreate(BaseModel):
    title: str
    description: str
    requirements: list[str] = []
    skills: list[str] = []
    location: str
    salary_min: float | None = None
    salary_max: float | None = None
    role_type: str = "FULL_TIME"
    remote_option: str = "HYBRID"


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: list[str] | None = None
    skills: list[str] | None = None
    location: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    role_type: str | None = None
    remote_option: str | None = None


class JobOut(BaseModel):
    id: str
    company_id: str
    title: str
    description: str
    requirements: list[str]
    skills: list[str]
    location: str
    salary_min: float | None
    salary_max: float | None
    role_type: str
    remote_option: str
    status: str
    created_at: datetime


class CandidateRankOut(BaseModel):
    candidate_id: str
    full_name: str
    email: str
    resume_score: float
    assessment_score: float
    match_score: float
    overall_score: float
    skills: list[str]
    application_status: str


class RankingOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    resume_score: float
    assessment_score: float
    match_score: float
    overall_score: float
    created_at: datetime


class OfferCreate(BaseModel):
    job_id: str
    candidate_id: str
    salary_offered: float
    benefits: str = ""
    message: str = ""


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