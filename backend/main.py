"""
DirectHire API
FastAPI application entry point
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings

app = FastAPI(
    title="DirectHire API",
    description="Autonomous multi-agent recruitment ecosystem",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

# Router imports (will be uncommented as modules are built)
from apps.auth.router import router as auth_router
from apps.candidate.router import router as candidate_router
from apps.recruiter.router import router as recruiter_router
from apps.company.router import router as company_router
from apps.jobs.router import router as jobs_router
from apps.agents.router import router as agents_router
# from apps.assessment.router import router as assessment_router
# from apps.interview.router import router as interview_router
# from apps.notifications.router import router as notifications_router

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(candidate_router, prefix="/api/candidate", tags=["Candidate"])
app.include_router(recruiter_router, prefix="/api/recruiter", tags=["Recruiter"])
app.include_router(company_router, prefix="/api/companies", tags=["Companies"])
app.include_router(jobs_router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(agents_router, prefix="/api/agents", tags=["Agents"])
# app.include_router(assessment_router, prefix="/api/assessments", tags=["Assessments"])
# app.include_router(interview_router, prefix="/api/interviews", tags=["Interviews"])
# app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
