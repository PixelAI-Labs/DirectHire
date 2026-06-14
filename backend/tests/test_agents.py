"""Tests for the Agents router with mocked LLM calls."""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
from apps.recruiter.models import Offer


# ─── Helper to create a job via API ─────────────────────────────────

async def _create_company_and_job(async_client: AsyncClient, recruiter_token, test_recruiter):
    comp_res = await async_client.post(
        "/api/companies/",
        headers=recruiter_token,
        json={"name": "Test Company", "website": "http://test.com", "description": "Test", "industry": "Tech"}
    )
    company_id = comp_res.json()["id"]
    test_recruiter.company_id = company_id
    await test_recruiter.save()

    job_res = await async_client.post(
        "/api/recruiter/jobs",
        headers=recruiter_token,
        json={
            "company_id": company_id,
            "title": "Software Engineer",
            "description": "Test Job",
            "requirements": ["Python"],
            "skills": ["Python"],
            "salary_min": 100000,
            "salary_max": 150000,
            "location": "Remote",
            "role_type": "FULL_TIME"
        }
    )
    return company_id, job_res.json()["id"]


# ─── /screen ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("apps.agents.router.hiring_agent.screen_resume", new_callable=AsyncMock)
async def test_screen_candidate(mock_screen_resume, async_client: AsyncClient, test_candidate, recruiter_token, test_recruiter):
    _, job_id = await _create_company_and_job(async_client, recruiter_token, test_recruiter)

    mock_screen_resume.return_value = {
        "eligibility_score": 85.0,
        "suitability_score": 85.0,
        "potential_score": 90.0,
        "summary": "Great candidate",
        "strengths": ["Python"],
        "concerns": ["Java"]
    }

    response = await async_client.post(
        "/api/agents/screen",
        headers=recruiter_token,
        json={"candidate_id": str(test_candidate.id), "job_id": job_id}
    )
    assert response.status_code == 200
    assert response.json()["suitability_score"] == 85


# ─── /match ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("apps.agents.router._run_match_task")
async def test_match_candidate(mock_task, async_client: AsyncClient, test_candidate, recruiter_token, test_recruiter):
    _, job_id = await _create_company_and_job(async_client, recruiter_token, test_recruiter)
    response = await async_client.post(
        "/api/agents/match",
        headers=recruiter_token,
        json={"candidate_id": str(test_candidate.id), "job_id": job_id}
    )
    assert response.status_code == 202
    assert "started" in response.json()["message"].lower()


@pytest.mark.asyncio
@patch("apps.agents.router.hiring_agent.screen_resume", new_callable=AsyncMock)
@patch("apps.agents.router.career_agent.score_job_match", new_callable=AsyncMock)
async def test_run_match_task(mock_career, mock_hiring, async_client: AsyncClient, test_candidate, recruiter_token, test_recruiter):
    from apps.agents.router import _run_match_task
    _, job_id = await _create_company_and_job(async_client, recruiter_token, test_recruiter)

    mock_career.return_value = "Score: 80"
    mock_hiring.return_value = {"suitability_score": 90}

    await _run_match_task(str(test_candidate.id), job_id)
    # After running, an Application and Ranking should exist
    from apps.candidate.models import Application
    # find_one returns a single document (await directly); use find().to_list()
    # to assert "exactly one application was created".
    apps = await Application.find(
        Application.candidate_id == str(test_candidate.id),
        Application.job_id == job_id,
    ).to_list()
    assert len(apps) == 1


# ─── /analyze ────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("apps.agents.router._run_analyze_task")
async def test_analyze_candidate(mock_task, async_client: AsyncClient, test_candidate, recruiter_token):
    response = await async_client.post(
        "/api/agents/analyze",
        headers=recruiter_token,
        json={"candidate_id": str(test_candidate.id)}
    )
    assert response.status_code == 202
    assert "started" in response.json()["message"].lower()


