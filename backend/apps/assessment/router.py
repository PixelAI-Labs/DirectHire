from datetime import timezone
"""Assessment Router"""
import json
import re
from fastapi import APIRouter, Depends, HTTPException, status

from apps.auth.models import User, UserRole
from apps.auth.security import get_current_user
from apps.recruiter.models import Job, Ranking
from apps.recruiter.router import compute_candidate_score
from apps.assessment.models import Assessment
from apps.assessment.schemas import (
    AssessmentCreate,
    AssessmentOut,
    AssessmentSubmit,
    AssessmentEvaluate,
)
from apps.notifications.service import NotificationService

router = APIRouter()


def _parse_llm_json_response(response_content: str) -> list[str]:
    """Strip markdown fences and parse a JSON list of questions from LLM response."""
    raw = response_content.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw).strip()
        raw = re.sub(r"\s*```$", "", raw).strip()
    parsed = json.loads(raw)
    if isinstance(parsed, dict) and "questions" in parsed:
        return parsed["questions"]
    if isinstance(parsed, list):
        return parsed
    return []


async def _generate_questions(job: Job) -> list[str]:
    """Use LLM to generate 5 technical/coding questions for a job."""
    from langchain_core.messages import SystemMessage, HumanMessage

    job_description = (
        f"Job Title: {job.title}\n"
        f"Description: {job.description}\n"
        f"Requirements: {', '.join(job.requirements)}\n"
        f"Skills: {', '.join(job.skills)}"
    )
    system_prompt = (
        "You are a technical hiring assistant. Generate exactly 5 interview/coding "
        "questions suitable for evaluating a candidate for the job described. "
        "Output ONLY a JSON array of strings — no markdown, no explanation. "
        'Example: ["Question 1?", "Question 2?", ...]'
    )
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Job details:\n{job_description}"),
    ]
    try:
        from apps.agents.core import get_agent_llm
        llm = get_agent_llm(temperature=0.2)
        response = await llm.ainvoke(messages)
        return _parse_llm_json_response(response.content)
    except Exception as e:
        print(f"[assessment] LLM question generation failed: {e}")
        return []


def _assessment_to_out(a: Assessment) -> AssessmentOut:
    return AssessmentOut(
        id=str(a.id),
        job_id=a.job_id,
        candidate_id=a.candidate_id,
        recruiter_id=a.recruiter_id,
        title=a.title,
        questions=a.questions,
        candidate_answers=a.candidate_answers,
        status=a.status,
        technical_score=a.technical_score,
        coding_score=a.coding_score,
        reasoning_score=a.reasoning_score,
        ai_feedback=a.ai_feedback,
        created_at=a.created_at,
        submitted_at=a.submitted_at,
    )


@router.post("/", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: AssessmentCreate,
    current_user: User = Depends(get_current_user),
):
    """Recruiter creates an assessment for a candidate."""
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recruiter only")

    from beanie import PydanticObjectId
    try:
        oid = PydanticObjectId(payload.job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    job = await Job.get(oid)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    questions = payload.questions
    if not questions:
        questions = await _generate_questions(job)

    assessment = Assessment(
        job_id=payload.job_id,
        candidate_id=payload.candidate_id,
        recruiter_id=str(current_user.id),
        title=payload.title,
        questions=questions,
        status="ASSIGNED",
    )
    await assessment.insert()
    
    await NotificationService.notify_assessment_assigned(
        candidate_id=assessment.candidate_id,
        job_title=job.title
    )
    
    return _assessment_to_out(assessment)


@router.get("/", response_model=list[AssessmentOut])
async def list_assessments(current_user: User = Depends(get_current_user)):
    """Candidates see their assessments; recruiters see their created assessments."""
    if current_user.role == UserRole.CANDIDATE:
        assessments = await Assessment.find(
            Assessment.candidate_id == str(current_user.id)
        ).to_list()
    else:
        assessments = await Assessment.find(
            Assessment.recruiter_id == str(current_user.id)
        ).to_list()
    return [_assessment_to_out(a) for a in assessments]


@router.get("/{assessment_id}", response_model=AssessmentOut)
async def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a single assessment."""
    assessment = await Assessment.get(assessment_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    # Candidates can only view their own; recruiters can view theirs
    if current_user.role == UserRole.CANDIDATE and assessment.candidate_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if current_user.role == UserRole.RECRUITER and assessment.recruiter_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return _assessment_to_out(assessment)


@router.post("/{assessment_id}/submit", response_model=AssessmentOut)
async def submit_assessment(
    assessment_id: str,
    payload: AssessmentSubmit,
    current_user: User = Depends(get_current_user),
):
    """Candidate submits answers."""
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidate only")

    assessment = await Assessment.get(assessment_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    if assessment.candidate_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if assessment.status not in ("ASSIGNED", "IN_PROGRESS"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit assessment in status: {assessment.status}",
        )

    from datetime import datetime
    assessment.candidate_answers = payload.answers
    assessment.status = "SUBMITTED"
    assessment.submitted_at = datetime.now(timezone.utc)
    await assessment.save()
    return _assessment_to_out(assessment)


@router.post("/{assessment_id}/evaluate", response_model=AssessmentOut)
async def evaluate_assessment(
    assessment_id: str,
    payload: AssessmentEvaluate,
    current_user: User = Depends(get_current_user),
):
    """Recruiter/AI evaluates a submitted assessment and updates Ranking."""
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recruiter only")

    assessment = await Assessment.get(assessment_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    if assessment.recruiter_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if assessment.status != "SUBMITTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot evaluate assessment in status: {assessment.status}",
        )

    assessment.technical_score = payload.technical_score
    assessment.coding_score = payload.coding_score
    assessment.reasoning_score = payload.reasoning_score
    assessment.ai_feedback = payload.ai_feedback
    assessment.status = "EVALUATED"
    await assessment.save()

    # Update Ranking with assessment_score
    ranking = await Ranking.find_one(
        Ranking.job_id == assessment.job_id,
        Ranking.candidate_id == assessment.candidate_id,
    )
    if ranking:
        ranking.assessment_score = payload.technical_score
        ranking.overall_score = compute_candidate_score(
            ranking.resume_score,
            ranking.assessment_score,
            ranking.match_score,
        )
        await ranking.save()
    else:
        ranking = Ranking(
            job_id=assessment.job_id,
            candidate_id=assessment.candidate_id,
            assessment_score=payload.technical_score,
            overall_score=compute_candidate_score(
                0.0, payload.technical_score, 0.0
            ),
        )
        await ranking.insert()

    return _assessment_to_out(assessment)


@router.get("/job/{job_id}", response_model=list[AssessmentOut])
async def list_assessments_for_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    """List all assessments for a specific job."""
    assessments = await Assessment.find(Assessment.job_id == job_id).to_list()
    return [_assessment_to_out(a) for a in assessments]