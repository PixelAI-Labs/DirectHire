"""
Candidate Router — Profile, Resumes, Applications
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/profile")
async def get_profile():
    return {"message": "Get profile — WIP"}

@router.put("/profile")
async def update_profile():
    return {"message": "Update profile — WIP"}

@router.post("/resume")
async def upload_resume():
    return {"message": "Upload resume — WIP"}

@router.get("/applications")
async def get_applications():
    return {"message": "Get applications — WIP"}
