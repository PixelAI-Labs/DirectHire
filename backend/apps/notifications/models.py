"""
Notification Models
"""

from beanie import Document
from datetime import datetime


class Notification(Document):
    user_id: str
    type: str  # e.g. "APPLICATION", "INTERVIEW", "ASSESSMENT", "OFFER", "OFFER_RESPONSE"
    title: str
    message: str
    read: bool = False
    related_id: str | None = None  # ID of the related entity (job_id, application_id, offer_id)
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "notifications"