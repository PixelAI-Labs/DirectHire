"""Recruiter Router — Jobs, Rankings, Offers"""
from fastapi import APIRouter, Depends, HTTPException, status
from beanie.operators import In

from apps.auth.models import User, UserRole
from apps.auth.security import get_current_user
from apps.candidate.models import Application, CandidateProfile
from apps.company.models import Company
from apps.jobs.schemas import JobPublicOut, CompanyPublicOut
from apps.recruiter.models import Job, Offer, Ranking
from apps.recruiter.schemas import (
    CandidateRankOut,
    JobCreate,
    JobOut,
    OfferCreate,
    OfferOut,
    RankingOut,
)
from apps.notifications.service import NotificationService

router = APIRouter()


def _require_recruiter(user: User) -> None:
    if user.role not in (UserRole.RECRUITER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access required",
        )


def compute_candidate_score(
    resume_score: float = 0.0,
    assessment_score: float = 0.0,
    match_score: float = 0.0,
    weights: dict = None,
) -> float:
    weights = weights or {"resume": 0.25, "assessment": 0.30, "match": 0.45}
    overall = (
        resume_score * weights["resume"]
        + assessment_score * weights["assessment"]
        + match_score * weights["match"]
    )
    return round(min(overall, 100.0), 2)


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)
    if current_user.company_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recruiter must be associated with a company",
        )

    company = await Company.get(current_user.company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # Generate mock embedding for semantic search (will be replaced in Phase 7)
    mock_embedding = [0.0] * 1536

    job = Job(
        company_id=current_user.company_id,
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements,
        skills=payload.skills,
        location=payload.location,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        role_type=payload.role_type,
        remote_option=payload.remote_option,
        status="OPEN",
        embedding=mock_embedding,
    )
    await job.insert()
    return JobOut(
        id=str(job.id),
        company_id=job.company_id,
        title=job.title,
        description=job.description,
        requirements=job.requirements,
        skills=job.skills,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        role_type=job.role_type,
        remote_option=job.remote_option,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/jobs", response_model=list[JobOut])
async def list_jobs(current_user: User = Depends(get_current_user)):
    _require_recruiter(current_user)

    if current_user.role == UserRole.ADMIN:
        jobs = await Job.find_all().to_list()
    else:
        jobs = await Job.find(Job.company_id == current_user.company_id).to_list()

    return [
        JobOut(
            id=str(j.id),
            company_id=j.company_id,
            title=j.title,
            description=j.description,
            requirements=j.requirements,
            skills=j.skills,
            location=j.location,
            salary_min=j.salary_min,
            salary_max=j.salary_max,
            role_type=j.role_type,
            remote_option=j.remote_option,
            status=j.status,
            created_at=j.created_at,
        )
        for j in jobs
    ]


@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateRankOut])
async def get_job_candidates(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)

    job = await Job.find_one(Job.id == job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if current_user.role == UserRole.RECRUITER and job.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view candidates for this job",
        )

    applications = await Application.find(Application.job_id == job_id).to_list()

    results: list[CandidateRankOut] = []
    for app in applications:
        ranking = await Ranking.find_one(
            Ranking.job_id == job_id,
            Ranking.candidate_id == app.candidate_id,
        )
        resume_score = ranking.resume_score if ranking else 0.0
        assessment_score = ranking.assessment_score if ranking else 0.0
        match_score = app.match_score or 0.0
        overall_score = compute_candidate_score(resume_score, assessment_score, match_score)

        candidate_profile = await CandidateProfile.find_one(
            CandidateProfile.user_id == app.candidate_id
        )
        candidate_user = await User.find_one(User.id == app.candidate_id)

        if candidate_user is None:
            continue

        results.append(
            CandidateRankOut(
                candidate_id=app.candidate_id,
                full_name=candidate_user.full_name,
                email=candidate_user.email,
                resume_score=resume_score,
                assessment_score=assessment_score,
                match_score=match_score,
                overall_score=overall_score,
                skills=candidate_profile.skills if candidate_profile else [],
                application_status=app.status,
            )
        )

    results.sort(key=lambda x: x.overall_score, reverse=True)
    return results


