"""Public Jobs Router"""
from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def list_public_jobs(): return {"message": "List public jobs — WIP"}

@router.get("/{id}")
async def get_public_job(): return {"message": "Get public job — WIP"}

@router.post("/{id}/apply")
async def apply_to_job(): return {"message": "Apply to job — WIP"}