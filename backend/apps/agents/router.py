"""Agent Orchestrator Router — Career Agent ↔ Hiring Agent"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/match")
async def match_candidate(): return {"message": "Match candidate — WIP"}

@router.post("/schedule")
async def schedule_interview(): return {"message": "Schedule interview — WIP"}

@router.post("/negotiate")
async def negotiate_offer(): return {"message": "Negotiate offer — WIP"}

@router.post("/analyze")
async def analyze_candidate(): return {"message": "Analyze candidate — WIP"}