# DirectHire Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply 6 bug fixes identified in the uncommitted working-tree code review of `DirectHire` (commit `ad4e16e`), one commit per bug.

**Architecture:** 6 independent, mechanical patches across 5 files. No new tests (per user decision). Each task is a single commit, atomic to one bug. Tasks are ordered by review severity (high → medium). No task depends on another, so they can be reordered if needed; the listed order is the recommended commit history.

**Tech Stack:** Python 3.x, FastAPI, Beanie (MongoDB ODM), pytest-asyncio, MongoDB.

**Spec:** `docs/superpowers/specs/2026-06-13-directhire-review-fixes-design.md`

**Branch:** `main` (working tree; no PR open)

**Repo root:** `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire`

---

## File Structure

**Modified files (5):**

- `backend/apps/interview/evaluation_service.py` — fix import path for `settings` (bug 1)
- `backend/apps/interview/stt_service.py` — fix import path + rename `HUGGINGFACE_API_TOKEN` → `HUGGINGFACE_API_KEY` (bug 1)
- `backend/apps/interview/router.py` — add `_safe_get_interview` helper, wrap 6 `Interview.get` sites (bug 2), add module logger + use `logger.exception` (bug 5)
- `backend/apps/agents/router.py` — tighten regex + restore first-in-range fallback in `_extract_match_score` (bug 3)
- `backend/apps/notifications/service.py` — `return_exceptions=True` in `gather`, move `import asyncio` to module top, log partial failures (bug 4)
- `backend/apps/assessment/router.py` — add module logger + use `logger.exception` (bug 5)
- `backend/apps/candidate/router.py` — replace bare `except:` with `except (ValueError, TypeError, InvalidId)` (bug 6)

No new files. No test changes. No configuration changes.

---

## Task 1: Fix config import in interview services (Bug 1)

**Files:**
- Modify: `backend/apps/interview/evaluation_service.py:8`
- Modify: `backend/apps/interview/stt_service.py:5,12`

- [ ] **Step 1: Edit `evaluation_service.py` import**

Open `backend/apps/interview/evaluation_service.py`. On line 8, change:

```python
from app.core.config import settings
```

to:

```python
from core.config import settings
```

- [ ] **Step 2: Edit `stt_service.py` import and env-var name**

Open `backend/apps/interview/stt_service.py`. On line 5, change:

```python
from app.core.config import settings
```

to:

```python
from core.config import settings
```

On line 12, change:

```python
self.api_token = api_token or settings.HUGGINGFACE_API_TOKEN
```

to:

```python
self.api_token = api_token or settings.HUGGINGFACE_API_KEY
```

- [ ] **Step 3: Smoke-test the imports**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -c "from apps.interview.evaluation_service import InterviewEvaluationService; from apps.interview.stt_service import STTService; print('ok')"
```

Expected: prints `ok` and exits 0. If it raises `ImportError` or `AttributeError: module 'core.config' has no attribute 'HUGGINGFACE_API_KEY'`, stop and re-check the edits.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git add backend/apps/interview/evaluation_service.py backend/apps/interview/stt_service.py
git commit -m "fix: use real config in interview evaluation and stt services

The diff fixed apps/interview/ai_service.py to import from core.config,
but evaluation_service.py and stt_service.py were missed. They were
reading from the dead app.core.config module, so GEMINI_API_KEY was
always None (rule-based fallback) and HUGGINGFACE_API_TOKEN was always
None (STT returned empty string). Also rename the STT env var to
HUGGINGFACE_API_KEY, which is what the real config exposes.

Note: if production .env sets HUGGINGFACE_API_TOKEN, deploy must add
HUGGINGFACE_API_KEY as well."
```

---

## Task 2: Return 400 for malformed interview IDs (Bug 2)

**Files:**
- Modify: `backend/apps/interview/router.py` (add helper near module top, replace 6 `Interview.get` call sites at lines 109, 128, 154, 204, 238, 264)

