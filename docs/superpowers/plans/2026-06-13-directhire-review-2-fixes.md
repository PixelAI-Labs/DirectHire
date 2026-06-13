# DirectHire Review-2 Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply 8 bug fixes from the post-merge code review of commits f4b1b65..097669d, in a single commit on a fix branch, then merge to main.

**Architecture:** 8 mechanical patches across 5 files, applied as a single atomic commit. Each fix is independent; the commit message lists all 8 in priority order. No new tests, no refactors.

**Tech Stack:** Python 3.x, FastAPI, Beanie (MongoDB ODM), pytest-asyncio.

**Spec:** `docs/superpowers/specs/2026-06-13-directhire-review-2-fixes-design.md`

**Repo root:** `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire`

**Base branch:** `main` (HEAD ed1ce6e)

---

## File Structure

**Modified files (5):**

- `backend/apps/agents/router.py` — bug 1 (match_score clamp), bug 3 (module logger + 4 print→logger), bug 6 (6 sites wrap raw Job.get)
- `backend/apps/notifications/service.py` — bug 2 (gather traceback), bug 8 (parallel socket emit)
- `backend/apps/candidate/router.py` — bug 4 (InvalidId import path), bug 7 (logger on id drop)
- `backend/apps/interview/router.py` — bug 5 (narrow except), bug 6 (add _safe_get_job + _try_get_job helpers + wrap 2 sites)

No new files. No test changes. No configuration changes.

---

## Task 1: Create fix branch and apply all 8 fixes in one commit

**Files:**
- Modify: `backend/apps/agents/router.py`
- Modify: `backend/apps/notifications/service.py`
- Modify: `backend/apps/candidate/router.py`
- Modify: `backend/apps/interview/router.py`

- [ ] **Step 1: Create the fix branch**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git checkout -b fix/review-2-fixes
```

Expected: branch created. Verify with `git branch --show-current` → `fix/review-2-fixes`.

- [ ] **Step 2: Apply bug 1 — clamp match_score to 0-100 in `_extract_match_score`**

Open `backend/apps/agents/router.py`. The current function (lines 41-56) is:

```python
def _extract_match_score(text: str) -> float:
    """Parse a 0-100 match score from a string that may contain extra text."""
    # Try to find a number explicitly labeled as score (DOTALL for multi-line responses,
    # \b to avoid matching "score" inside words like "underscore" or "subscore").
    m = re.search(r"(?i)\bscore\b.*?(\d+(?:\.\d+)?)", text, re.DOTALL)
    if m:
        return float(m.group(1))

    # Fallback to first in-range number, since unlabeled responses often lead
    # with the score.
    numbers = re.findall(r"\b(\d+(?:\.\d+)?)\b", text)
    for n in numbers:
        val = float(n)
        if 0 <= val <= 100:
            return val
    return 0.0
```

Replace the labeled-score branch (`if m: return float(m.group(1))`) so the returned value is clamped to [0, 100]. The full new function:

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

- [ ] **Step 3: Apply bug 3 — module logger + 4 print→logger in `agents/router.py`**

Open `backend/apps/agents/router.py`. After the existing top-level imports (after `from apps.recruiter.models import Ranking` on line 24, before `router = APIRouter()` on line 26), add:

```python
import logging
logger = logging.getLogger(__name__)
```

Then replace the 4 `print(f"[X] Error: {e}")` calls with `logger.exception(...)`. Each replacement:

**Site 1 — line 164-165 (in `_run_match_task`):**
Replace:
```python
    except Exception as e:
        print(f"[match] Error: {e}")
```
With:
```python
    except Exception:
        logger.exception("[match] failed")
```

**Site 2 — line 214-215 (in `_run_analyze_task`):**
Replace:
```python
    except Exception as e:
        print(f"[analyze] Error: {e}")
```
With:
```python
    except Exception:
        logger.exception("[analyze] failed")
```

**Site 3 — line 267-268 (in `_run_schedule_task`):**
Replace:
```python
    except Exception as e:
        print(f"[schedule] Error: {e}")
