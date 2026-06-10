"""
Notification Schemas
"""

from datetime import datetime
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    read: bool
    related_id: str | None
    created_at: datetime


class NotificationMarkRead(BaseModel):
    read: bool = True