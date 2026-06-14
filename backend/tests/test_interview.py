"""Tests for the Interview router with mocked STT and AI services."""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone


# ─── Smoke test: /api/interviews is registered (review finding #1) ──

@pytest.mark.asyncio
async def test_interviews_route_registered_at_api_interviews(
    async_client: AsyncClient, candidate_token
):
    """GET /api/interviews/ (candidate) returns 200 with a list — proves the
    interview router is registered at /api/interviews in main.py."""
    response = await async_client.get("/api/interviews/", headers=candidate_token)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_interviews_route_registered_recruiter_view(
    async_client: AsyncClient, recruiter_token
):
    """Recruiter view also returns 200 with a list (possibly empty)."""
    response = await async_client.get("/api/interviews/", headers=recruiter_token)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_interview(async_client: AsyncClient, recruiter_token, test_candidate, test_job):
    response = await async_client.post(
        "/api/interviews/",
        headers=recruiter_token,
        json={
            "job_id": str(test_job.id),
            "candidate_id": str(test_candidate.id),
            "scheduled_at": datetime.now(timezone.utc).isoformat(),
            "format": "VIDEO",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["job_id"] == str(test_job.id)
    assert data["candidate_id"] == str(test_candidate.id)
    assert data["status"] == "SCHEDULED"


@pytest.mark.asyncio
async def test_create_interview_forbidden_for_candidate(async_client: AsyncClient, candidate_token, test_candidate, test_job):
    response = await async_client.post(
        "/api/interviews/",
        headers=candidate_token,
        json={
            "job_id": str(test_job.id),
            "candidate_id": str(test_candidate.id),
            "format": "VIDEO",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_interviews_recruiter(async_client: AsyncClient, recruiter_token, test_interview):
    response = await async_client.get("/api/interviews/", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(i["id"] == str(test_interview.id) for i in data)


@pytest.mark.asyncio
async def test_list_interviews_candidate(async_client: AsyncClient, candidate_token, test_interview, test_candidate):
    response = await async_client.get("/api/interviews/", headers=candidate_token)
    assert response.status_code == 200
    data = response.json()
    assert any(i["id"] == str(test_interview.id) for i in data)


@pytest.mark.asyncio
async def test_get_interview(async_client: AsyncClient, recruiter_token, test_interview):
    response = await async_client.get(f"/api/interviews/{test_interview.id}", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_interview.id)


@pytest.mark.asyncio
async def test_get_interview_not_found(async_client: AsyncClient, recruiter_token):
    response = await async_client.get("/api/interviews/000000000000000000000000", headers=recruiter_token)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_interview(async_client: AsyncClient, recruiter_token, test_interview):
    response = await async_client.put(
        f"/api/interviews/{test_interview.id}",
        headers=recruiter_token,
        json={"notes": "Updated notes", "status": "CONFIRMED"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["notes"] == "Updated notes"
    assert data["status"] == "CONFIRMED"


@pytest.mark.asyncio
async def test_delete_interview(async_client: AsyncClient, recruiter_token, test_interview):
    response = await async_client.delete(f"/api/interviews/{test_interview.id}", headers=recruiter_token)
    assert response.status_code == 204
    # Verify it's cancelled
    get_res = await async_client.get(f"/api/interviews/{test_interview.id}", headers=recruiter_token)
    assert get_res.json()["status"] == "CANCELLED"


@pytest.mark.asyncio
async def test_list_interviews_for_job(async_client: AsyncClient, recruiter_token, test_interview):
    response = await async_client.get(f"/api/interviews/job/{test_interview.job_id}", headers=recruiter_token)
    assert response.status_code == 200
    data = response.json()
    assert any(i["id"] == str(test_interview.id) for i in data)


@pytest.mark.asyncio
@patch("apps.interview.router.STTService.transcribe", new_callable=AsyncMock)
async def test_transcribe_audio(mock_transcribe, async_client: AsyncClient, recruiter_token):
    mock_transcribe.return_value = "Hello world"
    response = await async_client.post(
        "/api/interviews/transcribe",
        headers=recruiter_token,
        files={"file": ("audio.webm", b"fake audio bytes", "audio/webm")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["transcript"] == "Hello world"


@pytest.mark.asyncio
async def test_transcribe_unsupported_type(async_client: AsyncClient, recruiter_token):
    response = await async_client.post(
        "/api/interviews/transcribe",
        headers=recruiter_token,
        files={"file": ("audio.mp3", b"fake audio", "audio/mp3")},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_submit_answer(async_client: AsyncClient, candidate_token, test_interview):
    response = await async_client.post(
        f"/api/interviews/{test_interview.id}/answer",
        headers=candidate_token,
        json={"question": "What is Python?", "answer": "A programming language"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["qa_history"]) == 1
    assert "A programming language" in data["transcript"]


@pytest.mark.asyncio
@patch("apps.interview.router.InterviewAIService.generate_question", new_callable=AsyncMock)
async def test_generate_question(mock_generate, async_client: AsyncClient, candidate_token, test_interview):
    mock_generate.return_value = "Tell me about your experience with FastAPI."
    response = await async_client.post(
        f"/api/interviews/{test_interview.id}/question",
        headers=candidate_token,
        json={"previous_qa": []},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["question"] == "Tell me about your experience with FastAPI."


@pytest.mark.asyncio
@patch("apps.interview.router.InterviewEvaluationService.evaluate_session", new_callable=AsyncMock)
async def test_evaluate_interview(mock_evaluate, async_client: AsyncClient, candidate_token, test_interview):
    mock_evaluate.return_value = {
        "overall_score": 85,
        "communication_score": 90,
        "technical_score": 80,
        "confidence_score": 85,
        "behavioral_analysis": "Strong communicator",
        "strengths": ["Communication"],
        "weaknesses": ["Technical depth"],
        "summary": "Good candidate",
    }
    # Add some QA history first
    await async_client.post(
        f"/api/interviews/{test_interview.id}/answer",
        headers=candidate_token,
        json={"question": "Q1", "answer": "A1"},
    )
    response = await async_client.post(
        f"/api/interviews/{test_interview.id}/evaluate",
        headers=candidate_token,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] == 85
    # Verify interview was updated
    get_res = await async_client.get(f"/api/interviews/{test_interview.id}", headers=candidate_token)
    assert get_res.json()["status"] == "COMPLETED"
    assert get_res.json()["overall_score"] == 85
