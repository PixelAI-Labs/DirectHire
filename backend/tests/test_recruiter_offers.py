"""Tests for the top-level /api/offers router (issue #1).

These tests drive the design of `apps/offers/router.py`:
  GET  /api/offers/                 - role-aware list (candidate sees own, recruiter sees company, admin sees all)
  POST /api/offers/                 - recruiter creates an offer (calls notify_offer_created)
  PUT  /api/offers/{id}/status      - candidate accepts/rejects (calls notify_offer_accepted/rejected)
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
from beanie import PydanticObjectId
from passlib.context import CryptContext

from apps.auth.models import User, UserRole
from apps.auth.security import create_access_token
from apps.company.models import Company
from apps.recruiter.models import Job, Offer


# ─── Helpers ──────────────────────────────────────────────────────────

def _pwd_hash() -> str:
    return CryptContext(schemes=["bcrypt"], deprecated="auto").hash("password123")


def _token_for(user: User) -> dict:
    token = create_access_token({"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


async def _make_other_recruiter_with_company(
    db, *, email: str, company_name: str, recruiter_full_name: str = "Other Recruiter"
):
    """Create a second recruiter + their own company + a job under it
    directly in the DB. Bypasses /api/recruiter/jobs because that endpoint
    ignores the payload's company_id and uses current_user.company_id instead.
    """
    other_recruiter = User(
        email=email,
        hashed_password=_pwd_hash(),
        full_name=recruiter_full_name,
        role=UserRole.RECRUITER,
    )
    await other_recruiter.insert()

    other_company = Company(
        name=company_name,
        description="Other company",
        website="http://other.test",
        recruiters=[other_recruiter.email],
        created_by=str(other_recruiter.id),
    )
    await other_company.insert()

    other_recruiter.company_id = str(other_company.id)
    await other_recruiter.save()

    other_job = Job(
        company_id=str(other_company.id),
        title="Other Job",
        description="Different job",
        requirements=["Python"],
        skills=["Python"],
        location="Remote",
        salary_min=80000,
        salary_max=120000,
        role_type="FULL_TIME",
        remote_option="REMOTE",
        status="OPEN",
    )
    await other_job.insert()

    return other_recruiter, other_company, other_job


# ─── GET /api/offers (candidate) ─────────────────────────────────────

@pytest.mark.asyncio
async def test_get_offers_as_candidate_returns_only_own_offers(
    async_client: AsyncClient,
    candidate_token,
    test_candidate,
    test_recruiter,
    test_job,
    db,
):
    """A candidate sees only offers addressed to themselves."""
    mine = Offer(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        salary_offered=120000,
        status="PENDING",
    )
    someone_else = Offer(
        job_id=str(test_job.id),
        candidate_id="000000000000000000000000",
        recruiter_id=str(test_recruiter.id),
        salary_offered=110000,
        status="PENDING",
    )
    await mine.insert()
    await someone_else.insert()

    response = await async_client.get("/api/offers/", headers=candidate_token)
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == str(mine.id)
    assert data[0]["candidate_id"] == str(test_candidate.id)


# ─── GET /api/offers (recruiter company-scoped, admin all) ───────────

@pytest.mark.asyncio
async def test_get_offers_as_recruiter_returns_only_company_offers(
    async_client: AsyncClient,
    recruiter_token,
    test_recruiter,
    test_candidate,
    test_job,
    test_company,
    db,
):
    """A recruiter sees offers only for jobs in their own company."""
    own_offer = Offer(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        salary_offered=120000,
        status="PENDING",
    )
    await own_offer.insert()

    # Foreign offer: insert directly so it actually belongs to another company
    other_recruiter, _other_company, other_job = await _make_other_recruiter_with_company(
        db, email="other-recruiter@test.com", company_name="Other Co"
    )
    foreign_offer = Offer(
        job_id=str(other_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(other_recruiter.id),
        salary_offered=100000,
        status="PENDING",
    )
    await foreign_offer.insert()

    response = await async_client.get("/api/offers/", headers=recruiter_token)
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data, list)
    ids = {o["id"] for o in data}
    assert str(own_offer.id) in ids, f"own offer missing; got {ids}"
    assert str(foreign_offer.id) not in ids, f"foreign offer leaked; got {ids}"


@pytest.mark.asyncio
async def test_get_offers_as_admin_returns_all(
    async_client: AsyncClient,
    test_recruiter,
    test_candidate,
    test_job,
    db,
):
    """Admin sees offers from every company."""
    own = Offer(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        salary_offered=120000,
        status="PENDING",
    )
    await own.insert()

    other_recruiter, _other_company, other_job = await _make_other_recruiter_with_company(
        db, email="admin-foreign@test.com", company_name="Foreign Co"
    )
    foreign = Offer(
        job_id=str(other_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(other_recruiter.id),
        salary_offered=90000,
        status="PENDING",
    )
    await foreign.insert()

    admin = User(
        email="admin@test.com",
        hashed_password=_pwd_hash(),
        full_name="Admin",
        role=UserRole.ADMIN,
    )
    await admin.insert()
    admin_token = _token_for(admin)

    response = await async_client.get("/api/offers/", headers=admin_token)
    assert response.status_code == 200, response.text
    data = response.json()
    ids = {o["id"] for o in data}
    assert str(own.id) in ids, f"own offer missing; got {ids}"
    assert str(foreign.id) in ids, f"foreign offer missing; got {ids}"


# ─── POST /api/offers (recruiter creates) ────────────────────────────

@pytest.mark.asyncio
@patch("apps.offers.router.NotificationService.notify_offer_created", new_callable=AsyncMock)
async def test_create_offer_as_recruiter_inserts_and_notifies(
    mock_notify,
    async_client: AsyncClient,
    recruiter_token,
    test_candidate,
    test_job,
):
    """Recruiter POST creates an Offer row and triggers the candidate notification."""
    payload = {
        "job_id": str(test_job.id),
        "candidate_id": str(test_candidate.id),
        "salary_offered": 125000,
        "benefits": "Health, 401k",
        "message": "We'd love to have you!",
    }
    response = await async_client.post("/api/offers/", headers=recruiter_token, json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["job_id"] == payload["job_id"]
    assert data["candidate_id"] == payload["candidate_id"]
    assert data["salary_offered"] == 125000
    assert data["status"] == "PENDING"

    offer = await Offer.get(PydanticObjectId(data["id"]))
    assert offer is not None
    assert offer.salary_offered == 125000

    mock_notify.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_offer_as_candidate_forbidden(
    async_client: AsyncClient,
    candidate_token,
    test_job,
    test_candidate,
):
    """Candidates cannot create offers."""
    payload = {
        "job_id": str(test_job.id),
        "candidate_id": str(test_candidate.id),
        "salary_offered": 90000,
    }
    response = await async_client.post("/api/offers/", headers=candidate_token, json=payload)
    assert response.status_code == 403


# ─── PUT /api/offers/{id}/status (candidate accept/reject) ──────────

@pytest.mark.asyncio
@patch("apps.offers.router.NotificationService.notify_offer_accepted", new_callable=AsyncMock)
async def test_accept_offer_as_candidate_owner_fires_notification(
    mock_notify_accepted,
    async_client: AsyncClient,
    candidate_token,
    test_candidate,
    test_recruiter,
    test_job,
):
    offer = Offer(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        salary_offered=120000,
        status="PENDING",
    )
    await offer.insert()

    response = await async_client.put(
        f"/api/offers/{offer.id}/status",
        headers=candidate_token,
        json={"status": "ACCEPTED"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "ACCEPTED"

    refreshed = await Offer.get(offer.id)
    assert refreshed.status == "ACCEPTED"
    mock_notify_accepted.assert_awaited_once()


@pytest.mark.asyncio
@patch("apps.offers.router.NotificationService.notify_offer_rejected", new_callable=AsyncMock)
async def test_reject_offer_as_candidate_owner_fires_notification(
    mock_notify_rejected,
    async_client: AsyncClient,
    candidate_token,
    test_candidate,
    test_recruiter,
    test_job,
):
    offer = Offer(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        salary_offered=120000,
        status="PENDING",
    )
    await offer.insert()

    response = await async_client.put(
        f"/api/offers/{offer.id}/status",
        headers=candidate_token,
        json={"status": "REJECTED"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "REJECTED"

    refreshed = await Offer.get(offer.id)
    assert refreshed.status == "REJECTED"
    mock_notify_rejected.assert_awaited_once()


@pytest.mark.asyncio
async def test_offer_status_invalid_value_rejected(
    async_client: AsyncClient,
    candidate_token,
    test_candidate,
    test_recruiter,
    test_job,
):
    offer = Offer(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        salary_offered=120000,
        status="PENDING",
    )
    await offer.insert()

    response = await async_client.put(
        f"/api/offers/{offer.id}/status",
        headers=candidate_token,
        json={"status": "BANANA"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_offer_status_other_candidate_forbidden(
    async_client: AsyncClient,
    db,
    test_recruiter,
    test_job,
):
    """A candidate cannot accept someone else's offer."""
    other_candidate = User(
        email="snooper@test.com",
        hashed_password=_pwd_hash(),
        full_name="Snooper",
        role=UserRole.CANDIDATE,
    )
    await other_candidate.insert()
    snooper_token = _token_for(other_candidate)

    offer = Offer(
        job_id=str(test_job.id),
        candidate_id="000000000000000000000000",
        recruiter_id=str(test_recruiter.id),
        salary_offered=120000,
        status="PENDING",
    )
    await offer.insert()

    response = await async_client.put(
        f"/api/offers/{offer.id}/status",
        headers=snooper_token,
        json={"status": "ACCEPTED"},
    )
    assert response.status_code == 403