@router.get("/rankings", response_model=list[RankingOut])
async def get_rankings(current_user: User = Depends(get_current_user)):
    _require_recruiter(current_user)

    if current_user.role == UserRole.ADMIN:
        rankings = await Ranking.find_all().to_list()
    else:
        jobs = await Job.find(Job.company_id == current_user.company_id).to_list()
        if not jobs:
            return []

        job_ids = [str(j.id) for j in jobs]
        rankings = await Ranking.find(In(Ranking.job_id, job_ids)).to_list()

    return [
        RankingOut(
            id=str(r.id),
            job_id=r.job_id,
            candidate_id=r.candidate_id,
            resume_score=r.resume_score,
            assessment_score=r.assessment_score,
            match_score=r.match_score,
            overall_score=r.overall_score,
            created_at=r.created_at,
        )
        for r in rankings
    ]


@router.post("/offers", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferCreate,
    current_user: User = Depends(get_current_user),
):
    _require_recruiter(current_user)

    job = await Job.find_one(Job.id == payload.job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if current_user.role == UserRole.RECRUITER and job.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create offers for this job",
        )

    candidate = await User.find_one(User.id == payload.candidate_id, User.role == UserRole.CANDIDATE)
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    offer = Offer(
        job_id=payload.job_id,
        candidate_id=payload.candidate_id,
        recruiter_id=str(current_user.id),
        salary_offered=payload.salary_offered,
        benefits=payload.benefits,
        message=payload.message,
        status="PENDING",
    )
    await offer.insert()

    # Notify candidate
    await NotificationService.notify_offer_created(
        payload.candidate_id, payload.job_id, job.title, str(offer.id)
    )

    return OfferOut(
        id=str(offer.id),
        job_id=offer.job_id,
        candidate_id=offer.candidate_id,
        recruiter_id=offer.recruiter_id,
        salary_offered=offer.salary_offered,
        benefits=offer.benefits,
        status=offer.status,
        message=offer.message,
        created_at=offer.created_at,
    )


@router.put("/offers/{offer_id}/status", response_model=OfferOut)
async def update_offer_status(
    offer_id: str,
    status: str,
    current_user: User = Depends(get_current_user),
):
    """Update offer status (ACCEPTED / REJECTED). Candidates only."""
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can accept or reject offers",
        )

    if status not in ("ACCEPTED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be ACCEPTED or REJECTED",
        )

    offer = await Offer.get(offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    if offer.candidate_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your offer",
        )

    offer.status = status
    await offer.save()

    # Fetch job and candidate name for notification
    job = await Job.get(offer.job_id)
    job_title = job.title if job else "Unknown Position"
    candidate_name = current_user.full_name

    if status == "ACCEPTED":
        await NotificationService.notify_offer_accepted(
            offer.recruiter_id, candidate_name, job_title
        )
    else:
        await NotificationService.notify_offer_rejected(
            offer.recruiter_id, candidate_name, job_title
        )

    # Fetch job for response
    jobs_map = {}
    if job:
        from apps.company.models import Company

        company = await Company.get(job.company_id)
        if company:
            company_out = CompanyPublicOut(
                id=str(company.id),
                name=company.name,
                logo_url=company.logo_url,
                description=company.description,
                website=company.website,
            )
            from apps.jobs.schemas import JobPublicOut

            jobs_map[str(job.id)] = JobPublicOut(
                id=str(job.id),
                company_id=job.company_id,
                title=job.title,
                description=job.description,
                requirements=job.requirements,
                skills=job.skills,
                location=job.location,
                salary_min=job.salary_min,
                salary_max=job.salary_max,
                role_type=job.role_type,
                remote_option=job.remote_option,
                status=job.status,
                created_at=job.created_at,
                company=company_out,
            )

    return OfferOut(
        id=str(offer.id),
        job_id=offer.job_id,
        candidate_id=offer.candidate_id,
        recruiter_id=offer.recruiter_id,
        salary_offered=offer.salary_offered,
        benefits=offer.benefits,
        status=offer.status,
        message=offer.message,
        created_at=offer.created_at,
        job=jobs_map.get(offer.job_id),
    )