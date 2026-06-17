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
