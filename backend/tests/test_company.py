"""Tests for the Company router."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_company(async_client: AsyncClient, recruiter_token):
    response = await async_client.post(
        "/api/companies/",
        headers=recruiter_token,
        json={"name": "Acme Corp", "website": "https://acme.com", "description": "Test company"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Acme Corp"
    assert data["website"] == "https://acme.com"
    assert data["description"] == "Test company"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_companies(async_client: AsyncClient, recruiter_token, test_company):
    response = await async_client.get("/api/companies/", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(c["id"] == str(test_company.id) for c in data)


@pytest.mark.asyncio
async def test_get_company(async_client: AsyncClient, recruiter_token, test_company):
    response = await async_client.get(f"/api/companies/{test_company.id}", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_company.id)
    assert data["name"] == test_company.name


@pytest.mark.asyncio
async def test_get_company_not_found(async_client: AsyncClient, recruiter_token):
    response = await async_client.get("/api/companies/000000000000000000000000", headers=recruiter_token)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_company(async_client: AsyncClient, recruiter_token, test_company):
    response = await async_client.put(
        f"/api/companies/{test_company.id}",
        headers=recruiter_token,
        json={"name": "Updated Corp", "description": "Updated desc"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Corp"
    assert data["description"] == "Updated desc"


@pytest.mark.asyncio
async def test_update_company_forbidden(async_client: AsyncClient, candidate_token, test_company):
    response = await async_client.put(
        f"/api/companies/{test_company.id}",
        headers=candidate_token,
        json={"name": "Hacked"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_company_unauthorized(async_client: AsyncClient):
    response = await async_client.post(
        "/api/companies/",
        json={"name": "No Auth Corp"},
    )
    assert response.status_code == 401
