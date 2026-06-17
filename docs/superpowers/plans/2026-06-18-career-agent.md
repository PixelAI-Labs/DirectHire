# Career Agent Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete Career Agent workflow for DirectHire: backend persistence and structured endpoints, candidate-facing UI, and tests.

**Architecture:** Add a `CareerAgentReport` document and `career_service.py` under `backend/apps/agents/`. Keep the existing generic `/api/agents/*` endpoints for Hiring Agent orchestration, but add candidate-scoped `/api/agents/career/*` endpoints that run the three PRD agents: Strategic Aligner, Proxy Liaison, and Contract Guardian. The frontend should replace the placeholder `Agent.tsx` chat with a dashboard that shows saved reports, action cards, and structured outputs.

**Tech Stack:** FastAPI, Beanie, Pydantic, LangChain, pytest/httpx, React 19, TypeScript, Zustand, Axios, Tailwind.

---

### Task 1: Add backend Career Agent models and schemas

**Files:**
- Modify: `backend/apps/agents/models.py`
- Modify: `backend/apps/agents/schemas.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Add `CareerAgentReport` to `backend/apps/agents/models.py`**

Add this class after `AgentEvent`:

```python
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
```

- [ ] **Step 2: Add Pydantic request/response schemas to `backend/apps/agents/schemas.py`**

Replace the current file content with:

```python
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
```

- [ ] **Step 3: Register new models in `backend/tests/conftest.py`**

Change the `init_beanie` document list to include `CareerAgentReport`:

```python
from apps.agents.models import AgentEvent, CareerAgentReport
```

```python
document_models=[
    User, CandidateProfile, Resume, Application,
    Job, Ranking, Offer, Company, AgentEvent, CareerAgentReport,
    Assessment, Interview, Notification
]
```

Change the `clear_db` model list to include `CareerAgentReport`:

```python
models = [
    User, CandidateProfile, Resume, Application,
    Job, Ranking, Offer, Company, AgentEvent, CareerAgentReport,
    Assessment, Interview, Notification
]
```

- [ ] **Step 4: Run backend tests that import models**

Run:

```bash
pytest backend/tests/test_agents.py -v
```

Expected: tests still pass except for any new failures introduced by intentionally added tests in later tasks.

---

### Task 2: Implement backend Career Agent service

**Files:**
- Create: `backend/apps/agents/career_service.py`
- Modify: `backend/apps/agents/career_agent.py`
- Test: `backend/tests/test_career_agent.py`

- [ ] **Step 1: Create `backend/apps/agents/career_service.py` with helper functions**

```python
"""Career Agent Service"""
import json
import logging
import re
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from apps.agents.career_agent import CareerAgent
from apps.agents.models import CareerAgentReport
from apps.candidate.models import CandidateProfile, Resume

logger = logging.getLogger(__name__)


def _json_from_llm(text: str) -> dict[str, Any]:
    raw = (text or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw).strip()
        raw = re.sub(r"\s*```$", "", raw).strip()
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        value = json.loads(match.group(0) if match else "{}")
    return value if isinstance(value, dict) else {}


def _clamp_score(value: Any) -> float | None:
    try:
        score = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(100.0, score))


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item) for item in value if str(item).strip()]


def _dict_list(value: Any) -> list[dict]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


async def _get_candidate_resume_text(candidate_id: str) -> str:
    resume = await Resume.find_one(Resume.user_id == candidate_id)
    if resume and resume.parsed_text:
        return resume.parsed_text

    profile = await CandidateProfile.find_one(CandidateProfile.user_id == candidate_id)
    if not profile:
        return ""

    parts = []
    if profile.skills:
        parts.append("Skills: " + ", ".join(profile.skills))
    if profile.experience:
        parts.append("Experience: " + json.dumps(profile.experience))
    if profile.education:
        parts.append("Education: " + json.dumps(profile.education))
    return "\n".join(parts)


