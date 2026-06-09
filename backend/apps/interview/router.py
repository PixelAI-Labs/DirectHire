"""Interview Router — EchoHire Integration"""
from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def list_interviews(): return {"message": "List interviews — WIP"}

@router.post("/")
async def schedule_interview(): return {"message": "Schedule interview — WIP"}