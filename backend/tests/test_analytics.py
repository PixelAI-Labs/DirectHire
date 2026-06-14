"""Tests for the Analytics router (WIP stubs)."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_dashboard(async_client: AsyncClient):
    response = await async_client.get("/api/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


@pytest.mark.asyncio
async def test_get_pipeline(async_client: AsyncClient):
    response = await async_client.get("/api/analytics/pipeline")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
