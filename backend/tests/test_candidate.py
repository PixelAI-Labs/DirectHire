import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_candidate_profile(async_client: AsyncClient, test_candidate, candidate_token):
    response = await async_client.put(
        "/api/candidate/profile",
        headers=candidate_token,
        json={"skills": ["Python", "React"], "experience_years": 3, "github_url": "http://github.com/test", "bio": "Test"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["skills"] == ["Python", "React"]

@pytest.mark.asyncio
async def test_get_candidate_profile(async_client: AsyncClient, test_candidate, candidate_token):
    # Setup profile first
    await async_client.put(
        "/api/candidate/profile",
        headers=candidate_token,
        json={"skills": ["Python"], "experience_years": 1, "github_url": "", "bio": "Test"}
    )
    # Get profile
    response = await async_client.get("/api/candidate/profile", headers=candidate_token)
    assert response.status_code == 200
    assert response.json()["skills"] == ["Python"]
