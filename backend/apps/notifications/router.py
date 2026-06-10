"""
Notifications Router
"""

from fastapi import APIRouter, Depends, HTTPException, status

from apps.auth.models import User
from apps.auth.security import get_current_user
from apps.notifications.models import Notification
from apps.notifications.schemas import NotificationOut, NotificationMarkRead

router = APIRouter()


@router.get("/", response_model=list[NotificationOut])
async def list_notifications(current_user: User = Depends(get_current_user)):
    """List current user's notifications, newest first."""
    notifications = (
        await Notification.find(Notification.user_id == str(current_user.id))
        .sort("-created_at")
        .to_list()
    )
    return [
        NotificationOut(
            id=str(n.id),
            user_id=n.user_id,
            type=n.type,
            title=n.title,
            message=n.message,
            read=n.read,
            related_id=n.related_id,
            created_at=n.created_at,
        )
        for n in notifications
    ]


@router.put("/{notif_id}/read", response_model=NotificationOut)
async def mark_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    notif = await Notification.get(notif_id)
    if not notif or notif.user_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.read = True
    await notif.save()
    return NotificationOut(
        id=str(notif.id),
        user_id=notif.user_id,
        type=notif.type,
        title=notif.title,
        message=notif.message,
        read=notif.read,
        related_id=notif.related_id,
        created_at=notif.created_at,
    )


@router.post("/mark-all-read")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    """Mark all current user's notifications as read."""
    updated = await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.read == False,
    ).set({"read": True})
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
async def unread_count(current_user: User = Depends(get_current_user)):
    """Return count of unread notifications."""
    count = await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.read == False,
    ).count()
    return {"unread_count": count}