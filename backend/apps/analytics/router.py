"""Analytics Router"""
from fastapi import APIRouter
router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(): return {"message": "Dashboard stats — WIP"}

@router.get("/pipeline")
async def get_pipeline_data(): return {"message": "Pipeline data — WIP"}