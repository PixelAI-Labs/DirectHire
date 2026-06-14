"""Analytics Router — dashboard aggregations."""
from fastapi import APIRouter, Depends

from apps.auth.models import User
from apps.auth.security import get_current_user
from apps.analytics.service import aggregate_dashboard

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Aggregated dashboard stats for the calling user.

    Recruiter → company-scoped. Admin → all data. Candidate → zero counts.
    """
    return await aggregate_dashboard(current_user)


@router.get("/pipeline")
async def get_pipeline_data(current_user: User = Depends(get_current_user)):
    """Pipeline stage counts only — same shape as dashboard.pipeline_stages."""
    data = await aggregate_dashboard(current_user)
    return data["pipeline_stages"]
