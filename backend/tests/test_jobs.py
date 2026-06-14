"""Tests for the public Jobs and Application routers."""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock


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


# ─── Match-scoring trigger (review finding #3) ──────────────────────

@pytest.mark.asyncio
@patch("apps.jobs.router._run_match_task", new_callable=AsyncMock)
async def test_apply_to_job_schedules_match_task(
    mock_run_match_task,
    async_client: AsyncClient,
    test_candidate,
    candidate_token,
    test_job,
):
    """POST /api/jobs/{id}/apply must schedule /api/agents/match as a background task.

    We patch the task itself to a no-op so we don't need LLM mocking here — the
    assertion is that the wiring exists (background task is added).
    """
    response = await async_client.post(
        f"/api/jobs/{test_job.id}/apply",
        headers=candidate_token,
    )
    assert response.status_code == 201
    # Background task was scheduled. FastAPI calls the patched coroutine for it;
    # the assertion below checks the call happened (called for add_task path,
    # assert_awaited for coroutine path).
    assert mock_run_match_task.called, (
        f"_run_match_task was not scheduled; call_args={mock_run_match_task.call_args}"
    )


@pytest.mark.asyncio
@patch("apps.jobs.router._run_match_task", new_callable=AsyncMock)
@patch("apps.agents.router.hiring_agent.screen_resume", new_callable=AsyncMock)
@patch("apps.agents.router.career_agent.score_job_match", new_callable=AsyncMock)
async def test_apply_then_run_match_task_updates_match_score(
    mock_career,
    mock_hiring,
    mock_run_match_task,
    async_client: AsyncClient,
    test_candidate,
    candidate_token,
    test_job,
):
    """Apply (background task is neutralised), then directly await the real
    _run_match_task with mocked LLMs. Application.match_score should change
    from None to a non-zero value.

    Patching apps.jobs.router._run_match_task prevents the FastAPI BackgroundTask
    from racing the assertions; we invoke the real function manually below.
    """
    # Mocked LLM responses (used by the manually-invoked task)
    mock_career.return_value = "Score: 80"
    mock_hiring.return_value = {
        "eligibility_score": 80.0,
        "suitability_score": 90.0,
        "potential_score": 85.0,
        "summary": "Good fit",
        "strengths": ["Python"],
        "concerns": [],
    }

    # Apply
    response = await async_client.post(
        f"/api/jobs/{test_job.id}/apply",
        headers=candidate_token,
    )
    assert response.status_code == 201

    # Verify Application.match_score is None right after apply (scoring hasn't run)
    from apps.candidate.models import Application
    app = await Application.find_one(
        Application.candidate_id == str(test_candidate.id),
        Application.job_id == str(test_job.id),
    )
    assert app is not None
    assert app.match_score is None

    # Run the real match task directly (bypass the patch by importing from agents.router)
    from apps.agents.router import _run_match_task as real_run_match_task
    await real_run_match_task(str(test_candidate.id), str(test_job.id))

    # Re-fetch and assert match_score is now > 0
    refreshed = await Application.find_one(
        Application.candidate_id == str(test_candidate.id),
        Application.job_id == str(test_job.id),
    )
    assert refreshed is not None
    assert refreshed.match_score is not None
    assert refreshed.match_score > 0


@pytest.mark.asyncio
@patch("apps.jobs.router._run_match_task", new_callable=AsyncMock)
async def test_apply_to_job_initial_match_score_is_null(
    mock_run_match_task,
    async_client: AsyncClient,
    test_candidate,
    candidate_token,
    test_job,
):
    """Just after apply (before background task), Application.match_score is None.

    Patches the background task to a no-op so it cannot race the assertion.
    """
    response = await async_client.post(
        f"/api/jobs/{test_job.id}/apply",
        headers=candidate_token,
    )
    assert response.status_code == 201

    from apps.candidate.models import Application
    apps = await Application.find(
        Application.candidate_id == str(test_candidate.id),
        Application.job_id == str(test_job.id),
    ).to_list()
    assert len(apps) == 1
    assert apps[0].match_score is None