# ─── /rank ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("apps.agents.router.hiring_agent.rank_candidates", new_callable=AsyncMock)
async def test_rank_candidates(mock_rank, async_client: AsyncClient, test_candidate, recruiter_token, test_recruiter):
    _, job_id = await _create_company_and_job(async_client, recruiter_token, test_recruiter)

    # Create an application
    from apps.candidate.models import Application
    app = Application(job_id=job_id, candidate_id=str(test_candidate.id), status="APPLIED")
    await app.insert()

    mock_rank.return_value = [
        {
            "candidate_id": str(test_candidate.id),
            "resume_score": 80,
            "skill_match_score": 85,
            "overall_score": 82,
        }
    ]

    response = await async_client.post(
        "/api/agents/rank",
        headers=recruiter_token,
        json={"job_id": job_id}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == job_id
    assert len(data["rankings"]) == 1


# ─── /assess ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("apps.agents.router.hiring_agent.analyze_assessment", new_callable=AsyncMock)
async def test_analyze_assessment(mock_analyze, async_client: AsyncClient, test_candidate, recruiter_token, test_recruiter):
    _, job_id = await _create_company_and_job(async_client, recruiter_token, test_recruiter)

    mock_analyze.return_value = {"technical_score": 85, "recommendation": "Hire"}

    # Create a ranking first
    from apps.recruiter.models import Ranking
    ranking = Ranking(job_id=job_id, candidate_id=str(test_candidate.id))
    await ranking.insert()

    response = await async_client.post(
        f"/api/agents/assess?candidate_id={test_candidate.id}&job_id={job_id}",
        headers=recruiter_token,
        json={"results": {"q1": "a1"}},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["technical_score"] == 85


# ─── /draft-offer ────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("apps.agents.router.hiring_agent.draft_offer", new_callable=AsyncMock)
async def test_draft_offer(mock_draft, async_client: AsyncClient, test_candidate, recruiter_token, test_recruiter):
    company_id, job_id = await _create_company_and_job(async_client, recruiter_token, test_recruiter)

    # Create candidate profile
    from apps.candidate.models import CandidateProfile
    profile = CandidateProfile(user_id=str(test_candidate.id), skills=["Python"], experience=[])
    await profile.insert()

    mock_draft.return_value = {
        "offer_text": "Dear candidate...",
        "recommended_salary": 120000,
        "confidence": "Hire",
        "salary_reasoning": "Great fit",
    }

    response = await async_client.post(
        "/api/agents/draft-offer",
        headers=recruiter_token,
        json={"candidate_id": str(test_candidate.id), "job_id": job_id}
    )
    assert response.status_code == 200
    data = response.json()
    assert "offer_text" in data
    assert data["recommended_salary"] == 120000


# ─── /schedule ───────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("apps.agents.router._run_schedule_task")
async def test_schedule_interview(mock_task, async_client: AsyncClient, test_candidate, recruiter_token):
    response = await async_client.post(
        "/api/agents/schedule",
        headers=recruiter_token,
        json={"candidate_id": str(test_candidate.id), "job_id": "000000000000000000000000", "prompt": "Tomorrow at 2pm"}
    )
    assert response.status_code == 202


# ─── /negotiate ──────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("apps.agents.router._run_negotiate_task")
async def test_negotiate_offer(mock_task, async_client: AsyncClient, recruiter_token, test_recruiter):
    # Create an offer first
    company_id, job_id = await _create_company_and_job(async_client, recruiter_token, test_recruiter)
    offer = Offer(
        job_id=job_id,
        candidate_id="000000000000000000000000",
        recruiter_id=str(test_recruiter.id),
        salary_offered=100000,
    )
    await offer.insert()

    response = await async_client.post(
        "/api/agents/negotiate",
        headers=recruiter_token,
        json={"offer_id": str(offer.id), "prompt": "I want more salary"}
    )
    assert response.status_code == 202