class CareerAgentService:
    def __init__(self, agent: CareerAgent | None = None):
        self.agent = agent or CareerAgent()

    async def analyze(self, candidate_id: str, job_id: str | None = None) -> CareerAgentReport:
        resume_text = await _get_candidate_resume_text(candidate_id)
        job_context = {}
        if job_id:
            from apps.recruiter.models import Job
            from beanie import PydanticObjectId

            job = await Job.get(PydanticObjectId(job_id))
            if job:
                job_context = {
                    "id": str(job.id),
                    "title": job.title,
                    "description": job.description,
                    "requirements": job.requirements,
                    "skills": job.skills,
                    "salary_min": job.salary_min,
                    "salary_max": job.salary_max,
                    "location": job.location,
                }

        profile = await CandidateProfile.find_one(CandidateProfile.user_id == candidate_id)
        resume_skills = profile.skills if profile else []
        review = await self.agent.review_resume(resume_text)
        skill_gap = await self.agent.analyze_skill_gap(
            resume_skills,
            list(job_context.get("requirements") or []),
        )
        job_description = json.dumps(job_context, indent=2) if job_context else ""
        match = await self.agent.score_job_match(resume_text, job_description)
        strategy = await self.agent.suggest_application_strategy(resume_text, job_description)

        payload = _json_from_llm(strategy)
        report = CareerAgentReport(
            candidate_id=candidate_id,
            job_id=job_id,
            report_type="strategic_aligner",
            resume_text=resume_text,
            job_context=job_context,
            resume_score=_clamp_score(payload.get("resume_score")),
            career_alignment_score=_clamp_score(payload.get("career_alignment_score")),
            skill_gap_score=_clamp_score(payload.get("skill_gap_score")),
            match_score=_clamp_score(_json_from_llm(match).get("match_score")),
            top_strengths=_string_list(payload.get("top_strengths")),
            gaps=_string_list(payload.get("gaps")),
            resume_recommendations=_string_list(payload.get("resume_recommendations")),
            cover_letter_outline=payload.get("cover_letter_outline"),
            raw_llm_response=json.dumps({"review": review, "skill_gap": skill_gap, "match": match, "strategy": strategy}),
        )
        await report.insert()
        return report

    async def interview_prep(self, candidate_id: str, job_id: str | None = None) -> CareerAgentReport:
        resume_text = await _get_candidate_resume_text(candidate_id)
        job_context = {}
        if job_id:
            from apps.recruiter.models import Job
            from beanie import PydanticObjectId

            job = await Job.get(PydanticObjectId(job_id))
            if job:
                job_context = {
                    "id": str(job.id),
                    "title": job.title,
                    "description": job.description,
                    "requirements": job.requirements,
                    "skills": job.skills,
                }

        prompt = json.dumps(job_context, indent=2) if job_context else resume_text
        prep = await self.agent.prepare_interview(prompt)
        payload = _json_from_llm(prep)

        report = CareerAgentReport(
            candidate_id=candidate_id,
            job_id=job_id,
            report_type="proxy_liaison_interview_prep",
            resume_text=resume_text,
            job_context=job_context,
            interview_questions=_dict_list(payload.get("interview_questions")),
            interview_tips=_string_list(payload.get("interview_tips")),
            raw_llm_response=prep,
        )
        await report.insert()
        return report

    async def schedule(self, candidate_id: str, job_id: str, prompt: str) -> CareerAgentReport:
        resume_text = await _get_candidate_resume_text(candidate_id)
        suggestion = await self.agent.suggest_interview_schedule(prompt)
        payload = _json_from_llm(suggestion)

        report = CareerAgentReport(
            candidate_id=candidate_id,
            job_id=job_id,
            report_type="proxy_liaison_schedule",
            resume_text=resume_text,
            scheduling_suggestion=payload,
            raw_llm_response=suggestion,
        )
        await report.insert()
        return report

    async def contract_review(self, candidate_id: str, offer_id: str) -> CareerAgentReport:
        resume_text = await _get_candidate_resume_text(candidate_id)
        from apps.recruiter.models import Offer
        from beanie import PydanticObjectId

        offer = await Offer.get(PydanticObjectId(offer_id))
        if not offer:
            raise ValueError("Offer not found")

        job_context = {}
        if offer.job_id:
            from apps.recruiter.models import Job

            job = await Job.get(PydanticObjectId(offer.job_id))
            if job:
                job_context = {
                    "id": str(job.id),
                    "title": job.title,
                    "salary_min": job.salary_min,
                    "salary_max": job.salary_max,
                }

        review = await self.agent.review_offer(
            resume_text,
            json.dumps({
                "salary_offered": offer.salary_offered,
                "benefits": offer.benefits,
                "status": offer.status,
                "job": job_context,
            }),
        )
        payload = _json_from_llm(review)

        report = CareerAgentReport(
            candidate_id=candidate_id,
            offer_id=offer_id,
            report_type="contract_guardian",
            resume_text=resume_text,
            offer_context={
                "id": offer_id,
                "salary_offered": offer.salary_offered,
                "benefits": offer.benefits,
                "status": offer.status,
                "job": job_context,
            },
            red_flags=_string_list(payload.get("red_flags")),
            green_flags=_string_list(payload.get("green_flags")),
            negotiation_advice=payload.get("negotiation_advice"),
            raw_llm_response=review,
        )
        await report.insert()
        return report

    async def list_reports(self, candidate_id: str, limit: int = 10) -> list[CareerAgentReport]:
        return await CareerAgentReport.find(CareerAgentReport.candidate_id == candidate_id).sort(-CareerAgentReport.created_at).limit(limit).to_list()
