"""Top-level /api/offers router — resolves review finding #1.

Adds a single canonical surface for offer operations so candidates can list their
offers, candidates can accept/reject offers, and recruiters can create offers for
their company's jobs. The legacy /api/recruiter/offers and /api/candidate/offers
endpoints are preserved unchanged for backward compatibility.
"""
import logging
from fastapi import APIRouter, Body, Depends, HTTPException, status

from apps.auth.models import User, UserRole
from apps.auth.security import get_current_user
from apps.notifications.service import NotificationService
from apps.recruiter.models import Job, Offer
from apps.recruiter.schemas import OfferCreate, OfferOut

logger = logging.getLogger(__name__)

router = APIRouter()

_ALLOWED_OFFER_STATUSES = {"ACCEPTED", "REJECTED"}


def _offer_to_out(offer: Offer) -> OfferOut:
    return OfferOut(
        id=str(offer.id),
        job_id=offer.job_id,
        candidate_id=offer.candidate_id,
        recruiter_id=offer.recruiter_id,
        salary_offered=offer.salary_offered,
        benefits=offer.benefits,
        status=offer.status,
        message=offer.message,
        created_at=offer.created_at,
    )


async def _safe_get_job(job_id: str) -> Job | None:
    from beanie import PydanticObjectId
    from bson.errors import InvalidId
    try:
        oid = PydanticObjectId(job_id)
    except (ValueError, TypeError, InvalidId):
        return None
    return await Job.get(oid)


# ─── GET /api/offers ─────────────────────────────────────────────────────────

@router.get("/", response_model=list[OfferOut])
async def list_offers(current_user: User = Depends(get_current_user)):
    """Role-aware list:

    * CANDIDATE → only offers addressed to them.
    * RECRUITER → only offers for jobs in their company.
    * ADMIN     → all offers.
    """
    if current_user.role == UserRole.CANDIDATE:
        offers = await Offer.find(Offer.candidate_id == str(current_user.id)).to_list()
        return [_offer_to_out(o) for o in offers]

    if current_user.role == UserRole.RECRUITER:
        if current_user.company_id is None:
            return []
        jobs = await Job.find(Job.company_id == current_user.company_id).to_list()
        if not jobs:
            return []
        job_ids = [str(j.id) for j in jobs]
        offers = await Offer.find({"job_id": {"$in": job_ids}}).to_list()
        return [_offer_to_out(o) for o in offers]

    # ADMIN
    offers = await Offer.find_all().to_list()
    return [_offer_to_out(o) for o in offers]


# ─── POST /api/offers ────────────────────────────────────────────────────────

@router.post("/", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferCreate,
    current_user: User = Depends(get_current_user),
):
    """Recruiter creates an offer for a candidate on one of their jobs."""
    if current_user.role not in (UserRole.RECRUITER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access required",
        )

    job = await _safe_get_job(payload.job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if (
        current_user.role == UserRole.RECRUITER
        and job.company_id != current_user.company_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create offers for this job",
        )

    from beanie import PydanticObjectId
    from bson.errors import InvalidId
    try:
        uid = PydanticObjectId(payload.candidate_id)
    except (ValueError, TypeError, InvalidId):
        raise HTTPException(status_code=400, detail="Invalid candidate ID")

    candidate = await User.find_one({"_id": uid, "role": UserRole.CANDIDATE})
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    offer = Offer(
        job_id=payload.job_id,
        candidate_id=payload.candidate_id,
        recruiter_id=str(current_user.id),
        salary_offered=payload.salary_offered,
        benefits=payload.benefits,
        message=payload.message,
        status="PENDING",
    )
    await offer.insert()

    try:
        await NotificationService.notify_offer_created(
            candidate_id=offer.candidate_id,
            job_title=job.title,
            offer_id=str(offer.id),
        )
    except Exception:
        logger.exception("Failed to send offer_created notification")

    return _offer_to_out(offer)


# ─── PUT /api/offers/{id}/status ────────────────────────────────────────────

@router.put("/{offer_id}/status", response_model=OfferOut)
async def update_offer_status(
    offer_id: str,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """Candidate accepts or rejects an offer addressed to them."""
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can accept or reject offers",
        )

    new_status = body.get("status") if isinstance(body, dict) else None
    if new_status not in _ALLOWED_OFFER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be ACCEPTED or REJECTED",
        )

    from beanie import PydanticObjectId
    from bson.errors import InvalidId
    try:
        oid = PydanticObjectId(offer_id)
    except (ValueError, TypeError, InvalidId):
        raise HTTPException(status_code=400, detail="Invalid offer ID")

    offer = await Offer.get(oid)
    if offer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found",
        )

    if offer.candidate_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your offer",
        )

    offer.status = new_status
    await offer.save()

    job = await _safe_get_job(offer.job_id)
    job_title = job.title if job else "Unknown Position"
    candidate_name = current_user.full_name

    try:
        if new_status == "ACCEPTED":
            await NotificationService.notify_offer_accepted(
                recruiter_id=offer.recruiter_id,
                candidate_name=candidate_name,
                job_title=job_title,
            )
        else:
            await NotificationService.notify_offer_rejected(
                recruiter_id=offer.recruiter_id,
                candidate_name=candidate_name,
                job_title=job_title,
            )
    except Exception:
        logger.exception("Failed to send offer status notification")

    return _offer_to_out(offer)
