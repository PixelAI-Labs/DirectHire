"""Tests for /api/analytics/dashboard — resolves review finding #2 (backend half).

The current analytics/router.py is a WIP stub. These tests drive a real aggregator
that reads Application.status (NOT the non-existent Ranking.application_status) so
the Recruiter Dashboard can render pipeline counts and top candidates.

Response shape expected:
{
  "open_jobs": int,
  "total_candidates": int,             # distinct candidate_ids with Application on recruiter's jobs
  "candidates_in_pipeline": int,       # applications not REJECTED/HIRED
  "interviews_this_week": int,         # Interview.scheduled_at within 7 days
  "offers_sent": int,                  # Offer rows for recruiter's jobs
  "pipeline_stages": {
    "applied": int, "screening": int, "assessment": int,
    "interview": int, "offer": int, "rejected": int, "hired": int,
  },
  "top_candidates": [
    {"candidate_id": str, "full_name": str, "overall_score": float,
     "match_score": float, "application_status": str, "skills": list[str]}
  ]
}
"""
import pytest
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta

from apps.candidate.models import Application, CandidateProfile
from apps.recruiter.models import Offer, Ranking


# ─── Helpers ─────────────────────────────────────────────────────────

async def _make_company_and_job(async_client, recruiter_token, test_recruiter):
    comp = await async_client.post(
        "/api/companies/",
        headers=recruiter_token,
        json={"name": "Dash Co", "website": "http://dash.test", "description": "X", "industry": "Tech"},
    )
    company_id = comp.json()["id"]
    test_recruiter.company_id = company_id
    await test_recruiter.save()

    job = await async_client.post(
        "/api/recruiter/jobs",
        headers=recruiter_token,
        json={
            "company_id": company_id,
            "title": "Engineer",
            "description": "Build things",
            "requirements": ["Python"],
            "skills": ["Python", "FastAPI"],
            "location": "Remote",
            "salary_min": 100000,
            "salary_max": 150000,
            "role_type": "FULL_TIME",
        },
    )
    return company_id, job.json()["id"]


# ─── Auth gating ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dashboard_requires_recruiter(async_client: AsyncClient):
    response = await async_client.get("/api/analytics/dashboard")
    assert response.status_code in (401, 403)


# ─── Empty state ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dashboard_empty_recruiter_returns_zero_counts(
    async_client: AsyncClient, recruiter_token, test_company
):
    response = await async_client.get("/api/analytics/dashboard", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert data["open_jobs"] == 0
    assert data["total_candidates"] == 0
    assert data["candidates_in_pipeline"] == 0
    assert data["interviews_this_week"] == 0
    assert data["offers_sent"] == 0
    # pipeline_stages keys are all present and zero
    for stage in ("applied", "screening", "assessment", "interview", "offer", "rejected", "hired"):
        assert data["pipeline_stages"][stage] == 0
    assert data["top_candidates"] == []


# ─── Real aggregation ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dashboard_aggregates_real_data(
    async_client: AsyncClient,
    recruiter_token,
    test_recruiter,
    test_company,
    test_job,
    test_candidate,
    db,
):
    """Seed applications in different statuses, an interview in 7 days, an offer.
    Then assert the dashboard reflects each correctly and pipeline_stages comes
    from Application.status — not Ranking.application_status."""
    # Applications: 2 APPLIED, 1 INTERVIEW, 1 OFFER, 1 REJECTED
    apps = [
        Application(job_id=str(test_job.id), candidate_id=str(test_candidate.id), status="APPLIED"),
        Application(job_id=str(test_job.id), candidate_id="000000000000000000000001", status="APPLIED"),
        Application(job_id=str(test_job.id), candidate_id="000000000000000000000002", status="INTERVIEW"),
        Application(job_id=str(test_job.id), candidate_id="000000000000000000000003", status="OFFER"),
        Application(job_id=str(test_job.id), candidate_id="000000000000000000000004", status="REJECTED"),
    ]
    for a in apps:
        await a.insert()

    # Interview scheduled within 7 days
    from apps.interview.models import Interview
    interview = Interview(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        scheduled_at=datetime.now(timezone.utc) + timedelta(days=3),
        format="VIDEO",
        status="SCHEDULED",
    )
    await interview.insert()

    # Offer sent
    offer = Offer(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        salary_offered=120000,
        status="PENDING",
    )
    await offer.insert()

    # Ranking for top candidate (note: no application_status field — proves aggregation reads Application)
    ranking = Ranking(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        match_score=85.0,
        overall_score=85.0,
    )
    await ranking.insert()

    response = await async_client.get("/api/analytics/dashboard", headers=recruiter_token)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["open_jobs"] == 1
    assert data["total_candidates"] == 5  # 5 distinct candidate_ids with Application
    # In pipeline: APPLIED + INTERVIEW + OFFER = 4 (REJECTED excluded)
    assert data["candidates_in_pipeline"] == 4
    assert data["interviews_this_week"] == 1
    assert data["offers_sent"] == 1

    # Pipeline stages derive from Application.status
    assert data["pipeline_stages"]["applied"] == 2
    assert data["pipeline_stages"]["interview"] == 1
    assert data["pipeline_stages"]["offer"] == 1
    assert data["pipeline_stages"]["rejected"] == 1
    assert data["pipeline_stages"]["screening"] == 0
    assert data["pipeline_stages"]["assessment"] == 0
    assert data["pipeline_stages"]["hired"] == 0

    # Top candidates sorted by overall_score desc; the test_candidate has ranking so should appear
    assert len(data["top_candidates"]) >= 1
    top = data["top_candidates"][0]
    assert top["candidate_id"] == str(test_candidate.id)
    assert top["application_status"] == "APPLIED"
    assert top["match_score"] == 85.0