```

- [ ] **Step 2: Extend `backend/apps/agents/career_agent.py` with structured prompts**

Append these methods:

```python
    async def suggest_interview_schedule(self, prompt: str) -> str:
        system_prompt = (
            "You are the DirectHire Proxy Liaison Agent. "
            "Convert the candidate's scheduling request into structured interview scheduling advice. "
            "Return ONLY valid JSON with suggested_date, suggested_time, duration_minutes, interview_type, "
            "candidate_availability_note, and recruiter_message."
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Scheduling request:\n{prompt}"),
        ]
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return json.dumps({
                "suggested_date": "",
                "suggested_time": "",
                "duration_minutes": 30,
                "interview_type": "video",
                "candidate_availability_note": prompt,
                "recruiter_message": "Please confirm availability.",
                "error": str(e),
            })

    async def review_offer(self, resume_text: str, offer_json: str) -> str:
        system_prompt = (
            "You are the DirectHire Contract Guardian Agent. "
            "Review the offer for candidate risk and negotiation value. "
            "Return ONLY valid JSON with red_flags, green_flags, negotiation_advice, "
            "recommended_counter, and confidence."
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Resume:\n{resume_text}\n\nOffer:\n{offer_json}"),
        ]
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return json.dumps({
                "red_flags": ["Could not review offer"],
                "green_flags": [],
                "negotiation_advice": str(e),
                "recommended_counter": None,
                "confidence": "low",
            })
```

- [ ] **Step 3: Run a focused import check**

Run:

```bash
python -m py_compile backend/apps/agents/career_agent.py backend/apps/agents/career_service.py backend/apps/agents/models.py backend/apps/agents/schemas.py
```

Expected: exits with code 0.

---

### Task 3: Add Career Agent router endpoints

**Files:**
- Modify: `backend/apps/agents/router.py`
- Test: `backend/tests/test_career_agent.py`

- [ ] **Step 1: Import new dependencies in `backend/apps/agents/router.py`**

At the top, replace:

```python
from apps.agents.career_agent import CareerAgent
```

with:

```python
from apps.agents.career_agent import CareerAgent
from apps.agents.career_service import CareerAgentService
from apps.agents.schemas import CareerAnalyzeRequest, CareerContractReviewRequest, CareerInterviewPrepRequest, CareerReportListOut, CareerReportOut, CareerScheduleRequest
```

Add the service singleton after `career_agent = CareerAgent()`:

```python
career_agent_service = CareerAgentService(career_agent)
```

- [ ] **Step 2: Add helper to fetch current candidate**

Insert after `router = APIRouter()`:

```python
def _require_candidate(user: User) -> str:
    if user.role.value != "CANDIDATE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidate access required")
    return str(user.id)
