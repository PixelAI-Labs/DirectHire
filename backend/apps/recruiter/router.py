"""Recruiter Router — Jobs, Rankings, Offers"""
from fastapi import APIRouter
router = APIRouter()

@router.get("/jobs")
async def list_jobs(): return {"message": "List jobs — WIP"}

@router.post("/jobs")
async def create_job(): return {"message": "Create job — WIP"}

@router.get("/rankings")
async def get_rankings(): return {"message": "Get rankings — WIP"}

@router.post("/offers")
async def create_offer(): return {"message": "Create offer — WIP"}