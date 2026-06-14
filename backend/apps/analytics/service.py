"""Analytics aggregator — resolves review finding #2 (dashboard backend).

Reads Application.status (NOT the non-existent Ranking.application_status) so
pipeline counts reflect reality. All queries are company-scoped for recruiters;
admins see all data; other roles return zero-counts.

Pipeline stages map:
  applied     ← Application.status == "APPLIED"
  screening   ← "SCREENING"
  assessment  ← "ASSESSMENT"
  interview   ← "INTERVIEW"
  offer       ← "OFFER"
  rejected    ← "REJECTED"
  hired       ← "HIRED"

In-pipeline (candidates_in_pipeline) excludes REJECTED + HIRED.
"""
import logging
from datetime import datetime, timezone, timedelta

from apps.auth.models import User, UserRole
from apps.candidate.models import Application, CandidateProfile
from apps.interview.models import Interview
from apps.recruiter.models import Job, Offer, Ranking

logger = logging.getLogger(__name__)

# Application.status values we map into the seven pipeline stages.
_PIPELINE_STATUS_MAP = {
    "APPLIED": "applied",
    "SCREENING": "screening",
    "ASSESSMENT": "assessment",
    "INTERVIEW": "interview",
    "OFFER": "offer",
    "REJECTED": "rejected",
    "HIRED": "hired",
}

_IN_PIPELINE_STATUSES = {s for s, stage in _PIPELINE_STATUS_MAP.items() if stage not in {"rejected", "hired"}}


def _empty_pipeline_stages() -> dict[str, int]:
    return {stage: 0 for stage in _PIPELINE_STATUS_MAP.values()}


async def _recruiter_job_ids(recruiter: User) -> list[str]:
    if recruiter.company_id is None:
        return []
    jobs = await Job.find(Job.company_id == recruiter.company_id).to_list()
    return [str(j.id) for j in jobs]


async def _all_job_ids() -> list[str]:
    jobs = await Job.find_all().to_list()
    return [str(j.id) for j in jobs]


async def aggregate_dashboard(current_user: User) -> dict:
    """Return dashboard stats for the calling user.

    Recruiter → company-scoped.
    Admin     → all data.
    Candidate → zero counts (candidates do not have a recruiter dashboard).
    """
    if current_user.role == UserRole.CANDIDATE:
        return {
            "open_jobs": 0,
            "total_candidates": 0,
            "candidates_in_pipeline": 0,
            "interviews_this_week": 0,
            "offers_sent": 0,
            "pipeline_stages": _empty_pipeline_stages(),
            "top_candidates": [],
        }

    is_admin = current_user.role == UserRole.ADMIN
    job_ids = await _all_job_ids() if is_admin else await _recruiter_job_ids(current_user)
    company_id_filter = None if is_admin else current_user.company_id

    # open_jobs: only this recruiter's jobs
    if is_admin:
        open_jobs = await Job.find(Job.status == "OPEN").count()
    elif company_id_filter is not None:
        open_jobs = await Job.find(
            Job.company_id == company_id_filter,
            Job.status == "OPEN",
        ).count()
    else:
        open_jobs = 0

    if not job_ids:
        return {
            "open_jobs": open_jobs,
            "total_candidates": 0,
            "candidates_in_pipeline": 0,
            "interviews_this_week": 0,
            "offers_sent": 0,
            "pipeline_stages": _empty_pipeline_stages(),
            "top_candidates": [],
        }

    # Applications for these jobs
    applications = await Application.find({"job_id": {"$in": job_ids}}).to_list()

    distinct_candidate_ids: set[str] = set()
    pipeline_stages = _empty_pipeline_stages()
    in_pipeline_count = 0
    for app in applications:
        distinct_candidate_ids.add(app.candidate_id)
        stage = _PIPELINE_STATUS_MAP.get((app.status or "").upper())
        if stage is not None:
            pipeline_stages[stage] += 1
        if (app.status or "").upper() in _IN_PIPELINE_STATUSES:
            in_pipeline_count += 1

    total_candidates = len(distinct_candidate_ids)

    # interviews_this_week: Interview.scheduled_at within next 7 days
    now = datetime.now(timezone.utc)
    week_cutoff = now + timedelta(days=7)
    if is_admin:
        interviews_this_week = await Interview.find(
            Interview.scheduled_at >= now,
            Interview.scheduled_at <= week_cutoff,
        ).count()
    else:
        interviews_this_week = await Interview.find(
            Interview.recruiter_id == str(current_user.id),
            Interview.scheduled_at >= now,
            Interview.scheduled_at <= week_cutoff,
        ).count()

    # offers_sent: Offer rows for these jobs
    offers_sent = await Offer.find({"job_id": {"$in": job_ids}}).count()

    # top_candidates: top N by overall_score (Ranking) joined with Application + CandidateProfile + User
    rankings = await Ranking.find({"job_id": {"$in": job_ids}}).to_list()
    rankings.sort(key=lambda r: r.overall_score or 0.0, reverse=True)

    # Build candidate lookups
    user_ids = list({r.candidate_id for r in rankings})
    users_by_id: dict[str, User] = {}
    if user_ids:
        from beanie import PydanticObjectId
        from bson.errors import InvalidId
        obj_ids = []
        for cid in user_ids:
            try:
                obj_ids.append(PydanticObjectId(cid))
            except (ValueError, TypeError, InvalidId):
                continue
        users = await User.find({"_id": {"$in": obj_ids}}).to_list()
        users_by_id = {str(u.id): u for u in users}

    # Build profile lookups
    profiles = await CandidateProfile.find(
        CandidateProfile.user_id == {"$in": list({r.candidate_id for r in rankings})}
    ).to_list()
    skills_by_candidate = {p.user_id: p.skills for p in profiles}

    # Build application-status lookup (one Application per (candidate, job))
    apps_for_rankings = await Application.find({
        "job_id": {"$in": job_ids},
        "candidate_id": {"$in": list({r.candidate_id for r in rankings})},
    }).to_list()
    app_status_by_pair: dict[tuple[str, str], str] = {
        (a.candidate_id, a.job_id): a.status for a in apps_for_rankings
    }

    top_candidates = []
    for r in rankings[:5]:
        user = users_by_id.get(r.candidate_id)
        if user is None:
            continue
        top_candidates.append({
            "candidate_id": r.candidate_id,
            "full_name": user.full_name,
            "overall_score": float(r.overall_score or 0.0),
            "match_score": float(r.match_score or 0.0),
            "application_status": app_status_by_pair.get((r.candidate_id, r.job_id), ""),
            "skills": skills_by_candidate.get(r.candidate_id, []),
        })

    return {
        "open_jobs": open_jobs,
        "total_candidates": total_candidates,
        "candidates_in_pipeline": in_pipeline_count,
        "interviews_this_week": interviews_this_week,
        "offers_sent": offers_sent,
        "pipeline_stages": pipeline_stages,
        "top_candidates": top_candidates,
    }
