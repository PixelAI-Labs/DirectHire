"""Agent Models"""
from beanie import Document
from datetime import datetime

class AgentEvent(Document):
    agent_type: str  # CAREER or HIRING
    event_type: str
    payload: dict = {}
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "agent_events"