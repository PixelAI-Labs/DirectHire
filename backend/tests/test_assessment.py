"""Tests for the Assessment router with mocked LLM question generation."""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone


@pytest.mark.asyncio
@patch("apps.assessment.router._generate_questions", new_callable=AsyncMock)
async def test_create_assessment(mock_generate, async_client: AsyncClient, recruiter_token, test_candidate, test_job):
    mock_generate.return_value = ["Q1", "Q2", "Q3"]
    response = await async_client.post(
        "/api/assessments/",
        headers=recruiter_token,
        json={
            "job_id": str(test_job.id),
            "candidate_id": str(test_candidate.id),
            "title": "Backend Skills",
            "questions": [],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Backend Skills"
    assert data["status"] == "ASSIGNED"
    assert data["candidate_id"] == str(test_candidate.id)
    assert len(data["questions"]) == 3


@pytest.mark.asyncio
async def test_create_assessment_with_explicit_questions(async_client: AsyncClient, recruiter_token, test_candidate, test_job):
    response = await async_client.post(
        "/api/assessments/",
        headers=recruiter_token,
        json={
            "job_id": str(test_job.id),
            "candidate_id": str(test_candidate.id),
            "title": "Frontend Skills",
            "questions": ["What is React?"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["questions"] == ["What is React?"]


@pytest.mark.asyncio
async def test_create_assessment_forbidden_for_candidate(async_client: AsyncClient, candidate_token, test_candidate, test_job):
    response = await async_client.post(
        "/api/assessments/",
        headers=candidate_token,
        json={
            "job_id": str(test_job.id),
            "candidate_id": str(test_candidate.id),
            "title": "Hacker",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_assessments_recruiter(async_client: AsyncClient, recruiter_token, test_assessment):
    response = await async_client.get("/api/assessments/", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(a["id"] == str(test_assessment.id) for a in data)


@pytest.mark.asyncio
async def test_list_assessments_candidate(async_client: AsyncClient, candidate_token, test_assessment, test_candidate):
    response = await async_client.get("/api/assessments/", headers=candidate_token)
    assert response.status_code == 200
    data = response.json()
    assert any(a["id"] == str(test_assessment.id) for a in data)


@pytest.mark.asyncio
async def test_get_assessment(async_client: AsyncClient, recruiter_token, test_assessment):
    response = await async_client.get(f"/api/assessments/{test_assessment.id}", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_assessment.id)


@pytest.mark.asyncio
async def test_get_assessment_not_found(async_client: AsyncClient, recruiter_token):
    response = await async_client.get("/api/assessments/000000000000000000000000", headers=recruiter_token)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_submit_assessment(async_client: AsyncClient, candidate_token, test_assessment):
    response = await async_client.post(
        f"/api/assessments/{test_assessment.id}/submit",
        headers=candidate_token,
        json={"answers": ["Answer 1", "Answer 2"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUBMITTED"
    assert data["candidate_answers"] == ["Answer 1", "Answer 2"]
    assert "submitted_at" in data


@pytest.mark.asyncio
async def test_submit_assessment_wrong_status(async_client: AsyncClient, candidate_token, test_assessment):
    test_assessment.status = "SUBMITTED"
    await test_assessment.save()
    response = await async_client.post(
        f"/api/assessments/{test_assessment.id}/submit",
        headers=candidate_token,
        json={"answers": ["A"]},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_evaluate_assessment(async_client: AsyncClient, recruiter_token, test_assessment):
    test_assessment.status = "SUBMITTED"
    await test_assessment.save()
    response = await async_client.post(
        f"/api/assessments/{test_assessment.id}/evaluate",
        headers=recruiter_token,
        json={
            "technical_score": 85.0,
            "coding_score": 80.0,
            "reasoning_score": 90.0,
            "ai_feedback": "Great work",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "EVALUATED"
    assert data["technical_score"] == 85.0


@pytest.mark.asyncio
async def test_list_assessments_for_job(async_client: AsyncClient, recruiter_token, test_assessment):
    response = await async_client.get(f"/api/assessments/job/{test_assessment.job_id}", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert any(a["id"] == str(test_assessment.id) for a in data)
