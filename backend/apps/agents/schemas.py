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
