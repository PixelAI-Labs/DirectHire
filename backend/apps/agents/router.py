"""Agent Orchestrator Router"""
import json
import re
from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from apps.agents.career_agent import CareerAgent
from apps.agents.hiring_agent import HiringAgent
from apps.agents.models import AgentEvent
from apps.agents.schemas import (
    AnalyzeRequest,
    DraftOfferRequest,
    DraftOfferResponse,
    MatchRequest,
    NegotiateRequest,
    RankRequest,
    ScheduleRequest,
    ScreenRequest,
    ScreenResponse,
)
from apps.candidate.models import Application, CandidateProfile, Resume
from apps.company.models import Company
from apps.auth.models import User
from apps.recruiter.models import Job as RecruiterJob
from apps.recruiter.models import Ranking

router = APIRouter()

career_agent = CareerAgent()
hiring_agent = HiringAgent()


def _parse_llm_json_response(response_content: str) -> dict:
    """Strip markdown fences and parse JSON from LLM response."""
    raw = response_content.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw).strip()
        raw = re.sub(r"\s*```$", "", raw).strip()
    return json.loads(raw)


def _extract_match_score(text: str) -> float:
    """Parse a 0-100 match score from a string that may contain extra text."""
    numbers = re.findall(r"\b(\d+(?:\.\d+)?)\b", text)
    for n in numbers:
        val = float(n)
        if 0 <= val <= 100:
            return val
    return 0.0


async def _get_candidate_resume_text(candidate_id: str) -> str:
    """Fetch parsed resume text for a candidate."""
    resume = await Resume.find_one(Resume.user_id == candidate_id)
    if resume and resume.parsed_text:
        return resume.parsed_text
    profile = await CandidateProfile.find_one(CandidateProfile.user_id == candidate_id)
    if profile:
        parts = []
        if profile.skills:
            parts.append("Skills: " + ", ".join(profile.skills))
        if profile.experience:
            parts.append("Experience: " + json.dumps(profile.experience))
        if profile.education:
            parts.append("Education: " + json.dumps(profile.education))
        return "\n".join(parts) if parts else ""
    return ""


# ─── /api/agents/match ────────────────────────────────────────────────────────

@router.post("/match", status_code=status.HTTP_202_ACCEPTED)
async def match_candidate(payload: MatchRequest, background_tasks: BackgroundTasks):
    """
    Compute real match score using CareerAgent + HiringAgent,
    save to Application.match_score, and log AgentEvent.
    """
    background_tasks.add_task(_run_match_task, payload.candidate_id, payload.job_id)
    return {"message": "Match evaluation started in background", "candidate_id": payload.candidate_id}


async def _run_match_task(candidate_id: str, job_id: str):
    """Background task that runs the full match pipeline."""
    try:
        # Fetch data
        resume_text = await _get_candidate_resume_text(candidate_id)
        job = await RecruiterJob.get(job_id)
        if not job:
            return

        job_description = f"{job.title}\n{job.description}\nRequirements: {', '.join(job.requirements)}\nSkills: {', '.join(job.skills)}"

        # Run agents concurrently
        import asyncio
        career_task = asyncio.create_task(career_agent.score_job_match(resume_text, job_description))
        hiring_task = asyncio.create_task(hiring_agent.screen_resume(resume_text, job_description))
        career_result, hiring_result = await asyncio.gather(career_task, hiring_task)

        # Extract numeric scores
        career_score = _extract_match_score(career_result)
        # Combine: career score (30%) + hiring suitability (70%)
        combined = round(career_score * 0.3 + hiring_result.get("suitability_score", 0) * 0.7, 2)

        # Update Application
        app = await Application.find_one(
            Application.candidate_id == candidate_id,
            Application.job_id == job_id,
        )
        if app:
            app.match_score = combined
            await app.save()
        else:
            app = Application(
                job_id=job_id,
                candidate_id=candidate_id,
                match_score=combined,
                status="APPLIED",
            )
            await app.insert()

        # Log AgentEvent
        event = AgentEvent(
            agent_type="HIRING",
            event_type="MATCH_EVALUATION",
            payload={
                "candidate_id": candidate_id,
                "job_id": job_id,
                "career_score": career_score,
                "hiring_score": hiring_result.get("suitability_score", 0),
                "combined_match_score": combined,
            },
        )
        await event.insert()

        # Create or update Ranking
        ranking = await Ranking.find_one(
            Ranking.job_id == job_id,
            Ranking.candidate_id == candidate_id,
        )
        if not ranking:
            ranking = Ranking(
                job_id=job_id,
                candidate_id=candidate_id,
                match_score=combined,
            )
            await ranking.insert()
        else:
            ranking.match_score = combined
            from apps.recruiter.router import compute_candidate_score
            ranking.overall_score = compute_candidate_score(
                ranking.resume_score,
                ranking.assessment_score,
                combined,
            )
            await ranking.save()

    except Exception as e:
        print(f"[match] Error: {e}")