```
With:
```python
    except Exception:
        logger.exception("[schedule] failed")
```

**Site 4 — line 336-337 (in `_run_negotiate_task`):**
Replace:
```python
    except Exception as e:
        print(f"[negotiate] Error: {e}")
```
With:
```python
    except Exception:
        logger.exception("[negotiate] failed")
```

- [ ] **Step 4: Apply bug 6 — add `_safe_get_job` and `_try_get_job` helpers in `interview/router.py`**

Open `backend/apps/interview/router.py`. After the existing `_safe_get_interview` helper (which ends around line 64) and before the first `@router.post("/")` decorator, add TWO new helpers:

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


async def _try_get_job(job_id: str):
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

- [ ] **Step 5: Apply bug 5 — narrow `_safe_get_interview` except clause**

In the same file `backend/apps/interview/router.py`, the existing `_safe_get_interview` (around line 50-64) currently has:

```python
    from beanie import PydanticObjectId
    try:
        oid = PydanticObjectId(interview_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid interview ID")
```

Change the `except Exception:` line to:

```python
    from beanie import PydanticObjectId
    from pymongo.errors import InvalidId
    try:
        oid = PydanticObjectId(interview_id)
    except (ValueError, TypeError, InvalidId):
        raise HTTPException(status_code=400, detail="Invalid interview ID")
```

- [ ] **Step 6: Apply bug 6 (interview/router.py sites) — wrap 2 raw `Job.get` calls**

In `backend/apps/interview/router.py`:

**Site 1 — `generate_next_question` (around line 257):**
Replace:
```python
    job = await Job.get(interview.job_id)
    job_title = job.title if job else ""
```
With:
```python
    job = await _try_get_job(interview.job_id)
    job_title = job.title if job else ""
```

**Site 2 — `evaluate_interview` (around line 282):**
Replace:
```python
    job = await Job.get(interview.job_id)
    job_title = job.title if job else ""
```
With:
```python
    job = await _try_get_job(interview.job_id)
    job_title = job.title if job else ""
```

- [ ] **Step 7: Apply bug 6 (agents/router.py sites) — wrap 6 raw `Job.get` calls**

In `backend/apps/agents/router.py`:

First, add the import at the top of the file. After the existing imports (after `from apps.recruiter.models import Ranking` on line 24), add:

```python
from apps.interview.router import _safe_get_job, _try_get_job
```

Then replace each of the 6 raw `RecruiterJob.get(raw_string)` calls:

**Site 1 — line 94 (`_run_match_task`, background task):**
Replace:
```python
        job = await RecruiterJob.get(job_id)
        if not job:
            return
```
With:
```python
        job = await _try_get_job(job_id)
        if not job:
            return
```

**Site 2 — line 296 (`_run_negotiate_task`, background task):**
Replace:
```python
        job = await RecruiterJob.get(offer.job_id)
```
With:
```python
        job = await _try_get_job(offer.job_id)
```

(If the original line is followed by `if not job:` keep that. If not, do not add it.)

**Site 3 — line 346 (`screen_candidate`, HTTP route):**
Replace:
```python
    job = await RecruiterJob.get(payload.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
```
With:
```python
    job = await _safe_get_job(payload.job_id)
```

(The helper raises 404 itself, so the explicit `if not job: raise HTTPException` is replaced.)

**Site 4 — line 380 (`rank_candidates`, HTTP route):**
Replace:
```python
    job = await RecruiterJob.get(payload.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
```
With:
```python
    job = await _safe_get_job(payload.job_id)
```

**Site 5 — line 459 (`analyze_assessment_endpoint`, HTTP route):**
Replace:
```python
    job = await RecruiterJob.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
```
With:
```python
    job = await _safe_get_job(job_id)
```

**Site 6 — line 507 (`draft_offer_endpoint`, HTTP route):**
Replace:
```python
    job = await RecruiterJob.get(payload.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
```
With:
```python
    job = await _safe_get_job(payload.job_id)
```

- [ ] **Step 8: Apply bug 2 — gather traceback in `notify_interview_scheduled`**

In `backend/apps/notifications/service.py`, the partial-failure handler (around line 183-185) currently is:

```python
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"[notify_interview_scheduled] partial failure: {r}")
```

Replace with:

```python
    for r in results:
        if isinstance(r, Exception):
            logger.warning("[notify_interview_scheduled] partial failure", exc_info=r)
```

- [ ] **Step 9: Apply bug 8 — parallel WebSocket emit in `NotificationService.create`**

In `backend/apps/notifications/service.py`, the `create` method's emit loop (around lines 60-82) currently is:

```python
        # Emit WebSocket event
        sids = list(connected_users.get(user_id, set()))
        if sids:
            for sid in sids:
                try:
                    await sio.emit(
                        "new_notification",
                        {
                            "id": str(notification.id),
                            "type": notification.type,
                            "title": notification.title,
                            "message": notification.message,
                            "created_at": notification.created_at.isoformat(),
                            "read": notification.read,
                            "related_id": notification.related_id
                        },
                        to=sid
                    )
                except Exception as e:
                    logger.warning(f"[Socket] Failed to emit notification to {sid}: {e}")
```

Replace with the gather-based version:

```python
        # Emit WebSocket event
        sids = list(connected_users.get(user_id, set()))
        if sids:
            results = await asyncio.gather(
                *(
                    sio.emit(
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
                    )
                    for sid in sids
                ),
                return_exceptions=True,
            )
            for sid, r in zip(sids, results):
                if isinstance(r, Exception):
                    logger.warning("[Socket] Failed to emit notification to %s: %r", sid, r)
```

- [ ] **Step 10: Apply bug 4 — switch `InvalidId` import path in `candidate/router.py`**

In `backend/apps/candidate/router.py`, change line 7:

Replace:
```python
from bson.errors import InvalidId
```
With:
```python
from pymongo.errors import InvalidId
```

- [ ] **Step 11: Apply bug 7 — add module logger and log warnings on id drop in `_fetch_jobs_for_items`**

In `backend/apps/candidate/router.py`, after the existing top-level imports (after `from bson.errors import InvalidId` — now `from pymongo.errors import InvalidId` — on line 7, before `from core.config import settings` on line 8), add:

```python
import logging
logger = logging.getLogger(__name__)
```

Wait — Python style convention puts stdlib imports first. Better placement: after `import os` on line 4, add:

```python
import logging
```

Then after all the imports are done (after `from apps.upload.router import save_upload_file` on line 23), add:

```python
logger = logging.getLogger(__name__)
```

If the placement above doesn't match your import grouping style, either works — Python doesn't care, but consistency with `assessment/router.py` and `interview/router.py` (where `import logging` is in the stdlib block and `logger = ...` is after the third-party block) is the goal.

Now in the `_fetch_jobs_for_items` function, replace the two `except (ValueError, TypeError, InvalidId): pass` blocks:

**Site 1 — line 142 (job_ids):**
Replace:
```python
        try:
            obj_job_ids.append(PydanticObjectId(jid))
        except (ValueError, TypeError, InvalidId):
            pass
```
With:
```python
        try:
            obj_job_ids.append(PydanticObjectId(jid))
        except (ValueError, TypeError, InvalidId):
            logger.warning("dropping malformed job_id: %r", jid)
```

**Site 2 — line 152 (company_ids):**
Replace:
```python
        try:
            obj_comp_ids.append(PydanticObjectId(cid))
        except (ValueError, TypeError, InvalidId):
            pass
```
With:
```python
        try:
            obj_comp_ids.append(PydanticObjectId(cid))
        except (ValueError, TypeError, InvalidId):
            logger.warning("dropping malformed company_id: %r", cid)
```

- [ ] **Step 12: Verify all 8 fixes parse and import correctly**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -c "from apps.agents.router import _extract_match_score; from apps.notifications.service import NotificationService; from apps.candidate.router import _fetch_jobs_for_items; from apps.interview.router import _safe_get_interview, _safe_get_job, _try_get_job; print('ok')"
```

Expected: prints `ok`. If `ImportError`, `NameError`, or `SyntaxError` — stop and re-check the edits in the file mentioned in the error.

- [ ] **Step 13: Smoke-test the new behavior of bug 1 (clamping)**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -c "
from apps.agents.router import _extract_match_score
# Bug 1 fix: clamp to [0, 100]
assert _extract_match_score('Score: 200') == 100.0, f\"expected 100.0, got {_extract_match_score('Score: 200')}\"
assert _extract_match_score('Score: -5') == 0.0, f\"expected 0.0, got {_extract_match_score('Score: -5')}\"
# Bug 1 regression check: normal values still work
assert _extract_match_score('Score: 85') == 85.0
assert _extract_match_score('Score: 78.5') == 78.5
# Unlabeled fallback unchanged
assert _extract_match_score('rated 95 out of 100 with 5 years of experience') == 95.0
print('ok')
"
```

Expected: prints `ok`. If any assertion fails, re-check the clamp logic in step 2.

- [ ] **Step 14: Run the full test suite**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -m pytest tests/ -x
```

Expected: 11/11 still pass. If any test fails, STOP — do not proceed to the commit. The diff should not break any existing test.

- [ ] **Step 15: Stage and commit all changes in one commit**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git add backend/apps/agents/router.py backend/apps/notifications/service.py backend/apps/candidate/router.py backend/apps/interview/router.py
git status
```

Verify the staged files match: `agents/router.py`, `notifications/service.py`, `candidate/router.py`, `interview/router.py` (4 files). No test files, no config files, no spec files. If anything else is staged, unstage it with `git restore --staged <path>`.

Then commit:

```bash
git commit -m "fix: 8 review findings (data correctness, log tracebacks, dep stability)

Findings (ranked most-severe first):

1. _extract_match_score lacks 0-100 range check on labeled path.
   The labeled-score branch returns float(m.group(1)) unbounded, while
   the fallback correctly checks 0 <= val <= 100. An LLM emission like
   'final score: 200' or 'score: 5/10' flows into match_score and is
   persisted to Application.match_score and Ranking.match_score,
   showing >100% (or 5%) match in the UI. Clamp to [0, 100] in the
   labeled path to match the fallback.

2. notify_interview_scheduled's gather uses logger.warning(f'...{r}')
   which logs only the exception's repr. The same commit (e340acf)
   explicitly replaced logger.warning(f'...{e}') with
   logger.exception(...) in two other files; this gather path was
   missed. Pass exc_info=r to capture the traceback.

3. apps/agents/router.py still uses print(f'[X] Error: {e}') for
   error logging in 4 background tasks. e340acf added module loggers
   in 4 files but missed this one. Add logger = logging.getLogger(__name__)
   and replace the 4 prints with logger.exception.

4. from bson.errors import InvalidId — bson is not a direct dep in
   requirements.txt; the import relies on pymongo's transitive
   re-export, which is not stable across all distributions. Switch to
   from pymongo.errors import InvalidId, which is a stable public
   re-export from pymongo (always present via motor/beanie).

5. _safe_get_interview uses bare except Exception: around
   PydanticObjectId(interview_id), masking non-validation errors
   (MemoryError, RecursionError) as 'Invalid interview ID' 400.
   Narrow to (ValueError, TypeError, InvalidId) — the actual set
   PydanticObjectId can raise.

6. Job.get(raw_string) is unwrapped at 8 sites (2 in
   interview/router.py, 6 in agents/router.py); same 500-on-malformed-id
   bug class as the _safe_get_interview fix. Add _safe_get_job
   (raising) and _try_get_job (returning None) helpers and route all
   8 sites through them.

7. _fetch_jobs_for_items silently drops malformed job_id/company_id
   with no log. If a deploy writes a slug instead of a hex, the
   candidate's response silently shows job=None. Add a warning
   per drop.

8. WebSocket emit loop in NotificationService.create is sequential:
   for sid in sids: await sio.emit(..., to=sid). A single slow or
   unresponsive client socket stalls delivery to all other connected
   sockets for the same user. Replace with asyncio.gather with
   return_exceptions=True (same pattern used by
   notify_interview_scheduled) and a post-gather log loop.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Expected: one commit created on the `fix/review-2-fixes` branch. Verify with `git log --oneline -2`.

---

## Task 2: Merge to main and verify

**Files:** none (git operations only)

- [ ] **Step 1: Switch to main and merge the fix branch**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git checkout main
git merge --no-ff fix/review-2-fixes -m "merge: 8 review findings (round 2)

Second-round code review of the first 6 fixes surfaced 8 new
findings. This merge applies all 8 in a single commit:
- _extract_match_score clamp (data correctness)
- gather traceback (consistency with earlier fixes)
- agents/router.py print -> logger (e340acf missed file)
- InvalidId import path (dep stability)
- _safe_get_interview narrow except
- Job.get helper for 8 raw-string sites
- _fetch_jobs_for_items drop warnings
- parallel WebSocket emit (latency)

Spec: docs/superpowers/specs/2026-06-13-directhire-review-2-fixes-design.md"
```

Expected: merge succeeds. Verify with `git log --oneline -3`.

- [ ] **Step 2: Delete the fix branch (now merged)**

```bash
git branch -d fix/review-2-fixes
```

Expected: branch deleted.

- [ ] **Step 3: Re-run the test suite on main to confirm nothing broke**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -m pytest tests/ -v
```

Expected: 11/11 still pass. If any test fails, the merge was bad — investigate before declaring done.

- [ ] **Step 4: Verify the final main commit log**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git log --oneline -5
```

Expected output (newest first):
```
<hash> merge: 8 review findings (round 2)
<hash> fix: 8 review findings (data correctness, log tracebacks, dep stability)
<hash> docs: design spec for second-round review fixes (8 findings)
<hash> merge: 6 review-driven bug fixes
<hash> fix: narrow bare except in candidate job fetcher
```

---

## Self-Review

**1. Spec coverage:**
- Bug 1 (clamp) → Task 1 step 2 ✓
- Bug 2 (gather traceback) → Task 1 step 8 ✓
- Bug 3 (module logger + 4 print) → Task 1 step 3 ✓
- Bug 4 (InvalidId import) → Task 1 step 10 ✓
- Bug 5 (narrow except) → Task 1 step 5 ✓
- Bug 6 (Job.get helpers + 8 sites) → Task 1 steps 4, 6, 7 ✓
- Bug 7 (logger on drop) → Task 1 step 11 ✓
- Bug 8 (parallel emit) → Task 1 step 9 ✓
- Single commit ✓
- Merge to main ✓
- 11/11 tests still pass ✓ (verified by step 14 and step 3 of task 2)

**2. Placeholder scan:**
- No "TBD" / "TODO" — every edit is shown as the exact code to type.
- No "similar to Task N" — every step repeats the full code.
- No "add appropriate error handling" — the only error-handling changes are bug 5 and bug 8, both shown as full code blocks.
- No "write tests for the above" — per user decision, no tests.

**3. Type consistency:**
- `_safe_get_job(job_id: str) -> Job` defined in step 4, used at the 4 HTTP route sites in step 7. Annotations match.
- `_try_get_job(job_id: str)` (no return annotation, returns `None | Job`) defined in step 4, used at the 4 background-task sites in step 7. The 2 `interview/router.py` sites in step 6 also use `_try_get_job` (these are HTTP routes but the function tolerates `None` via the existing `if job else ""` fallback). Type-correct: `_try_get_job` returns Optional[Job] implicitly via the early `return None`.
- `logger = logging.getLogger(__name__)` added in 2 files (agents/router.py step 3, candidate/router.py step 11). Names match.
- `from pymongo.errors import InvalidId` used in 3 places (step 5, step 10, step 4 helpers in step 4). All consistent.
