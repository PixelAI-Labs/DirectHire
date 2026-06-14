"""Tests for the public Jobs and Application routers."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_public_jobs(async_client: AsyncClient, test_job):
    response = await async_client.get("/api/jobs/")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert any(j["id"] == str(test_job.id) for j in data["data"])


@pytest.mark.asyncio
async def test_list_public_jobs_with_filters(async_client: AsyncClient, test_job):
    response = await async_client.get("/api/jobs/?q=Software&location=Remote")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) >= 1


@pytest.mark.asyncio
async def test_get_public_job(async_client: AsyncClient, test_job):
    response = await async_client.get(f"/api/jobs/{test_job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_job.id)
    assert data["title"] == test_job.title
    assert "company" in data


@pytest.mark.asyncio
async def test_get_public_job_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/jobs/000000000000000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_apply_to_job(async_client: AsyncClient, test_candidate, candidate_token, test_job):
    response = await async_client.post(
        f"/api/jobs/{test_job.id}/apply",
        headers=candidate_token,
    )
    assert response.status_code == 201
    data = response.json()
    assert "application_id" in data
    assert data["message"] == "Application submitted successfully"


@pytest.mark.asyncio
async def test_apply_to_job_already_applied(async_client: AsyncClient, test_candidate, candidate_token, test_job):
    # First apply
    await async_client.post(f"/api/jobs/{test_job.id}/apply", headers=candidate_token)
    # Second apply should fail
    response = await async_client.post(f"/api/jobs/{test_job.id}/apply", headers=candidate_token)
    assert response.status_code == 400
    assert "already applied" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_apply_to_job_recruiter_forbidden(async_client: AsyncClient, recruiter_token, test_job):
    response = await async_client.post(f"/api/jobs/{test_job.id}/apply", headers=recruiter_token)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_apply_to_closed_job(async_client: AsyncClient, test_candidate, candidate_token, test_job):
    test_job.status = "CLOSED"
    await test_job.save()
    response = await async_client.post(f"/api/jobs/{test_job.id}/apply", headers=candidate_token)
    assert response.status_code == 404
