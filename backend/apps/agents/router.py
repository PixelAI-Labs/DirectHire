"""Agent Orchestrator Router"""
from fastapi import APIRouter, BackgroundTasks, status
import asyncio

from apps.agents.models import AgentEvent
from apps.agents.schemas import AnalyzeRequest, MatchRequest, ScheduleRequest, NegotiateRequest

router = APIRouter()

async def mock_agent_task(agent_type: str, event_type: str, payload: dict):
    """Mocks a background agent process and logs the event."""
    await asyncio.sleep(2)  # Simulate processing time
    event = AgentEvent(
        agent_type=agent_type,
        event_type=event_type,
        payload=payload
    )
    await event.insert()
    print(f"[{agent_type}] Completed {event_type} task for payload: {payload}")

@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
async def analyze_candidate(payload: AnalyzeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        mock_agent_task, 
        agent_type="SHARED", 
        event_type="FULL_ANALYSIS", 
        payload={"candidate_id": payload.candidate_id}
    )
    return {"message": "Analysis started in background", "candidate_id": payload.candidate_id}

@router.post("/match", status_code=status.HTTP_202_ACCEPTED)
async def match_candidate(payload: MatchRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        mock_agent_task, 
        agent_type="SHARED", 
        event_type="MATCH_EVALUATION", 
        payload={"candidate_id": payload.candidate_id, "job_id": payload.job_id}
    )
    return {"message": "Match evaluation started in background"}

@router.post("/schedule", status_code=status.HTTP_202_ACCEPTED)
async def schedule_interview(payload: ScheduleRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        mock_agent_task, 
        agent_type="SHARED", 
        event_type="SCHEDULE_INTERVIEW", 
        payload={"candidate_id": payload.candidate_id, "job_id": payload.job_id, "prompt": payload.prompt}
    )
    return {"message": "Scheduling agent started"}

@router.post("/negotiate", status_code=status.HTTP_202_ACCEPTED)
async def negotiate_offer(payload: NegotiateRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        mock_agent_task, 
        agent_type="SHARED", 
        event_type="NEGOTIATE_OFFER", 
        payload={"offer_id": payload.offer_id, "prompt": payload.prompt}
    )
    return {"message": "Negotiation agent started"}