- [ ] **Step 1: Add the `_safe_get_interview` helper**

Open `backend/apps/interview/router.py`. After the existing `_interview_to_out` function (ends at line 45) and before the first `@router.post("/")` decorator (line 48), add:

```python
async def _safe_get_interview(interview_id: str) -> Interview:
    """Fetch an Interview by id, returning HTTP 400 for malformed IDs.

    Beanie's Document.get() raises pydantic_core.ValidationError inside
    get() for non-ObjectId strings, so the simple `if not interview`
    pattern returns 500. This wrapper converts first, then fetches.
    """
    from beanie import PydanticObjectId
    try:
        oid = PydanticObjectId(interview_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid interview ID")
    interview = await Interview.get(oid)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview
```

- [ ] **Step 2: Replace 6 `Interview.get` call sites**

For each of the following 6 sites, replace the existing `interview = await Interview.get(interview_id)` block (and its associated `if not interview: raise HTTPException(...)` lines) with a single call to the new helper. The role-based authorization checks that follow stay unchanged.

**Site 1 — line 109 (in `get_interview`):**

Replace:
```python
    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
```

With:
```python
    interview = await _safe_get_interview(interview_id)
```

**Site 2 — line 128 (in `update_interview`):**

Replace:
```python
    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
```

With:
```python
    interview = await _safe_get_interview(interview_id)
```

**Site 3 — line 154 (in `delete_interview`):**

Replace:
```python
    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
```

With:
```python
    interview = await _safe_get_interview(interview_id)
```

**Site 4 — line 204 (in `submit_answer`):**

Replace:
```python
    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
```

With:
```python
    interview = await _safe_get_interview(interview_id)
```

**Site 5 — line 238 (in `generate_next_question`):**

Replace:
```python
    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
```

With:
```python
    interview = await _safe_get_interview(interview_id)
```

**Site 6 — line 264 (in `evaluate_interview`):**

Replace:
```python
    interview = await Interview.get(interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
```

With:
```python
    interview = await _safe_get_interview(interview_id)
```

- [ ] **Step 3: Verify the file parses**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -c "from apps.interview.router import _safe_get_interview, get_interview, update_interview, delete_interview, submit_answer, generate_next_question, evaluate_interview; print('ok')"
```

Expected: prints `ok` and exits 0. If `SyntaxError` or `ImportError`, re-check the edits — most likely a missing or extra `if not interview` block in one of the 6 sites.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git add backend/apps/interview/router.py
git commit -m "fix: return 400 for malformed interview IDs

Beanie's Document.get() raises pydantic_core.ValidationError inside
get() for non-ObjectId strings, so the if-not-interview check is
unreachable and FastAPI returns HTTP 500 with a ValidationError body.
The diff already had the right pattern for Job.get at router.py:57-61
(PydanticObjectId + try/except -> 400), but missed the 6 Interview.get
sites. Extract a _safe_get_interview helper and route all 6 calls
through it."
```

---

## Task 3: Tighten `_extract_match_score` (Bug 3)

**Files:**
- Modify: `backend/apps/agents/router.py:41-55`

- [ ] **Step 1: Remove the inline `import re`**

The file already has `import re` at module top (line 3). Remove the redundant `import re` from inside `_extract_match_score` (currently line 43).

Open `backend/apps/agents/router.py`. In the `_extract_match_score` function body, delete the line:

```python
    import re
```

- [ ] **Step 2: Replace the regex and fallback loop**

Replace the entire body of `_extract_match_score` (currently lines 41-55) with:

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