```

- [ ] **Step 3: Add `/career/analyze` endpoint**

Append after the existing `/analyze` endpoint block:

```python
@router.post("/career/analyze", response_model=CareerReportOut)
async def career_analyze(payload: CareerAnalyzeRequest, current_user: User = Depends(get_current_user)):
    candidate_id = _require_candidate(current_user)
    try:
        return await career_agent_service.analyze(candidate_id, payload.job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception:
        logger.exception("[career/analyze] failed")
        raise HTTPException(status_code=500, detail="Career Agent analysis failed")
```

- [ ] **Step 4: Add `/career/interview-prep` endpoint**

```python
@router.post("/career/interview-prep", response_model=CareerReportOut)
async def career_interview_prep(payload: CareerInterviewPrepRequest, current_user: User = Depends(get_current_user)):
    candidate_id = _require_candidate(current_user)
    try:
        return await career_agent_service.interview_prep(candidate_id, payload.job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception:
        logger.exception("[career/interview-prep] failed")
        raise HTTPException(status_code=500, detail="Career Agent interview prep failed")
```

- [ ] **Step 5: Add `/career/schedule` endpoint**

```python
@router.post("/career/schedule", response_model=CareerReportOut)
async def career_schedule(payload: CareerScheduleRequest, current_user: User = Depends(get_current_user)):
    candidate_id = _require_candidate(current_user)
    try:
        return await career_agent_service.schedule(candidate_id, payload.job_id, payload.prompt)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception:
        logger.exception("[career/schedule] failed")
        raise HTTPException(status_code=500, detail="Career Agent scheduling failed")
```

- [ ] **Step 6: Add `/career/contract-review` endpoint**

```python
@router.post("/career/contract-review", response_model=CareerReportOut)
async def career_contract_review(payload: CareerContractReviewRequest, current_user: User = Depends(get_current_user)):
    candidate_id = _require_candidate(current_user)
    try:
        return await career_agent_service.contract_review(candidate_id, payload.offer_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception:
        logger.exception("[career/contract-review] failed")
        raise HTTPException(status_code=500, detail="Career Agent contract review failed")
```

- [ ] **Step 7: Add `/career/reports` endpoint**

```python
@router.get("/career/reports", response_model=CareerReportListOut)
async def career_reports(current_user: User = Depends(get_current_user)):
    candidate_id = _require_candidate(current_user)
    try:
        reports = await career_agent_service.list_reports(candidate_id)
        return {"reports": reports}
    except Exception:
        logger.exception("[career/reports] failed")
        raise HTTPException(status_code=500, detail="Career Agent reports failed")
```

- [ ] **Step 8: Run py_compile**

Run:

```bash
python -m py_compile backend/apps/agents/router.py
```

Expected: exits with code 0.

---

### Task 4: Add backend tests for Career Agent service and router

**Files:**
- Create: `backend/tests/test_career_agent.py`

- [ ] **Step 1: Create tests for service parsing and persistence**

```python
import pytest
from apps.agents.career_agent import CareerAgent
from apps.agents.career_service import CareerAgentService
from apps.candidate.models import CandidateProfile, Resume


@pytest.mark.asyncio
async def test_career_agent_analyze_saves_structured_report(db, test_candidate, test_job):
    await CandidateProfile(
        user_id=str(test_candidate.id),
        skills=["Python"],
        experience=[],
    ).insert()

    agent = CareerAgent()
    service = CareerAgentService(agent)

    with (
        pytest.MonkeyPatch.context() as mp,
    ):
        mp.setattr(agent, "review_resume", lambda resume_text: "Strong resume")
        mp.setattr(agent, "analyze_skill_gap", lambda skills, requirements: "Missing React")
        mp.setattr(agent, "score_job_match", lambda resume_text, job_description: '{"match_score": 82}')
        mp.setattr(agent, "suggest_application_strategy", lambda resume_text, job_description: '{"resume_score": 78, "career_alignment_score": 84, "skill_gap_score": 70, "top_strengths": ["Python"], "gaps": ["React"], "resume_recommendations": ["Add metrics"], "cover_letter_outline": "Intro, proof, close"}')

        report = await service.analyze(str(test_candidate.id), str(test_job.id))

    assert report.report_type == "strategic_aligner"
    assert report.match_score == 82
    assert report.resume_score == 78
    assert report.career_alignment_score == 84
    assert report.skill_gap_score == 70
    assert report.top_strengths == ["Python"]
    assert report.gaps == ["React"]
```

- [ ] **Step 2: Add router tests for candidate-only access**

```python
@pytest.mark.asyncio
async def test_career_reports_requires_candidate(async_client, recruiter_token):
    response = await async_client.get("/api/agents/career/reports", headers=recruiter_token)
    assert response.status_code == 403
```

- [ ] **Step 3: Add router tests for list reports**

```python
@pytest.mark.asyncio
async def test_career_reports_lists_current_candidate_reports(async_client, candidate_token, test_candidate):
    from apps.agents.models import CareerAgentReport

    report = CareerAgentReport(
        candidate_id=str(test_candidate.id),
        report_type="strategic_aligner",
        match_score=88,
    )
    await report.insert()

    response = await async_client.get("/api/agents/career/reports", headers=candidate_token)

    assert response.status_code == 200
    assert response.json()["reports"][0]["match_score"] == 88
```

- [ ] **Step 4: Add router tests for analyze endpoint**

```python
@pytest.mark.asyncio
async def test_career_analyze_endpoint_saves_report(async_client, candidate_token, test_candidate, test_job):
    from apps.agents.router import career_agent_service

    with (
        pytest.MonkeyPatch.context() as mp,
    ):
        mp.setattr(career_agent_service.agent, "review_resume", lambda resume_text: "Strong resume")
        mp.setattr(career_agent_service.agent, "analyze_skill_gap", lambda skills, requirements: "Missing React")
        mp.setattr(career_agent_service.agent, "score_job_match", lambda resume_text, job_description: '{"match_score": 82}')
        mp.setattr(career_agent_service.agent, "suggest_application_strategy", lambda resume_text, job_description: '{"resume_score": 78, "career_alignment_score": 84, "skill_gap_score": 70, "top_strengths": ["Python"], "gaps": ["React"], "resume_recommendations": ["Add metrics"], "cover_letter_outline": "Intro, proof, close"}')

        response = await async_client.post(
            "/api/agents/career/analyze",
            headers=candidate_token,
            json={"job_id": str(test_job.id)},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["report_type"] == "strategic_aligner"
    assert data["match_score"] == 82
```

- [ ] **Step 5: Run backend Career Agent tests**

Run:

```bash
pytest backend/tests/test_career_agent.py -v
```

Expected: all Career Agent tests pass.

---

### Task 5: Add shared frontend types and service methods

**Files:**
- Modify: `frontend/shared/types/index.ts`
- Modify: `frontend/shared/services/agentService.ts`

- [ ] **Step 1: Add Career Agent types to `frontend/shared/types/index.ts`**

Append after `AgentEvent`:

```typescript
export interface CareerAgentReport {
  id: string
  candidate_id: string
  job_id?: string
  offer_id?: string
  report_type: 'strategic_aligner' | 'proxy_liaison_interview_prep' | 'proxy_liaison_schedule' | 'contract_guardian'
  match_score?: number
  career_alignment_score?: number
  skill_gap_score?: number
  resume_score?: number
  top_strengths: string[]
  gaps: string[]
  resume_recommendations: string[]
  cover_letter_outline?: string
  interview_questions: Array<Record<string, unknown>>
  interview_tips: string[]
  red_flags: string[]
  green_flags: string[]
  negotiation_advice?: string
  scheduling_suggestion?: Record<string, unknown>
  created_at: string
}
```

- [ ] **Step 2: Extend `frontend/shared/services/agentService.ts`**

Replace the file content with:

```typescript
import { apiClient } from './apiClient'
import type { CareerAgentReport } from '../types'

export const agentService = {
  match: (candidate_id: string, job_id: string) =>
    apiClient.post('/agents/match', { candidate_id, job_id }),

  analyze: (candidate_id: string) =>
    apiClient.post('/agents/analyze', { candidate_id }),

  schedule: (candidate_id: string, job_id: string, prompt: string) =>
    apiClient.post('/agents/schedule', { candidate_id, job_id, prompt }),

  negotiate: (offer_id: string, prompt: string) =>
    apiClient.post('/agents/negotiate', { offer_id, prompt }),

  careerAnalyze: (job_id?: string) =>
    apiClient.post<CareerAgentReport>('/agents/career/analyze', { job_id }),

  careerInterviewPrep: (job_id?: string) =>
    apiClient.post<CareerAgentReport>('/agents/career/interview-prep', { job_id }),

  careerSchedule: (job_id: string, prompt: string) =>
    apiClient.post<CareerAgentReport>('/agents/career/schedule', { job_id, prompt }),

  careerContractReview: (offer_id: string) =>
    apiClient.post<CareerAgentReport>('/agents/career/contract-review', { offer_id }),

  careerReports: () =>
    apiClient.get<{ reports: CareerAgentReport[] }>('/agents/career/reports'),
}
```

- [ ] **Step 3: Run TypeScript build for the candidate app**

Run:

```bash
npm run build --workspace @directhire/candidate
```

Expected: no TypeScript errors from shared exports.

---

### Task 6: Replace candidate `Agent.tsx` with full Career Agent dashboard

**Files:**
- Modify: `frontend/apps/candidate/src/pages/Agent.tsx`

- [ ] **Step 1: Replace `Agent.tsx` with structured dashboard UI**

Replace the entire file with:

```tsx
import React, { useEffect, useState } from 'react'
import { Button, Card, Skeleton } from '@directhire/shared'
import { agentService, candidateService, jobService, type CareerAgentReport } from '@directhire/shared'

type ReportKind = 'strategic_aligner' | 'proxy_liaison_interview_prep' | 'proxy_liaison_schedule' | 'contract_guardian'

const REPORT_LABELS: Record<ReportKind, string> = {
  strategic_aligner: 'Strategic Aligner',
  proxy_liaison_interview_prep: 'Proxy Liaison',
  proxy_liaison_schedule: 'Proxy Liaison',
  contract_guardian: 'Contract Guardian',
}

const scoreItems = [
  { label: 'Match', key: 'match_score' },
  { label: 'Alignment', key: 'career_alignment_score' },
  { label: 'Skill Gap', key: 'skill_gap_score' },
  { label: 'Resume', key: 'resume_score' },
] as const

const formatScore = (value?: number) => (typeof value === 'number' ? `${Math.round(value)}%` : '—')

const formatList = (items?: string[]) => (items && items.length ? items : ['No items captured yet.'])

const reportTitle = (report: CareerAgentReport) => {
  if (report.report_type === 'contract_guardian') return 'Offer Review'
  if (report.report_type === 'proxy_liaison_schedule') return 'Interview Scheduling'
  if (report.report_type === 'proxy_liaison_interview_prep') return 'Interview Prep'
  return 'Career Strategy'
}

export const Agent: React.FC = () => {
  const [reports, setReports] = useState<CareerAgentReport[]>([])
  const [loading, setLoading] = useState(false)
  const [activeReport, setActiveReport] = useState<CareerAgentReport | null>(null)
  const [schedulePrompt, setSchedulePrompt] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedOfferId, setSelectedOfferId] = useState('')
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([])
  const [offers, setOffers] = useState<Array<{ id: string; job_id: string; salary: number }>>([])

  const refreshReports = async () => {
    const res = await agentService.careerReports()
    setReports(res.data.reports)
    setActiveReport(res.data.reports[0] ?? null)
  }

  useEffect(() => {
    refreshReports()
    jobService.listJobs({ limit: 10 }).then((res) => setJobs(res.data.items ?? res.data.jobs ?? []))
    candidateService.getOffers().then((res) => setOffers(res.data))
  }, [])

  const run = async (kind: ReportKind) => {
    setLoading(true)
    try {
      let res
      if (kind === 'strategic_aligner') {
        res = await agentService.careerAnalyze(selectedJobId || undefined)
      } else if (kind === 'proxy_liaison_interview_prep') {
        res = await agentService.careerInterviewPrep(selectedJobId || undefined)
      } else if (kind === 'proxy_liaison_schedule') {
        if (!selectedJobId || !schedulePrompt.trim()) return
        res = await agentService.careerSchedule(selectedJobId, schedulePrompt)
      } else {
        if (!selectedOfferId) return
        res = await agentService.careerContractReview(selectedOfferId)
      }

      const nextReport = res.data
      setReports((prev) => [nextReport, ...prev.filter((report) => report.id !== nextReport.id)])
      setActiveReport(nextReport)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
            Career Agent
          </h1>
          <p className="mt-2 text-sm text-[#8b92b4]">
            Your AI Career Agent reviews your profile, prepares interviews, coordinates scheduling, and protects your offer.
          </p>
        </div>
        <Button variant="ghost" onClick={() => refreshReports()}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold text-[#adc6ff]">Agent Actions</h2>
            <p className="text-xs text-[#8b92b4]">Run a complete Career Agent workflow and save the result.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-[#8b92b4]">Optional job context</label>
            <select
              className="w-full rounded-lg border border-[#2a3150] bg-[#131a2a] px-3 py-2 text-sm text-[#dce1fb]"
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
            >
              <option value="">No job selected</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-[#8b92b4]">Offer to review</label>
            <select
              className="w-full rounded-lg border border-[#2a3150] bg-[#131a2a] px-3 py-2 text-sm text-[#dce1fb]"
              value={selectedOfferId}
              onChange={(event) => setSelectedOfferId(event.target.value)}
            >
              <option value="">No offer selected</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.job_id} · ${offer.salary}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Button disabled={loading} onClick={() => run('strategic_aligner')}>
              Run Strategic Aligner
            </Button>
            <Button disabled={loading} onClick={() => run('proxy_liaison_interview_prep')}>
              Run Interview Prep
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#8b92b4]">Scheduling request</label>
            <input
              className="w-full rounded-lg border border-[#2a3150] bg-[#131a2a] px-3 py-2 text-sm text-[#dce1fb]"
              placeholder="I can meet Tuesday after 2pm..."
              value={schedulePrompt}
              onChange={(event) => setSchedulePrompt(event.target.value)}
            />
            <Button disabled={loading || !selectedJobId || !schedulePrompt.trim()} onClick={() => run('proxy_liaison_schedule')}>
              Run Proxy Liaison Schedule
            </Button>
          </div>

          <Button disabled={loading || !selectedOfferId} onClick={() => run('contract_guardian')}>
            Run Contract Guardian
          </Button>

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {reports.slice(0, 4).map((report) => (
              <button
                key={report.id}
                className={`rounded-xl border p-4 text-left transition hover:border-[#adc6ff] ${
                  activeReport?.id === report.id ? 'border-[#adc6ff] bg-[#1e2640]' : 'border-[#2a3150] bg-[#151b2d]'
                }`}
                onClick={() => setActiveReport(report)}
              >
                <div className="text-xs text-[#8b92b4]">{REPORT_LABELS[report.report_type]}</div>
                <div className="mt-1 font-semibold text-[#dce1fb]">{reportTitle(report)}</div>
                <div className="mt-2 text-xs text-[#8b92b4]">{new Date(report.created_at).toLocaleString()}</div>
              </button>
            ))}
          </div>

          {!activeReport ? (
            <Card className="p-6 text-sm text-[#8b92b4]">
              No Career Agent reports yet. Run an action to generate your first structured report.
            </Card>
          ) : (
            <Card className="space-y-6 p-6">
              <div>
                <div className="text-xs text-[#8b92b4]">{REPORT_LABELS[activeReport.report_type]}</div>
                <h2 className="text-2xl font-semibold text-[#adc6ff]">{reportTitle(activeReport)}</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {scoreItems.map((item) => (
                  <div key={item.key} className="rounded-lg bg-[#131a2a] p-3">
                    <div className="text-xs text-[#8b92b4]">{item.label}</div>
                    <div className="mt-1 text-xl font-semibold text-[#dce1fb]">{formatScore(activeReport[item.key])}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Strengths</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#dce1fb]">
                    {formatList(activeReport.top_strengths).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Gaps</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#dce1fb]">
                    {formatList(activeReport.gaps).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              </div>

              <section>
                <h3 className="font-semibold text-[#adc6ff]">Resume Recommendations</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#dce1fb]">
                  {formatList(activeReport.resume_recommendations).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>

              {activeReport.cover_letter_outline && (
                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Cover Letter Outline</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#dce1fb]">{activeReport.cover_letter_outline}</p>
                </section>
              )}

              {activeReport.interview_questions.length > 0 && (
                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Interview Questions</h3>
                  <div className="mt-2 space-y-2">
                    {activeReport.interview_questions.map((question, index) => (
                      <div key={index} className="rounded-lg bg-[#131a2a] p-3 text-sm text-[#dce1fb]">
                        {JSON.stringify(question)}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeReport.interview_tips.length > 0 && (
                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Interview Tips</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#dce1fb]">
                    {activeReport.interview_tips.map((tip) => <li key={tip}>{tip}</li>)}
                  </ul>
                </section>
              )}

              {activeReport.red_flags.length > 0 && (
                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Offer Red Flags</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#dce1fb]">
                    {activeReport.red_flags.map((flag) => <li key={flag}>{flag}</li>)}
                  </ul>
                </section>
              )}

              {activeReport.green_flags.length > 0 && (
                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Offer Green Flags</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#dce1fb]">
                    {activeReport.green_flags.map((flag) => <li key={flag}>{flag}</li>)}
                  </ul>
                </section>
              )}

              {activeReport.negotiation_advice && (
                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Negotiation Advice</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#dce1fb]">{activeReport.negotiation_advice}</p>
                </section>
              )}

              {activeReport.scheduling_suggestion && (
                <section>
                  <h3 className="font-semibold text-[#adc6ff]">Scheduling Suggestion</h3>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-[#131a2a] p-3 text-xs text-[#dce1fb]">
                    {JSON.stringify(activeReport.scheduling_suggestion, null, 2)}
                  </pre>
                </section>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run candidate TypeScript build**

Run:

```bash
npm run build --workspace @directhire/candidate
```

Expected: no TypeScript errors.

---

### Task 7: Verify and clean up

**Files:**
- Modified files from Tasks 1-6

- [ ] **Step 1: Run backend Career Agent tests**

Run:

```bash
pytest backend/tests/test_career_agent.py -v
```

Expected: all tests pass.

- [ ] **Step 2: Run full backend agent tests**

Run:

```bash
pytest backend/tests/test_agents.py backend/tests/test_career_agent.py -v
```

Expected: all agent tests pass.

- [ ] **Step 3: Run candidate build**

Run:

```bash
npm run build --workspace @directhire/candidate
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

Run:

```bash
git add backend/apps/agents/models.py backend/apps/agents/schemas.py backend/apps/agents/career_service.py backend/apps/agents/career_agent.py backend/apps/agents/router.py backend/tests/conftest.py backend/tests/test_career_agent.py frontend/shared/types/index.ts frontend/shared/services/agentService.ts frontend/apps/candidate/src/pages/Agent.tsx
git commit -m "feat: implement full-stack Career Agent"
```

Expected: commit created with message `feat: implement full-stack Career Agent`.

---

## Self-Review

- **Spec coverage:** Backend persistence, three PRD Career Agent sub-agents, candidate-only endpoints, frontend dashboard, and tests are covered by Tasks 1-7.
- **Placeholder scan:** No TBD/TODO placeholders remain.
- **Type consistency:** `CareerAgentReport`, `CareerReportOut`, and frontend `CareerAgentReport` use matching field names.
- **Risk note:** Contract Guardian requires an actual offer ID from `/candidate/offers`; the UI loads the candidate's offers and disables the action until one is selected.
