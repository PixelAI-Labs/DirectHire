"""Assessment Router"""
from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def list_assessments(): return {"message": "List assessments — WIP"}

@router.post("/")
async def create_assessment(): return {"message": "Create assessment — WIP"}