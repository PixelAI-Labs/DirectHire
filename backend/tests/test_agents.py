import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
from apps.recruiter.models import Job

@pytest.mark.asyncio
@patch("apps.agents.router.hiring_agent")
async def test_screen_candidate(mock_hiring_agent, async_client: AsyncClient, test_candidate, recruiter_token, test_recruiter):
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
            "salary_range": "100k-150k",
            "location": "Remote",
            "employment_type": "FULL_TIME"
        }
    )
    job_id = job_res.json()["id"]

    mock_hiring_agent.screen_resume = AsyncMock(return_value={
        "eligibility_score": 85.0,
        "suitability_score": 85.0,
        "potential_score": 90.0,
        "summary": "Great candidate",
        "strengths": ["Python"],
        "concerns": ["Java"]
    })

    response = await async_client.post(
        "/api/agents/screen",
        headers=recruiter_token,
        json={"candidate_id": str(test_candidate.id), "job_id": job_id}
    )
    
    assert response.status_code == 200
    assert response.json()["suitability_score"] == 85