- [ ] **Step 3: Smoke-test the function**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -c "
from apps.agents.router import _extract_match_score
assert _extract_match_score('Score: 87') == 87.0
assert _extract_match_score('rated 95 out of 100 with 5 years of experience') == 95.0
assert _extract_match_score('I rate this candidate 78/100') == 78.0
assert _extract_match_score('Final score:\n85\nSummary: good') == 85.0
assert _extract_match_score('no numbers here') == 0.0
print('ok')
"
```

Expected: prints `ok`. If any assertion fails, re-check the regex (`\bscore\b`) and the loop (no `reversed`).

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git add backend/apps/agents/router.py
git commit -m "fix: tighten _extract_match_score to first in-range number

The previous diff introduced two regressions:
1. Regex r\"(?i)score.*?\\b(\\d+...)\\b\" matched any word CONTAINING
   'score' (underscore, subscore) and skipped newlines without DOTALL.
2. Fallback used reversed(numbers), so 'rated 95 out of 100 with 5
   years of experience' returned 5 instead of 95.

Restore the previous first-in-range ordering and use \\b before
'score' plus re.DOTALL for multi-line responses."
```

---

## Task 4: Don't mask partial notification failures (Bug 4)

**Files:**
- Modify: `backend/apps/notifications/service.py:5,158-176`

- [ ] **Step 1: Move `import asyncio` to module top**

Open `backend/apps/notifications/service.py`. After the existing top-level imports (after `from core.socket import sio, connected_users` on line 9), add:

```python
import asyncio
```

Then remove the inline `import asyncio` from inside `notify_interview_scheduled` (currently line 160).

- [ ] **Step 2: Use `return_exceptions=True` and log partial failures**

Replace the body of `notify_interview_scheduled` (currently lines 158-176) with:

```python
    @staticmethod
    async def notify_interview_scheduled(candidate_id: str, recruiter_id: str, job_title: str, interview_id: str) -> None:
        """Interview scheduled → both parties notified.

        Uses asyncio.gather(return_exceptions=True) so a failure in one
        notification does not cancel the other. Both DB writes are
        attempted; any exception is logged at warning level.
        """
        results = await asyncio.gather(
            NotificationService.create(
                user_id=candidate_id,
                type="INTERVIEW",
                title="Interview Scheduled",
                message=f"An interview for '{job_title}' has been scheduled.",
                related_id=interview_id,
            ),
            NotificationService.create(
                user_id=recruiter_id,
                type="INTERVIEW",
                title="Interview Scheduled",
                message=f"An interview for '{job_title}' has been scheduled with the candidate.",
                related_id=interview_id,
            ),
            return_exceptions=True,
        )
        for r in results:
            if isinstance(r, Exception):
                logger.warning(f"[notify_interview_scheduled] partial failure: {r}")
```

- [ ] **Step 3: Smoke-test the function still imports**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -c "from apps.notifications.service import NotificationService; import inspect; assert 'import asyncio' not in inspect.getsource(NotificationService.notify_interview_scheduled); print('ok')"
```

Expected: prints `ok`. If `AssertionError` (inline `import asyncio` still present), re-check the edit.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git add backend/apps/notifications/service.py
git commit -m "fix: don't mask partial notification failures in gather

asyncio.gather with default return_exceptions=False raises on the
first exception while the other task continues running, so partial
failure was invisible to the route. Switch to return_exceptions=True
and log any per-recipient exception at warning level. Move the lazy
import asyncio to module top."
```

---

## Task 5: Log notification errors with tracebacks (Bug 5)

**Files:**
- Modify: `backend/apps/assessment/router.py` (add module logger, fix the except block at lines 118-126)
- Modify: `backend/apps/interview/router.py` (add module logger, fix the except block at lines 75-84)

- [ ] **Step 1: Add module logger to `assessment/router.py`**

Open `backend/apps/assessment/router.py`. After the existing top-level imports (after the last `from ...` line, before `router = APIRouter()` on line 20), add:

```python
import logging
logger = logging.getLogger(__name__)
```

- [ ] **Step 2: Replace the `except` block in `assessment/router.py`**

In the `create_assessment` function, replace the existing block (currently lines 118-126):

