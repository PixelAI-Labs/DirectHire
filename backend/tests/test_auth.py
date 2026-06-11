import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    response = await async_client.post(
        "/api/auth/register",
        json={"email": "newuser@test.com", "password": "password123", "full_name": "New User", "role": "CANDIDATE"}
    )
    assert response.status_code == 201
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_register_duplicate_user(async_client: AsyncClient, test_candidate):
    response = await async_client.post(
        "/api/auth/register",
        json={"email": test_candidate.email, "password": "password123", "full_name": "Duplicate", "role": "CANDIDATE"}
    )
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_login_user(async_client: AsyncClient, test_candidate):
    response = await async_client.post(
        "/api/auth/login",
        data={"username": test_candidate.email, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_get_current_user(async_client: AsyncClient, test_candidate, candidate_token):
    response = await async_client.get("/api/auth/me", headers=candidate_token)
    assert response.status_code == 200
    assert response.json()["email"] == test_candidate.email
