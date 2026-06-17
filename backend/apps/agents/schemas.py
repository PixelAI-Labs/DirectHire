"""Agent Schemas"""
from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    candidate_id: str


class MatchRequest(BaseModel):
    candidate_id: str
    job_id: str


class ScheduleRequest(BaseModel):
    candidate_id: str
    job_id: str
    prompt: str


class NegotiateRequest(BaseModel):
    offer_id: str
    prompt: str


class CareerAnalyzeRequest(BaseModel):
    job_id: str | None = None


class CareerJobMatchRequest(BaseModel):
    job_id: str


class CareerInterviewPrepRequest(BaseModel):
    job_id: str | None = None


class CareerScheduleRequest(BaseModel):
    job_id: str
    prompt: str


class CareerContractReviewRequest(BaseModel):
    offer_id: str


class CareerReportOut(BaseModel):
    id: str
    candidate_id: str
    job_id: str | None = None
    offer_id: str | None = None
    report_type: str
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
    created_at: str


class CareerReportListOut(BaseModel):
    reports: list[CareerReportOut]


# --- Hiring Agent Schemas ---

class ScreenRequest(BaseModel):
    candidate_id: str
    job_id: str


class ScreenResponse(BaseModel):
    eligibility_score: float
    suitability_score: float
    potential_score: float
    summary: str
    strengths: list[str]
    concerns: list[str]


class RankRequest(BaseModel):
    job_id: str


class AnalysisResult(BaseModel):
    technical_score: float
    coding_score: float
    reasoning_score: float
    anomalies: list[str]
    summary: str


class DraftOfferRequest(BaseModel):
    candidate_id: str
    job_id: str


class DraftOfferResponse(BaseModel):
    offer_text: str
    recommended_salary: float
    confidence: str
    salary_reasoning: str
