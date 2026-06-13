# DirectHire backend — second-round review fixes

**Date:** 2026-06-13
**Branch:** `main` (HEAD b50d747)
**Scope:** 8 bug fixes from the post-merge code review of commits f4b1b65..097669d.

## Goal

Apply 8 targeted bug fixes to `main`, **in one commit**. No new tests, no refactors, no new features. The diff stays minimal and reviewable.

## Files touched (5)

- `backend/apps/agents/router.py` — bug 1 (match_score range), bug 3 (print → logger)
- `backend/apps/notifications/service.py` — bug 2 (gather traceback), bug 8 (parallel socket emit)
- `backend/apps/candidate/router.py` — bug 4 (InvalidId import), bug 7 (logger on drop)
- `backend/apps/interview/router.py` — bug 5 (narrow except), bug 6 (Job.get helpers)
- `backend/apps/agents/router.py` — bug 6 (wrap raw Job.get sites)

## The 8 fixes

### Bug 1 — `_extract_match_score` primary path lacks 0-100 range check

**File:** `backend/apps/agents/router.py:41-56`

The labeled-score branch returns `float(m.group(1))` with no clamp, while the fallback correctly does `if 0 <= val <= 100: return val`. An LLM emission like `"final score: 200"` or `"score: 5/10"` flows unbounded into `combined` and is persisted to `Application.match_score` and `Ranking.match_score`.

**Change:** after `m = re.search(...)` matches, clamp the value to [0, 100].

```python
def _extract_match_score(text: str) -> float:
    """Parse a 0-100 match score from a string that may contain extra text."""
    # Try to find a number explicitly labeled as score (DOTALL for multi-line responses,
    # \b to avoid matching "score" inside words like "underscore" or "subscore").
    m = re.search(r"(?i)\bscore\b.*?(\d+(?:\.\d+)?)", text, re.DOTALL)
    if m:
        val = float(m.group(1))
        return max(0.0, min(100.0, val))

    # Fallback to first in-range number, since unlabeled responses often lead
    # with the score.
    numbers = re.findall(r"\b(\d+(?:\.\d+)?)\b", text)
    for n in numbers:
        val = float(n)
        if 0 <= val <= 100:
            return val
    return 0.0
```

### Bug 2 — `notify_interview_scheduled` uses `logger.warning` (no traceback)

**File:** `backend/apps/notifications/service.py:183-185`

The gather's partial-failure handler uses `logger.warning(f"...{r}")`, but the same PR explicitly replaced `logger.warning(f"...{e}")` with `logger.exception(...)` in `assessment/router.py` and `interview/router.py`. Inconsistency: the gather path is the only one still on `logger.warning`.

**Change:** pass `exc_info=r` to capture the traceback. (Note: `logger.exception` is for use *inside* an `except` block; this code is not in one, so `logger.warning(..., exc_info=r)` is the correct form.)

```python
for r in results:
    if isinstance(r, Exception):
        logger.warning("[notify_interview_scheduled] partial failure", exc_info=r)
```

### Bug 3 — `agents/router.py` still uses `print(f"[X] Error: {e}")`

**File:** `backend/apps/agents/router.py:165, 215, 268, 337`

Commit e340acf added module loggers in 4 other files but missed this one. The 4 background tasks (`_run_match_task`, `_run_analyze_task`, `_run_schedule_task`, `_run_negotiate_task`) still print errors to stdout (often discarded in production), losing the traceback.

**Change:** add module-level `logger`, replace the 4 `print(f"[X] Error: {e}")` with `logger.exception("[X] failed")`.

```python
# at module top, after existing imports
import logging
logger = logging.getLogger(__name__)
```

Then in each of the 4 background tasks, change the `except Exception as e:` block from:
```python
    except Exception as e:
        print(f"[match] Error: {e}")
```
to:
```python
    except Exception:
        logger.exception("[match] failed")
```

Apply at lines 165, 215, 268, 337 (labels: `[match]`, `[analyze]`, `[schedule]`, `[negotiate]`).

### Bug 4 — `from bson.errors import InvalidId` — bson not in requirements.txt

**File:** `backend/apps/candidate/router.py:7`

`bson` is not a direct dependency; the import relies on pymongo's transitive re-export, which has been historically stable but is not guaranteed across all distributions and pymongo versions.

**Change:** import from `pymongo.errors` instead. PyMongo re-exports `InvalidId` from `pymongo.errors` as a stable public API; pymongo is a transitive of `motor` and `beanie` and is always present.

```python
from pymongo.errors import InvalidId
```

### Bug 5 — `_safe_get_interview` over-broad `except Exception`

**File:** `backend/apps/interview/router.py:50-65`

The wrapper catches every exception from `PydanticObjectId(interview_id)`, masking non-validation errors (`MemoryError`, `RecursionError`, etc.) as `HTTP 400 "Invalid interview ID"`.

