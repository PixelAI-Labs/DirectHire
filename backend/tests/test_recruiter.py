import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_company(async_client: AsyncClient, recruiter_token):
    response = await async_client.post(
        "/api/companies/",
        headers=recruiter_token,
        json={"name": "Test Company", "website": "http://test.com", "description": "Test", "industry": "Tech"}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Company"

@pytest.mark.asyncio
async def test_create_job(async_client: AsyncClient, recruiter_token, test_recruiter):
    comp_res = await async_client.post(
        "/api/companies/",
        headers=recruiter_token,
        json={"name": "Test Company 2", "website": "http://test.com", "description": "Test", "industry": "Tech"}
    )
    company_id = comp_res.json()["id"]
    test_recruiter.company_id = company_id
    await test_recruiter.save()

    response = await async_client.post(
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
    assert response.status_code == 201
    assert response.json()["title"] == "Software Engineer"
