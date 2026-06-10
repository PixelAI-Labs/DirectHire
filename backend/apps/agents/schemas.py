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