```python
    try:
        await NotificationService.notify_assessment_assigned(
            candidate_id=assessment.candidate_id,
            job_title=job.title,
            assessment_id=str(assessment.id)
        )
    except Exception as e:
        import logging
        logging.warning(f"Failed to send assessment notification: {e}")
```

With:

```python
    try:
        await NotificationService.notify_assessment_assigned(
            candidate_id=assessment.candidate_id,
            job_title=job.title,
            assessment_id=str(assessment.id)
        )
    except Exception:
        logger.exception("Failed to send assessment notification")
```

- [ ] **Step 3: Add module logger to `interview/router.py`**

Open `backend/apps/interview/router.py`. After the existing top-level imports (after the last `from ...` line, before `router = APIRouter()` on line 18), add:

```python
import logging
logger = logging.getLogger(__name__)
```

- [ ] **Step 4: Replace the `except` block in `interview/router.py`**

In the `create_interview` function, replace the existing block (currently lines 75-84):

```python
    try:
        await NotificationService.notify_interview_scheduled(
            candidate_id=interview.candidate_id,
            recruiter_id=interview.recruiter_id,
            job_title=job.title,
            interview_id=str(interview.id)
        )
    except Exception as e:
        import logging
        logging.warning(f"Failed to send interview notification: {e}")
```

With:

```python
    try:
        await NotificationService.notify_interview_scheduled(
            candidate_id=interview.candidate_id,
            recruiter_id=interview.recruiter_id,
            job_title=job.title,
            interview_id=str(interview.id)
        )
    except Exception:
        logger.exception("Failed to send interview notification")
```

- [ ] **Step 5: Verify both files parse and have no inline `import logging` in except blocks**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -c "
import inspect
from apps.assessment import router as a
from apps.interview import router as i
assert hasattr(a, 'logger'), 'assessment router missing module logger'
assert hasattr(i, 'logger'), 'interview router missing module logger'
a_src = inspect.getsource(a.create_assessment)
i_src = inspect.getsource(i.create_interview)
assert 'import logging' not in a_src, 'assessment still has inline import logging'
assert 'import logging' not in i_src, 'interview still has inline import logging'
assert 'logger.exception' in a_src, 'assessment missing logger.exception'
assert 'logger.exception' in i_src, 'interview missing logger.exception'
print('ok')
"
```

Expected: prints `ok`. If any assertion fails, re-check the edits.

- [ ] **Step 6: Commit**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git add backend/apps/assessment/router.py backend/apps/interview/router.py
git commit -m "fix: log notification errors with tracebacks, not root logger

The previous diff wrapped notification calls in
try: ... except Exception: import logging; logging.warning(...)
which (a) routes through the root logger, (b) does not capture
tracebacks (warning() vs exception()), and (c) leaves an inline
import inside the except block. Replace with a module-level
logger = logging.getLogger(__name__) and logger.exception(...).
Trivial fix; same pattern in both files."
```

---

## Task 6: Narrow bare `except` in candidate job fetcher (Bug 6)

**Files:**
- Modify: `backend/apps/candidate/router.py:131-154`

- [ ] **Step 1: Add the `InvalidId` import**

Open `backend/apps/candidate/router.py`. Add the import to the existing `from beanie.operators import In` line (or as a new import near it). The cleanest option is to change the existing line:

```python
from beanie.operators import In
```

to:

```python
from beanie import PydanticObjectId
from beanie.operators import In
from bson.errors import InvalidId
```

(Note: `PydanticObjectId` is already imported inline in this function on line 136; the spec accepts that pattern, but importing at module top is cleaner. The minimal fix is to add `from bson.errors import InvalidId` at the top of the file. Either approach works — pick whichever produces a smaller diff.)

**Minimal-diff approach** — only add what's missing. Add right after the existing `from beanie.operators import In` line (line 6):

```python
from bson.errors import InvalidId
```