@pytest.mark.asyncio
async def test_dashboard_company_scoped(
    async_client: AsyncClient,
    recruiter_token,
    test_recruiter,
    test_company,
    test_job,
    test_candidate,
):
    """Recruiter sees only data for their own company's jobs.

    We can't easily create a second full company+job through fixtures here without
    breaking the recruiter_token/company_id wiring, so this test focuses on the
    scoping rule: a second user whose company_id differs should see zero counts
    while the test_recruiter sees their seeded counts.
    """
    # Recruiter's view: 1 application on test_job
    app = Application(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        status="APPLIED",
    )
    await app.insert()

    r1 = await async_client.get("/api/analytics/dashboard", headers=recruiter_token)
    assert r1.status_code == 200
    assert r1.json()["total_candidates"] == 1

    # A different recruiter with no company_id should see zero
    from apps.auth.models import User, UserRole
    from apps.auth.security import create_access_token
    from passlib.context import CryptContext

    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto").hash("pw12345678")
    other = User(
        email="other-recruiter@dash.com",
        hashed_password=pwd,
        full_name="Other Recruiter",
        role=UserRole.RECRUITER,
    )
    await other.insert()
    other_token = {"Authorization": f"Bearer {create_access_token({'sub': other.email})}"}

    r2 = await async_client.get("/api/analytics/dashboard", headers=other_token)
    assert r2.status_code == 200
    body = r2.json()
    assert body["open_jobs"] == 0
    assert body["total_candidates"] == 0
    assert body["offers_sent"] == 0


@pytest.mark.asyncio
async def test_dashboard_excludes_old_interviews(
    async_client: AsyncClient,
    recruiter_token,
    test_recruiter,
    test_job,
    test_candidate,
):
    """interviews_this_week counts only interviews scheduled within the next 7 days
    from now (interviews 8+ days out are excluded)."""
    from apps.interview.models import Interview
    far_future = Interview(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        scheduled_at=datetime.now(timezone.utc) + timedelta(days=10),
        format="VIDEO",
        status="SCHEDULED",
    )
    await far_future.insert()

    response = await async_client.get("/api/analytics/dashboard", headers=recruiter_token)
    assert response.status_code == 200
    assert response.json()["interviews_this_week"] == 0
