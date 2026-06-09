"""Notifications Router"""
from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def list_notifications(): return {"message": "List notifications — WIP"}

@router.put("/{id}/read")
async def mark_read(): return {"message": "Mark as read — WIP"}