"""Public Jobs Router"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie.operators import RegEx, Or, In
from math import ceil

from apps.auth.models import User, UserRole
from apps.auth.security import get_current_user
from apps.candidate.models import Application
from apps.company.models import Company
from apps.recruiter.models import Job
from apps.jobs.schemas import JobPublicOut, CompanyPublicOut
from apps.recruiter.schemas import JobOut

router = APIRouter()


@router.get("/", response_model=dict)
async def list_public_jobs(
    q: str | None = Query(None, description="Search query for title or description"),
    location: str | None = Query(None, description="Location filter"),
    min_salary: float | None = Query(None, description="Minimum salary filter"),
    role_type: str | None = Query(None, description="Role type (e.g. FULL_TIME)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = {"status": "OPEN"}
    
    if q:
        query["$text"] = {"$search": q}
        
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
        
    if role_type:
        query["role_type"] = role_type
        
    if min_salary is not None:
        query["salary_min"] = {"$gte": min_salary}

    skip = (page - 1) * limit
    
    total = await Job.find(query).count()
    jobs = await Job.find(query).skip(skip).limit(limit).to_list()
    
    # We need to map JobOut for these, but often for public listings, you might want to attach the company.
    # We will just return JobOut for the list to keep it lightweight, or attach company if needed.
    # Let's attach company so the UI can show the company name.
    
    company_ids = list(set([j.company_id for j in jobs]))
    companies = await Company.find(In(Company.id, company_ids)).to_list()
    company_map = {str(c.id): c for c in companies}
    
    results = []
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
            job_out = JobPublicOut(
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
            results.append(job_out)
            
    return {
        "data": results,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": ceil(total / limit) if limit else 0
        }
    }


@router.get("/{id}", response_model=JobPublicOut)
async def get_public_job(id: str):
    job = await Job.get(id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    company = await Company.get(job.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    company_out = CompanyPublicOut(
        id=str(company.id),
        name=company.name,
        logo_url=company.logo_url,
        description=company.description,
        website=company.website,
    )
    
    return JobPublicOut(
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
        company=company_out
    )


@router.post("/{id}/apply", response_model=dict, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    id: str,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can apply to jobs",
        )
        
    job = await Job.get(id)
    if not job or job.status != "OPEN":
        raise HTTPException(status_code=404, detail="Job not found or not open")
        
    # Check if already applied
    existing_app = await Application.find_one(
        Application.job_id == id,
        Application.candidate_id == str(current_user.id)
    )
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied to this job")
        
    application = Application(
        job_id=id,
        candidate_id=str(current_user.id),
        status="APPLIED"
    )
    await application.insert()
    
    return {"message": "Application submitted successfully", "application_id": str(application.id)}