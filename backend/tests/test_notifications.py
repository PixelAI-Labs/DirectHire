import pytest
from httpx import AsyncClient
from apps.notifications.service import NotificationService

@pytest.mark.asyncio
async def test_list_notifications(async_client: AsyncClient, test_candidate, candidate_token):
    await NotificationService.create(
        user_id=str(test_candidate.id),
        type="TEST",
        title="Test Notification",
        message="Hello World"
    )
    
    response = await async_client.get("/api/notifications/", headers=candidate_token)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == "Test Notification"

@pytest.mark.asyncio
async def test_mark_all_read(async_client: AsyncClient, test_candidate, candidate_token):
    response = await async_client.post("/api/notifications/mark-all-read", headers=candidate_token)
    assert response.status_code == 200
    
    count_res = await async_client.get("/api/notifications/unread-count", headers=candidate_token)
    assert count_res.json()["unread_count"] == 0
