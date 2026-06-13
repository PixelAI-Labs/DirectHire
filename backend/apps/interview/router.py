"""Interview Router"""
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from apps.auth.models import User, UserRole
from apps.auth.security import get_current_user
from apps.recruiter.models import Job
from apps.interview.models import Interview
from apps.interview.schemas import (
    InterviewCreate,
    InterviewOut,
    InterviewUpdate,
)
from apps.interview.stt_service import STTService
from apps.interview.ai_service import InterviewAIService
from apps.interview.evaluation_service import InterviewEvaluationService
from apps.notifications.service import NotificationService

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB
SUPPORTED_AUDIO_TYPES = {"audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav"}


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
        transcript=i.transcript,
        qa_history=i.qa_history,
        evaluation_summary=i.evaluation_summary,
        overall_score=i.overall_score,
        strengths=i.strengths,
        weaknesses=i.weaknesses,
        created_at=i.created_at,
    )


async def _safe_get_interview(interview_id: str) -> Interview:
    """Fetch an Interview by id, returning HTTP 400 for malformed IDs.

    Beanie's Document.get() raises pydantic_core.ValidationError inside
    get() for non-ObjectId strings, so the simple `if not interview`
    pattern returns 500. This wrapper converts first, then fetches.
    """
    from beanie import PydanticObjectId
    try:
        oid = PydanticObjectId(interview_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid interview ID")
    interview = await Interview.get(oid)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.post("/", response_model=InterviewOut, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreate,
    current_user: User = Depends(get_current_user),
):
    """Recruiter schedules an interview."""
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

    interview = Interview(
        job_id=payload.job_id,
        candidate_id=payload.candidate_id,
        recruiter_id=str(current_user.id),
        scheduled_at=payload.scheduled_at,
        format=payload.format,
        status="SCHEDULED",
    )
    await interview.insert()
    try:
        await NotificationService.notify_interview_scheduled(
            candidate_id=interview.candidate_id,
            recruiter_id=interview.recruiter_id,
            job_title=job.title,
            interview_id=str(interview.id)
        )
    except Exception:
        logger.exception("Failed to send interview notification")
    
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
    interview = await _safe_get_interview(interview_id)

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
    interview = await _safe_get_interview(interview_id)

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

    interview = await _safe_get_interview(interview_id)

    if interview.recruiter_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    interview.status = "CANCELLED"
    await interview.save()


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an audio file and get a transcription via Whisper Large v3."""
    if file.content_type not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported audio file type")

    audio_bytes = b""
    while chunk := await file.read(8192):
        audio_bytes += chunk
        if len(audio_bytes) > MAX_AUDIO_SIZE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audio file must be 10MB or smaller")
    if not audio_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file")

    stt_service = STTService()
    transcript = await stt_service.transcribe(audio_bytes)
    return {"transcript": transcript}


@router.get("/job/{job_id}", response_model=list[InterviewOut])
async def list_interviews_for_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    """List all interviews for a specific job."""
    interviews = await Interview.find(Interview.job_id == job_id).to_list()
    return [_interview_to_out(i) for i in interviews]


@router.post("/{interview_id}/answer")
async def submit_answer(
    interview_id: str,
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Append a Q&A pair to the interview document."""
    interview = await _safe_get_interview(interview_id)

    if (
        current_user.role == UserRole.CANDIDATE
        and interview.candidate_id != str(current_user.id)
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    question = body.get("question", "")
    answer = body.get("answer", "")
    if not question or not answer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question and answer are required")

    interview.qa_history.append({"question": question, "answer": answer})
    interview.transcript = "\n\n".join(
        f"Q{idx + 1}: {qa['question']}\nA{idx + 1}: {qa['answer']}"
        for idx, qa in enumerate(interview.qa_history)
    )
    await interview.save()
    return _interview_to_out(interview)


@router.post("/{interview_id}/question")
async def generate_next_question(
    interview_id: str,
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Generate the next interview question using Gemini.
    Body: { previous_qa: list[dict] }
    """
    interview = await _safe_get_interview(interview_id)

    if (
        current_user.role == UserRole.CANDIDATE
        and interview.candidate_id != str(current_user.id)
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    job = await Job.get(interview.job_id)
    job_title = job.title if job else ""
    skills = list(job.skills) if job and job.skills else []
    previous_qa = body.get("previous_qa", [])

    ai_service = InterviewAIService()
    question = await ai_service.generate_question(job_title, skills, previous_qa)
    return {"question": question}


@router.post("/{interview_id}/evaluate")
async def evaluate_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
):
    """Evaluate the interview session and persist scores to the Interview document."""
    interview = await _safe_get_interview(interview_id)

    if (
        current_user.role == UserRole.CANDIDATE
        and interview.candidate_id != str(current_user.id)
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Fetch job details for context
    job = await Job.get(interview.job_id)
    job_title = job.title if job else ""
    skills = list(job.skills) if job and job.skills else []

    eval_service = InterviewEvaluationService()
    result = await eval_service.evaluate_session(
        qa_history=interview.qa_history,
        job_title=job_title,
        skills=skills,
    )

    # Persist evaluation to the interview document
    interview.communication_score = result["communication_score"]
    interview.technical_score = result["technical_score"]
    interview.confidence_score = result["confidence_score"]
    interview.behavioral_analysis = result["behavioral_analysis"]
    interview.evaluation_summary = result["summary"]
    interview.overall_score = result["overall_score"]
    interview.strengths = result.get("strengths", [])
    interview.weaknesses = result.get("weaknesses", [])
    interview.status = "COMPLETED"
    await interview.save()

    return result