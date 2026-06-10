"""Interview Router"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status

from apps.auth.models import User, UserRole
from apps.auth.security import get_current_user
from apps.recruiter.models import Job
from apps.interview.models import Interview
from apps.interview.schemas import (
    InterviewCreate,
    InterviewOut,
    InterviewUpdate,
)

router = APIRouter()


def _interview_to_out(i: Interview) -> InterviewOut:
    return InterviewOut(
        id=str(i.id),
        job_id=i.job_id,
        candidate_id=i.candidate_id,
        recruiter_id=i.recruiter_id,
        scheduled_at=i.scheduled_at,
        format=i.format,
        status=i.status,
        notes=i.notes,
        communication_score=i.communication_score,
        technical_score=i.technical_score,
        confidence_score=i.confidence_score,
        behavioral_analysis=i.behavioral_analysis,
        created_at=i.created_at,
    )


@router.post("/", response_model=InterviewOut, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreate,
    current_user: User = Depends(get_current_user),
):
    """Recruiter schedules an interview."""
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recruiter only")

    job = await Job.find_one(Job.id == payload.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    interview = Interview(
        job_id=payload.job_id,
        candidate_id=payload.candidate_id,
        recruiter_id=str(current_user.id),
        scheduled_at=payload.scheduled_at,
        format=payload.format,
        status="SCHEDULED",
    )
    await interview.insert()
    return _interview_to_out(interview)


@router.get("/", response_model=list[InterviewOut])
async def list_interviews(current_user: User = Depends(get_current_user)):
    """Users see their interviews — candidates see theirs, recruiters see theirs."""
    if current_user.role == UserRole.CANDIDATE:
        interviews = await Interview.find(
            Interview.candidate_id == str(current_user.id)
        ).to_list()
    else:
        interviews = await Interview.find(
            Interview.recruiter_id == str(current_user.id)
        ).to_list()
    return [_interview_to_out(i) for i in interviews]


@router.get("/{interview_id}", response_model=InterviewOut)
async def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a single interview."""
    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    if current_user.role == UserRole.CANDIDATE and interview.candidate_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if current_user.role == UserRole.RECRUITER and interview.recruiter_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return _interview_to_out(interview)


@router.put("/{interview_id}", response_model=InterviewOut)
async def update_interview(
    interview_id: str,
    payload: InterviewUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update interview details, notes, or scores."""
    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    # Candidates can only update their own interviews
    if current_user.role == UserRole.CANDIDATE and interview.candidate_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Recruiters can update any field
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(interview, field, value)

    await interview.save()
    return _interview_to_out(interview)


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
):
    """Recruiter cancels/deletes an interview."""
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recruiter only")

    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    if interview.recruiter_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    interview.status = "CANCELLED"
    await interview.save()


@router.get("/job/{job_id}", response_model=list[InterviewOut])
async def list_interviews_for_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    """List all interviews for a specific job."""
    interviews = await Interview.find(Interview.job_id == job_id).to_list()
    return [_interview_to_out(i) for i in interviews]