**Change:** narrow the exception tuple to the actual set that PydanticObjectId can raise.

```python
async def _safe_get_interview(interview_id: str) -> Interview:
    """Fetch an Interview by id, returning HTTP 400 for malformed IDs.

    Beanie's Document.get() raises pydantic_core.ValidationError inside
    get() for non-ObjectId strings, so the simple `if not interview`
    pattern returns 500. This wrapper converts first, then fetches.
    """
    from beanie import PydanticObjectId
    from pymongo.errors import InvalidId
    try:
        oid = PydanticObjectId(interview_id)
    except (ValueError, TypeError, InvalidId):
        raise HTTPException(status_code=400, detail="Invalid interview ID")
    interview = await Interview.get(oid)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview
```

(Note: the status-code ordering leak — 400 vs 404 vs 403 — is a known property of the wrapper, documented in the review. The fix is intentional: the wrapper exists to convert Beanie's `ValidationError` 500 into a clean 400, and the role check runs after. Out of scope to also collapse to 404 in this PR.)

### Bug 6 — `Job.get(raw_string)` 500s on malformed IDs (8 sites)

**Files:** `backend/apps/interview/router.py:257, 282`; `backend/apps/agents/router.py:94, 296, 346, 380, 459, 507`

The `_safe_get_interview` wrapper protects `Interview.get` but no analogous wrapper exists for `Job.get`. Same 500-on-malformed-id bug class.

**Change:** add TWO module-level helpers in `backend/apps/interview/router.py`:
- `_safe_get_job(job_id: str) -> Job` — raises HTTPException(400/404). For HTTP routes that need a job or fail.
- `_try_get_job(job_id: str) -> Job | None` — returns None on bad/missing. For background tasks where errors are logged not raised.

```python
async def _safe_get_job(job_id: str) -> Job:
    """Fetch a Job by id, returning HTTP 400 for malformed IDs and 404 for missing."""
    from beanie import PydanticObjectId
    from pymongo.errors import InvalidId
    try:
        oid = PydanticObjectId(job_id)
    except (ValueError, TypeError, InvalidId):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    job = await Job.get(oid)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


async def _try_get_job(job_id: str) -> Job | None:
    """Fetch a Job by id, returning None on malformed ID or missing doc.
    Use in background tasks where the caller can't raise HTTPException.
    """
    from beanie import PydanticObjectId
    from pymongo.errors import InvalidId
    try:
        oid = PydanticObjectId(job_id)
    except (ValueError, TypeError, InvalidId):
        return None
    return await Job.get(oid)
```

Then replace each of the 8 raw-string `Job.get(...)` calls:

| File:line | Original | Replace with |
|---|---|---|
| interview/router.py:257 | `job = await Job.get(interview.job_id)` | `job = await _try_get_job(interview.job_id)` (followed by `job_title = job.title if job else ""` — keep existing fallback) |
| interview/router.py:282 | same as above | same |
| agents/router.py:94 | `job = await RecruiterJob.get(job_id)` | `job = await _try_get_job(str(job_id))` (background task — return None on bad id) |
| agents/router.py:296 | `job = await RecruiterJob.get(offer.job_id)` | `job = await _try_get_job(str(offer.job_id))` |
| agents/router.py:346 | `job = await RecruiterJob.get(payload.job_id)` | `job = await _safe_get_job(payload.job_id)` (raises 404 — caller already handles this) |
| agents/router.py:380 | `job = await RecruiterJob.get(payload.job_id)` | same |
| agents/router.py:459 | `job = await RecruiterJob.get(job_id)` | same |
| agents/router.py:507 | `job = await RecruiterJob.get(payload.job_id)` | same |

Note: `agents/router.py` imports `Job as RecruiterJob` (line 23). The new helpers are in `interview/router.py`. Import the helpers in `agents/router.py`:
```python
from apps.interview.router import _safe_get_job, _try_get_job
```

This introduces a cross-router import. Acceptable: the helpers are pure utilities with no router-level state, and the alternative is duplicating them in `agents/router.py`.

For interview/router.py sites 257/282, the helpers live in the same file, so just call them directly.

### Bug 7 — Silent drop of malformed IDs in `_fetch_jobs_for_items`

**File:** `backend/apps/candidate/router.py:138-153`

The narrow `except (ValueError, TypeError, InvalidId): pass` (introduced in the previous round) silently drops malformed IDs. If a deploy wrote a slug instead of a hex, the candidate's response silently shows `job=None` for affected applications.

**Change:** add module-level `logger` to `apps/candidate/router.py`, log a warning per dropped id.

```python
# at module top, after existing imports
import logging
logger = logging.getLogger(__name__)
```

Then in `_fetch_jobs_for_items`:
```python
for jid in job_ids:
    try:
        obj_job_ids.append(PydanticObjectId(jid))
    except (ValueError, TypeError, InvalidId):
        logger.warning("dropping malformed job_id: %r", jid)
```

Same for company_ids (line 152): `logger.warning("dropping malformed company_id: %r", cid)`.

### Bug 8 — Sequential WebSocket emit loop

**File:** `backend/apps/notifications/service.py:60-82`

`for sid in sids: await sio.emit(..., to=sid)` is sequential. A single slow or unresponsive client socket stalls delivery to all other connected sockets for the same user.

**Change:** replace the loop with `asyncio.gather(..., return_exceptions=True)` and a post-gather log loop. Same pattern already used by `notify_interview_scheduled` in the same file.

```python
sids = list(connected_users.get(user_id, set()))
if sids:
    results = await asyncio.gather(
        *(sio.emit(
            "new_notification",
            {
                "id": str(notification.id),
                "type": notification.type,
                "title": notification.title,
                "message": notification.message,
                "created_at": notification.created_at.isoformat(),
                "read": notification.read,
                "related_id": notification.related_id,
            },
            to=sid,
        ) for sid in sids),
        return_exceptions=True,
    )
    for sid, r in zip(sids, results):
        if isinstance(r, Exception):
            logger.warning("[Socket] Failed to emit notification to %s: %r", sid, r)
```

Note: `zip(sids, results)` is safe because `gather` returns one result per input coroutine, in order.

## Commit structure (1 commit)

Single commit on a fix branch, merged to main:

```
fix: 8 review findings (data correctness, log tracebacks, dep stability)

Findings (ranked most-severe first):
1. _extract_match_score lacks 0-100 range check on labeled path; LLM
   output like 'score: 200' or 'score: 5/10' flows into match_score
   unbounded, persisted to DB and shown in UI.
2. notify_interview_scheduled's gather uses logger.warning without
   traceback while the same PR fixed the same pattern elsewhere.
3. apps/agents/router.py still uses print() for errors in 4 background
   tasks; e340acf missed this file.
4. from bson.errors import InvalidId — bson is not a direct dep;
   switch to pymongo.errors which is a stable transitive.
5. _safe_get_interview uses bare except Exception; narrow to the
   actual set PydanticObjectId can raise.
6. Job.get(raw_string) is unwrapped at 8 sites (2 in interview/router.py,
   6 in agents/router.py); same 500-on-malformed-id bug class as
   _safe_get_interview fixed. Add _safe_get_job and _try_get_job helpers.
7. _fetch_jobs_for_items silently drops malformed job_id/company_id
   with no log; add a warning per drop.
8. WebSocket emit loop is sequential; replace with asyncio.gather
   so one slow client doesn't block the others.
```

## Out of scope

- No new tests.
- No edits to `app/core/config.py` (dead code module).
- No edits to the test config (`pytest.ini`, `conftest.py`) — those are uncommitted working-tree changes from before this session.
- No refactoring of `_safe_get_interview` into a generic `safe_get(Document, id_str)` utility (altitude concern flagged in the review, but it's a bigger refactor that touches 10+ files).
- No edits to the pre-existing `_send_email` `logger.warning` pattern (notifications/service.py:41) — same anti-pattern, but not in this review scope.

## Validation

After the commit, run from `backend/`:

```bash
python -c "from apps.agents.router import _extract_match_score; from apps.notifications.service import NotificationService; from apps.candidate.router import _fetch_jobs_for_items; from apps.interview.router import _safe_get_interview, _safe_get_job, _try_get_job; print('ok')"
```

Then the full test suite:

```bash
python -m pytest tests/ -x
```

Expected: 11/11 still pass (no test files changed).

## Risks

- **Bug 1** changes behavior of `_extract_match_score` for any LLM output that produced values outside 0-100. Real LLM output should be re-tested.
- **Bug 4** import path change — `pymongo.errors.InvalidId` has been stable across pymongo 3.x and 4.x. Low risk.
- **Bug 6** adds a cross-router import from `apps.agents.router` to `apps.interview.router`. Acceptable: helpers are pure utilities. If the team wants to avoid the cross-router dep, move them to a new `core/utils.py` (out of scope here).
- **Bug 8** changes the per-iteration `try/except` to a gather. Log order changes (gather logs at end, loop logs per sid). Functionally equivalent.

## Self-review

- **Placeholders:** none. Every fix has concrete file:line and code shape.
- **Internal consistency:** bug 4 and bug 5 both use `from pymongo.errors import InvalidId` — consistent. Bug 6 helpers mirror the existing `_safe_get_interview` shape. Bug 7 adds the same `logger = logging.getLogger(__name__)` pattern used elsewhere.
- **Scope:** 8 fixes, all in working tree, all small. Single commit carries this.
- **Ambiguity:** bug 6's split into `_safe_get_job` (raising) and `_try_get_job` (returning None) is explicit; the table maps each of the 8 sites to one or the other.