# ─── /api/agents/analyze ──────────────────────────────────────────────────────

@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
async def analyze_candidate(payload: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Run full pipeline: CareerAgent.review_resume + HiringAgent.screen_resume + skill gap,
    save AgentEvent, return combined report.
    """
    background_tasks.add_task(_run_analyze_task, payload.candidate_id)
    return {"message": "Analysis started in background", "candidate_id": payload.candidate_id}


async def _run_analyze_task(candidate_id: str):
    """Background task for full candidate analysis."""
    try:
        resume_text = await _get_candidate_resume_text(candidate_id)
        if not resume_text:
            return

        import asyncio

        review_task = asyncio.create_task(career_agent.review_resume(resume_text))
        # skill gap needs job requirements — use empty list as placeholder
        gap_task = asyncio.create_task(career_agent.analyze_skill_gap([], []))
        # For screen we also need job — run with placeholder job desc
        screen_task = asyncio.create_task(
            hiring_agent.screen_resume(
                resume_text,
                "General professional position — no specific job description provided.",
            )
        )

        review, gap, screen = await asyncio.gather(review_task, gap_task, screen_task)

        event = AgentEvent(
            agent_type="SHARED",
            event_type="FULL_ANALYSIS",
            payload={
                "candidate_id": candidate_id,
                "resume_review": review,
                "skill_gap": gap,
                "screen": screen,
            },
        )
        await event.insert()

    except Exception as e:
        print(f"[analyze] Error: {e}")


# ─── /api/agents/schedule ─────────────────────────────────────────────────────

@router.post("/schedule", status_code=status.HTTP_202_ACCEPTED)
async def schedule_interview(payload: ScheduleRequest, background_tasks: BackgroundTasks):
    """
    Use LLM to parse natural language interview-scheduling prompt into
    a structured date/time suggestion.
    """
    background_tasks.add_task(_run_schedule_task, payload.candidate_id, payload.job_id, payload.prompt)
    return {"message": "Scheduling agent started"}


async def _run_schedule_task(candidate_id: str, job_id: str, prompt: str):
    """Parse scheduling prompt with LLM and log the suggestion."""
    from langchain_core.messages import SystemMessage, HumanMessage

    system_prompt = (
        "You are an executive assistant. Parse the user's natural-language scheduling request "
        "and output a JSON object with:\n"
        "  suggested_date: str — YYYY-MM-DD\n"
        "  suggested_time: str — HH:MM (24h)\n"
        "  duration_minutes: int\n"
        "  interview_type: str — 'phone' | 'video' | 'onsite'\n"
        "  notes: str — any extra notes\n"
        "Output ONLY the JSON object, no markdown."
    )
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Request: {prompt}"),
    ]

    try:
        from apps.agents.core import get_agent_llm
        llm = get_agent_llm(temperature=0.1)
        response = await llm.ainvoke(messages)
        suggestion = _parse_llm_json_response(response.content)

        event = AgentEvent(
            agent_type="SHARED",
            event_type="SCHEDULE_INTERVIEW",
            payload={
                "candidate_id": candidate_id,
                "job_id": job_id,
                "prompt": prompt,
                "suggestion": suggestion,
            },
        )
        await event.insert()

    except Exception as e:
        print(f"[schedule] Error: {e}")


# ─── /api/agents/negotiate ────────────────────────────────────────────────────

@router.post("/negotiate", status_code=status.HTTP_202_ACCEPTED)
async def negotiate_offer(payload: NegotiateRequest, background_tasks: BackgroundTasks):
    """
    Use LLM to provide salary negotiation advice based on offer and prompt.
    """
    background_tasks.add_task(_run_negotiate_task, payload.offer_id, payload.prompt)
    return {"message": "Negotiation agent started"}


async def _run_negotiate_task(offer_id: str, prompt: str):
    """Generate negotiation advice and log it."""
    from apps.recruiter.models import Offer
    from langchain_core.messages import SystemMessage, HumanMessage

    from beanie import PydanticObjectId
    try:
        oid = PydanticObjectId(offer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid offer ID")
    offer = await Offer.get(oid)
    if not offer:
        return

    job = await RecruiterJob.get(offer.job_id)

    system_prompt = (
        "You are an expert salary negotiation coach. Based on the offer details and the "
        "candidate's request, provide clear negotiation advice. Output a JSON object with:\n"
        "  advice: str — 2-3 sentence actionable advice\n"
        "  recommended_counter: float — suggested counter salary (or same as offered if not advisable)\n"
        "  confidence: str — 'yes' | 'no' | 'maybe'\n"
        "  key_points: list[str] — 2-3 bullet points to use in negotiation\n"
        "Output ONLY the JSON object, no markdown."
    )
    offer_context = {
        "offer_id": offer_id,
        "salary_offered": offer.salary_offered,
        "job_title": job.title if job else "",
        "salary_range": f"{job.salary_min}-{job.salary_max}" if job else "",
    }
    prompt_content = f"Offer: {json.dumps(offer_context)}\nCandidate request: {prompt}"
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=prompt_content),
    ]

    try:
        from apps.agents.core import get_agent_llm
        llm = get_agent_llm(temperature=0.2)
        response = await llm.ainvoke(messages)
        advice = _parse_llm_json_response(response.content)

        event = AgentEvent(
            agent_type="SHARED",
            event_type="NEGOTIATE_OFFER",
            payload={
                "offer_id": offer_id,
                "prompt": prompt,
                "advice": advice,
            },
        )
        await event.insert()

    except Exception as e:
        print(f"[negotiate] Error: {e}")


# ─── /api/agents/screen ───────────────────────────────────────────────────────

@router.post("/screen", response_model=ScreenResponse)
async def screen_candidate(payload: ScreenRequest):
    """Direct call to HiringAgent.screen_resume."""
    resume_text = await _get_candidate_resume_text(payload.candidate_id)
    job = await RecruiterJob.get(payload.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    job_description = (
        f"{job.title}\n{job.description}\n"
        f"Requirements: {', '.join(job.requirements)}\nSkills: {', '.join(job.skills)}"
    )

    result = await hiring_agent.screen_resume(resume_text, job_description)

    # Log event
    event = AgentEvent(
        agent_type="HIRING",
        event_type="SCREEN_RESUME",
        payload={
            "candidate_id": payload.candidate_id,
            "job_id": payload.job_id,
            "scores": result,
        },
    )
    await event.insert()

    return ScreenResponse(**result)


# ─── /api/agents/rank ─────────────────────────────────────────────────────────

@router.post("/rank")
async def rank_candidates(payload: RankRequest):
    """
    Call HiringAgent.rank_candidates for all applicants of a given job.
    Returns ranked list sorted by overall_score descending.
    """
    job = await RecruiterJob.get(payload.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    applications = await Application.find(Application.job_id == payload.job_id).to_list()

    candidates_data = []
    for app in applications:
        resume_text = await _get_candidate_resume_text(app.candidate_id)
        profile = await CandidateProfile.find_one(CandidateProfile.user_id == app.candidate_id)
        candidates_data.append({
            "candidate_id": app.candidate_id,
            "resume_text": resume_text,
            "skills": profile.skills if profile else [],
            "experience_years": (
                sum(exp.get("years", 0) for exp in profile.experience)
                if profile and profile.experience
                else 0
            ),
        })

    job_description = (
        f"{job.title}\n{job.description}\n"
        f"Requirements: {', '.join(job.requirements)}\nSkills: {', '.join(job.skills)}"
    )

    ranked = await hiring_agent.rank_candidates(candidates_data, job_description)

    # Persist rankings to DB
    for item in ranked:
        ranking = await Ranking.find_one(
            Ranking.job_id == payload.job_id,
            Ranking.candidate_id == item.get("candidate_id"),
        )
        if not ranking:
            ranking = Ranking(
                job_id=payload.job_id,
                candidate_id=item.get("candidate_id"),
                resume_score=item.get("resume_score", 0),
                match_score=item.get("skill_match_score", 0),
                overall_score=item.get("overall_score", 0),
            )
        else:
            ranking.resume_score = item.get("resume_score", ranking.resume_score)
            ranking.match_score = item.get("skill_match_score", ranking.match_score)
            from apps.recruiter.router import compute_candidate_score
            ranking.overall_score = compute_candidate_score(
                ranking.resume_score,
                ranking.assessment_score,
                ranking.match_score,
            )
        await ranking.save()

    # Log event
    event = AgentEvent(
        agent_type="HIRING",
        event_type="RANK_CANDIDATES",
        payload={
            "job_id": payload.job_id,
            "ranked_count": len(ranked),
            "rankings": ranked,
        },
    )
    await event.insert()

    return {"job_id": payload.job_id, "rankings": ranked}


# ─── /api/agents/assess ───────────────────────────────────────────────────────

@router.post("/assess")
async def analyze_assessment_endpoint(
    candidate_id: str,
    assessment_results: dict,
    job_id: str,
):
    """
    Call HiringAgent.analyze_assessment to evaluate test results.
    """
    job = await RecruiterJob.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    result = await hiring_agent.analyze_assessment(
        assessment_results,
        job.requirements,
    )

    # Update ranking with assessment score
    ranking = await Ranking.find_one(
        Ranking.job_id == job_id,
        Ranking.candidate_id == candidate_id,
    )
    if ranking:
        ranking.assessment_score = result.get("technical_score", 0)
        from apps.recruiter.router import compute_candidate_score
        ranking.overall_score = compute_candidate_score(
            ranking.resume_score,
            ranking.assessment_score,
            ranking.match_score,
        )
        await ranking.save()

    # Log event
    event = AgentEvent(
        agent_type="HIRING",
        event_type="ANALYZE_ASSESSMENT",
        payload={
            "candidate_id": candidate_id,
            "job_id": job_id,
            "result": result,
        },
    )
    await event.insert()

    return result


# ─── /api/agents/draft-offer ──────────────────────────────────────────────────

@router.post("/draft-offer", response_model=DraftOfferResponse)
async def draft_offer_endpoint(payload: DraftOfferRequest):
    """
    Call HiringAgent.draft_offer to generate offer letter + salary recommendation.
    """
    profile = await CandidateProfile.find_one(CandidateProfile.user_id == payload.candidate_id)
    candidate_user = await User.get(payload.candidate_id)
    job = await RecruiterJob.get(payload.job_id)

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    company = await Company.get(job.company_id) if job.company_id else None

    candidate_dict = {
        "full_name": candidate_user.full_name if candidate_user else "",
        "skills": profile.skills if profile else [],
        "experience": profile.experience if profile else [],
    }
    job_dict = {
        "title": job.title,
        "description": job.description,
        "requirements": job.requirements,
        "skills": job.skills,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
    }
    company_dict = {
        "name": company.name if company else "",
        "description": company.description if company else "",
    }

    result = await hiring_agent.draft_offer(candidate_dict, job_dict, company_dict)

    # Log event
    event = AgentEvent(
        agent_type="HIRING",
        event_type="DRAFT_OFFER",
        payload={
            "candidate_id": payload.candidate_id,
            "job_id": payload.job_id,
            "result": result,
        },
    )
    await event.insert()

    return DraftOfferResponse(**result)