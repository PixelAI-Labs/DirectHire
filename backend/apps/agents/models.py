from datetime import timezone
"""Agent Models"""
from beanie import Document
from datetime import datetime

class AgentEvent(Document):
    agent_type: str  # CAREER or HIRING
    event_type: str
    payload: dict = {}
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "agent_events"