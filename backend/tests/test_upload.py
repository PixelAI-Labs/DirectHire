"""Tests for the Upload router."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_resume(async_client: AsyncClient, recruiter_token, fake_pdf_bytes, mock_upload_dir):
    response = await async_client.post(
        "/api/upload/?file_type=resume",
        headers=recruiter_token,
        files={"file": ("test_resume.pdf", fake_pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["file_type"] == "resume"
    assert data["filename"].endswith(".pdf")
    assert "url" in data
    assert data["size_bytes"] > 0


@pytest.mark.asyncio
async def test_upload_invalid_file_type(async_client: AsyncClient, recruiter_token):
    response = await async_client.post(
        "/api/upload/?file_type=resume",
        headers=recruiter_token,
        files={"file": ("test.exe", b"bad data", "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_invalid_type_param(async_client: AsyncClient, recruiter_token):
    response = await async_client.post(
        "/api/upload/?file_type=invalid",
        headers=recruiter_token,
        files={"file": ("test.pdf", b"%PDF", "application/pdf")},
    )
    assert response.status_code == 400
    assert "invalid file_type" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_serve_uploaded_file(async_client: AsyncClient, recruiter_token, fake_pdf_bytes, mock_upload_dir):
    # Upload first
    upload_res = await async_client.post(
        "/api/upload/?file_type=resume",
        headers=recruiter_token,
        files={"file": ("test_resume.pdf", fake_pdf_bytes, "application/pdf")},
    )
    assert upload_res.status_code == 200
    filename = upload_res.json()["filename"]

    # Serve it back
    response = await async_client.get(f"/api/upload/resume/{filename}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


@pytest.mark.asyncio
async def test_serve_file_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/upload/resume/nonexistent.pdf")
    assert response.status_code == 404