Leave the inline `from beanie import PydanticObjectId` inside `_fetch_jobs_for_items` alone.

- [ ] **Step 2: Replace the two bare `except:` clauses**

In `_fetch_jobs_for_items`, replace both `except: pass` blocks. The first one (line 141):

```python
        try:
            obj_job_ids.append(PydanticObjectId(jid))
        except:
            pass
```

becomes:

```python
        try:
            obj_job_ids.append(PydanticObjectId(jid))
        except (ValueError, TypeError, InvalidId):
            pass
```

The second one (line 151):

```python
        try:
            obj_comp_ids.append(PydanticObjectId(cid))
        except:
            pass
```

becomes:

```python
        try:
            obj_comp_ids.append(PydanticObjectId(cid))
        except (ValueError, TypeError, InvalidId):
            pass
```

- [ ] **Step 3: Verify the function still works**

Run from `C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend`:

```bash
python -c "
import inspect
from apps.candidate.router import _fetch_jobs_for_items
src = inspect.getsource(_fetch_jobs_for_items)
assert 'except:' not in src.replace('except (', ''), 'still has bare except:'
assert 'InvalidId' in src, 'missing InvalidId reference'
print('ok')
"
```

Expected: prints `ok`. If `AssertionError`, re-check the edits.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git add backend/apps/candidate/router.py
git commit -m "fix: narrow bare except in candidate job fetcher

The new _fetch_jobs_for_items uses try/except: pass when converting
raw IDs to PydanticObjectId. Bare except: catches BaseException
(including KeyboardInterrupt and SystemExit). Narrow to
(ValueError, TypeError, InvalidId), which is the actual set of
exceptions the conversion can raise."
```

---

## Final Validation

After all 6 commits, run the import smoke-test from the spec:

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire\backend
python -c "from apps.interview.evaluation_service import InterviewEvaluationService; from apps.interview.stt_service import STTService; print('ok')"
```

Expected: `ok`. If it fails, re-check Task 1's edits (most likely a stale `HUGGINGFACE_API_TOKEN` reference in another file).

Verify the commit history:

```bash
cd C:\Users\Lenovo\OneDrive\Documents\GitHub\DirectHire
git log --oneline -7
```

Expected output (newest first):
```
<hash> fix: narrow bare except in candidate job fetcher
<hash> fix: log notification errors with tracebacks, not root logger
<hash> fix: don't mask partial notification failures in gather
<hash> fix: tighten _extract_match_score to first in-range number
<hash> fix: return 400 for malformed interview IDs
<hash> fix: use real config in interview evaluation and stt services
<hash> docs: design spec for 6 review-driven bug fixes
```

If any commit is missing or out of order, stop and check `git status` + `git log` to recover.

---

## Self-Review

**1. Spec coverage:**
- Bug 1 (config import) → Task 1 ✓
- Bug 2 (interview IDs) → Task 2 ✓
- Bug 3 (match score) → Task 3 ✓
- Bug 4 (gather masking) → Task 4 ✓
- Bug 5 (broad except + root logger) → Task 5 ✓
- Bug 6 (bare except) → Task 6 ✓
- 6 commits, one per bug ✓
- Smoke-test validation ✓

**2. Placeholder scan:**
- No "TBD" / "TODO" / "implement later" — every step has the actual edit and the actual command.
- No "similar to Task N" — every step repeats the full code.
- No "add appropriate error handling" — the only error handling changes are bug 4 (return_exceptions) and bug 5 (logger.exception), both shown as full code blocks.
- No "write tests for the above" — per user decision, no tests in this plan.

**3. Type consistency:**
- Helper `_safe_get_interview` defined in Task 2, used by name in 6 sites within the same task — consistent.
- `logger` defined as `logging.getLogger(__name__)` in both Task 5 files — consistent.
- `InvalidId` import added in Task 6, used in the same task — consistent.
- No renames that would break call sites.
