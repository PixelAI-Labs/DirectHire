"""
Candidate Router — Profile, Resumes, Applications
"""
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from beanie.operators import In
from bson.errors import InvalidId

from core.config import settings
from apps.auth.models import User, UserRole
from apps.auth.security import get_current_user
from apps.candidate.models import CandidateProfile, Resume, Application
from apps.recruiter.models import Job, Offer
from apps.company.models import Company
from apps.jobs.schemas import JobPublicOut, CompanyPublicOut
from apps.candidate.schemas import (
    CandidateProfileOut,
    CandidateProfileUpdate,
    ResumeOut,
    ApplicationOut,
    OfferOut
)
from apps.candidate.gemma_ocr_service import extract_resume_with_gemma
from apps.upload.router import save_upload_file

logger = logging.getLogger(__name__)

router = APIRouter()

def _require_candidate(user: User) -> None:
    if user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required",
        )

@router.get("/profile", response_model=CandidateProfileOut)
async def get_profile(current_user: User = Depends(get_current_user)):
    _require_candidate(current_user)
    profile = await CandidateProfile.find_one(CandidateProfile.user_id == str(current_user.id))
    if not profile:
        profile = CandidateProfile(user_id=str(current_user.id))
        await profile.insert()
        
    return CandidateProfileOut(
        id=str(profile.id),
        user_id=profile.user_id,
        resume_url=profile.resume_url,
        skills=profile.skills,
        experience=profile.experience,
        education=profile.education,
        preferences=profile.preferences,
        created_at=profile.created_at
    )

@router.put("/profile", response_model=CandidateProfileOut)
async def update_profile(
    payload: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    _require_candidate(current_user)
    profile = await CandidateProfile.find_one(CandidateProfile.user_id == str(current_user.id))
    if not profile:
        profile = CandidateProfile(user_id=str(current_user.id))
        await profile.insert()
        
    if payload.skills is not None:
        profile.skills = payload.skills
    if payload.experience is not None:
        profile.experience = payload.experience
    if payload.education is not None:
        profile.education = payload.education
    if payload.preferences is not None:
        profile.preferences = payload.preferences
        
    await profile.save()
    
    return CandidateProfileOut(
        id=str(profile.id),
        user_id=profile.user_id,
        resume_url=profile.resume_url,
        skills=profile.skills,
        experience=profile.experience,
        education=profile.education,
        preferences=profile.preferences,
        created_at=profile.created_at
    )

@router.post("/resume", response_model=ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    _require_candidate(current_user)

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Use shared upload utility
    prefix = f"{current_user.id}_"
    file_path, _ = await save_upload_file(file, "resumes", prefix=prefix)

    # Extract text using Gemma 27B / pypdf
    parsed_text = await extract_resume_with_gemma(file_path)

    # Check if a resume already exists for the user
    resume = await Resume.find_one(Resume.user_id == str(current_user.id))
    if resume:
        resume.file_path = file_path
        resume.parsed_text = parsed_text
        await resume.save()
    else:
        resume = Resume(
            user_id=str(current_user.id),
            file_path=file_path,
            parsed_text=parsed_text
        )
        await resume.insert()

    # Update candidate profile with resume URL (just a local path for now)
    profile = await CandidateProfile.find_one(CandidateProfile.user_id == str(current_user.id))
    if profile:
        profile.resume_url = f"/uploads/resumes/{os.path.basename(file_path)}"
        await profile.save()

    return ResumeOut(
        id=str(resume.id),
        user_id=resume.user_id,
        file_path=resume.file_path,
        parsed_text=resume.parsed_text,
        created_at=resume.created_at
    )

async def _fetch_jobs_for_items(items):
    job_ids = list(set([item.job_id for item in items]))
    if not job_ids:
        return {}
    
    from beanie import PydanticObjectId
    obj_job_ids = []
    for jid in job_ids:
        try:
            obj_job_ids.append(PydanticObjectId(jid))
        except (ValueError, TypeError, InvalidId):
            logger.warning("dropping malformed job_id: %r", jid)
    
    jobs = await Job.find(In(Job.id, obj_job_ids)).to_list()
    company_ids = list(set([j.company_id for j in jobs]))
    
    obj_comp_ids = []
    for cid in company_ids:
        try:
            obj_comp_ids.append(PydanticObjectId(cid))
        except (ValueError, TypeError, InvalidId):
            logger.warning("dropping malformed company_id: %r", cid)
            
    companies = await Company.find(In(Company.id, obj_comp_ids)).to_list()
    company_map = {str(c.id): c for c in companies}
    
    jobs_map = {}
    for j in jobs:
        c = company_map.get(j.company_id)
        if c:
            company_out = CompanyPublicOut(
                id=str(c.id),
                name=c.name,
                logo_url=c.logo_url,
                description=c.description,
                website=c.website,
            )
            jobs_map[str(j.id)] = JobPublicOut(
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
                company=company_out
            )
    return jobs_map

@router.get("/applications", response_model=list[ApplicationOut])
async def get_applications(current_user: User = Depends(get_current_user)):
    _require_candidate(current_user)
    
    applications = await Application.find(Application.candidate_id == str(current_user.id)).to_list()
    jobs_map = await _fetch_jobs_for_items(applications)
    
    results = []
    for app in applications:
        results.append(ApplicationOut(
            id=str(app.id),
            job_id=app.job_id,
            candidate_id=app.candidate_id,
            status=app.status,
            match_score=app.match_score,
            created_at=app.created_at,
            job=jobs_map.get(app.job_id)
        ))
    return results

@router.get("/offers", response_model=list[OfferOut])
async def get_offers(current_user: User = Depends(get_current_user)):
    _require_candidate(current_user)
    
    offers = await Offer.find(Offer.candidate_id == str(current_user.id)).to_list()
    jobs_map = await _fetch_jobs_for_items(offers)
    
    results = []
    for o in offers:
        results.append(OfferOut(
            id=str(o.id),
            job_id=o.job_id,
            candidate_id=o.candidate_id,
            recruiter_id=o.recruiter_id,
            salary_offered=o.salary_offered,
            benefits=o.benefits,
            status=o.status,
            message=o.message,
            created_at=o.created_at,
            job=jobs_map.get(o.job_id)
        ))
    return results
