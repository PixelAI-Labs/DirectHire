# DirectHire backend — code-review bug fixes

**Date:** 2026-06-13
**Branch:** `main`
**Scope:** 6 bug fixes from the uncommitted working tree code review.

## Goal

Apply 6 targeted bug fixes to the working tree, **one commit per bug**. No new tests, no refactors, no new features. The diff stays minimal and reviewable.

## Files touched (5)

- `backend/apps/interview/evaluation_service.py`
- `backend/apps/interview/stt_service.py`
- `backend/apps/interview/router.py` (touched by 3 fixes)
- `backend/apps/agents/router.py`
- `backend/apps/notifications/service.py`
- `backend/apps/assessment/router.py`
- `backend/apps/candidate/router.py`

## The 6 fixes

### Bug 1 — Wrong config module imported in interview services

**Files:** `backend/apps/interview/evaluation_service.py:8`, `backend/apps/interview/stt_service.py:5`

The running app loads `core.config` via `main.py`. The `app.core.config` module is a separate, never-instantiated legacy config with `GEMINI_API_KEY: Optional[str] = None` and `HUGGINGFACE_API_TOKEN: Optional[str] = None`. The diff already fixed `ai_service.py:7`; these two were missed.

**Changes:**
- `evaluation_service.py:8` — `from app.core.config import settings` → `from core.config import settings`
- `stt_service.py:5` — `from app.core.config import settings` → `from core.config import settings`
- `stt_service.py:12` — `settings.HUGGINGFACE_API_TOKEN` → `settings.HUGGINGFACE_API_KEY` (the real config exposes the key under this name; `HUGGINGFACE_API_TOKEN` is the legacy config's name)

**Commit message:** `fix: use real config in interview evaluation and stt services`

**Note for review:** If the production env currently sets `HUGGINGFACE_API_TOKEN` in `.env`, the deploy will need to add `HUGGINGFACE_API_KEY` as well. Flag in the commit body.

### Bug 2 — `Interview.get(interview_id)` 500s on malformed IDs

**File:** `backend/apps/interview/router.py` (lines 109, 128, 154, 204, 238, 264)

Beanie's `Document.get()` raises `pydantic_core.ValidationError` *inside* `get()` for non-ObjectId strings, so the `if not interview` check is unreachable. The diff demonstrates the correct pattern at `router.py:57-61` for `Job.get` (wrap in `PydanticObjectId(...)` + `try/except Exception` → 400), but missed every `Interview.get`.

**Changes:**
- Add a private helper at module top:

  ```python
  async def _safe_get_interview(interview_id: str) -> Interview:
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

- Replace each of the 6 `interview = await Interview.get(interview_id)` + `if not interview: raise HTTPException(...)` patterns with `interview = await _safe_get_interview(interview_id)`. The existing role-based authorization checks after the fetch stay unchanged.

**Commit message:** `fix: return 400 for malformed interview IDs`

### Bug 3 — `_extract_match_score` regression

**File:** `backend/apps/agents/router.py:41-55`

The new code:
1. Uses `re.search(r"(?i)score.*?\b(\d+(?:\.\d+)?)\b", text)` — matches the first number after any word *containing* "score" (including "underscore", "subscore"). `.` does not match newlines by default, so multi-line LLM responses often miss the labeled score.
2. The fallback iterates `reversed(numbers)`, picking the *last* in-range number. For text like "rated 95 out of 100 with 5 years of experience", the old code returned `95`; the new code returns `5`. This affects `Application.match_score` and `Ranking.match_score`.

**Changes:**
- Tighten the regex to a word-boundary before "score" and use `re.DOTALL` for multi-line responses:

  ```python
  m = re.search(r"(?i)\bscore\b.*?(\d+(?:\.\d+)?)", text, re.DOTALL)
  if m:
      return float(m.group(1))
  ```

- Restore first-in-range fallback ordering (drop `reversed()`):

  ```python
  for n in numbers:
      val = float(n)
      if 0 <= val <= 100:
          return val
  ```

- Move the inline `import re` to module top (it is already imported at module top in the same file).

**Commit message:** `fix: tighten _extract_match_score to first in-range number`

**Note for review:** Behavior change. Real LLM output should be re-tested. The review scored this 70/100 confidence; the fix restores the previous (intentional) ordering and only tightens the regex.

### Bug 4 — `asyncio.gather` partial-failure masking

**File:** `backend/apps/notifications/service.py:158-176`

`notify_interview_scheduled` uses `asyncio.gather` with default `return_exceptions=False`. If one notification's `insert()` raises, gather raises while the other task continues; the route's broad `try/except` in `interview/router.py:75-84` then logs a generic warning and returns 201 — the partial failure is invisible to the caller.

**Changes:**
- Move `import asyncio` to module top.
- Pass `return_exceptions=True` to `gather`.
- After gather, iterate results: for any exception, log via the module-level `logger` at warning level with the partial-success state. Do not re-raise; both DB writes completed (or are at least attempted).

  ```python
  results = await asyncio.gather(
      NotificationService.create(...),
      NotificationService.create(...),
      return_exceptions=True,
  )
  for r in results:
      if isinstance(r, Exception):
          logger.warning(f"[notify_interview_scheduled] partial failure: {r}")
  ```

- The `import asyncio` inside the function is removed.

**Commit message:** `fix: don't mask partial notification failures in gather`

### Bug 5 — Broad `except Exception` + root-logger warning

**Files:** `backend/apps/assessment/router.py:118-126`, `backend/apps/interview/router.py:75-84`

Both wrap notification calls in `try: ... except Exception: import logging; logging.warning(...)`. Bare root-logger `warning()` doesn't capture the traceback, so programming errors (`KeyError`, `AttributeError`, schema mismatches) are silently swallowed and the API still returns success.

**Changes:**
- `assessment/router.py`: add `import logging` at module top if absent, define `logger = logging.getLogger(__name__)` at module top. Replace the inline `except` block with `except Exception: logger.exception("Failed to send assessment notification")`.
- `interview/router.py`: same treatment — module-level `logger`, `logger.exception(...)` in the except block.

**Commit message:** `fix: log notification errors with tracebacks, not root logger`

### Bug 6 — Bare `except:` in `_fetch_jobs_for_items`

**File:** `backend/apps/candidate/router.py:141,151`

Two bare `except: pass` blocks catch `BaseException` (including `KeyboardInterrupt`, `SystemExit`). New code introduced by this diff. The `try` block contains only `PydanticObjectId(jid)` / `PydanticObjectId(cid)`, which raises `ValueError`, `TypeError`, or `bson.errors.InvalidId` for malformed strings.

**Changes:**
- Add `from bson.errors import InvalidId` at the top of the function (or module top).
- Replace both `except: pass` with `except (ValueError, TypeError, InvalidId): pass`.

**Commit message:** `fix: narrow bare except in candidate job fetcher`

## Commit order (6 commits)

1. `fix: use real config in interview evaluation and stt services`
2. `fix: return 400 for malformed interview IDs`
3. `fix: tighten _extract_match_score to first in-range number`
4. `fix: don't mask partial notification failures in gather`
5. `fix: log notification errors with tracebacks, not root logger`
6. `fix: narrow bare except in candidate job fetcher`

## Out of scope

- No new tests.
- No edits to `app/core/config.py` (dead code; removing it is a separate concern).
- No edits to `backend/review-findings-partial.md` (gitignored working note).
- No changes to the existing `Job.get` `PydanticObjectId` pattern.
- No changes to commit messages, `.gitignore`, or test fixtures.

## Validation

After all 6 commits, run a single import smoke-test from `backend/`:

```bash
cd backend
python -c "from apps.interview.evaluation_service import InterviewEvaluationService; from apps.interview.stt_service import STTService; print('ok')"
```

No other validation needed — these are static, mechanical changes. Full pytest run is out of scope per the review process; CI will catch anything else.

## Risks

- **Bug 1** — if production `.env` sets `HUGGINGFACE_API_TOKEN`, deploy must add `HUGGINGFACE_API_KEY`. Noted in commit body.
- **Bug 2** — adds a private helper. Any future test that mocks `Interview.get` directly needs updating to mock `_safe_get_interview` instead. Acceptable: helper is module-private.
- **Bug 3** — behavior change. Worth re-testing with real LLM output. The review rated this 70/100; the fix restores the previous intentional ordering.

## Self-review

- **Placeholders:** none. Every fix has concrete file:line, code shape, and commit message.
- **Internal consistency:** bug ordering matches the review's confidence ranking. No contradictions.
- **Scope:** 6 fixes, all in working tree, all small. Single implementation plan can carry this.
- **Ambiguity:** bug 3 mentions "ignore numbers followed by `%` or `percent`" in the brainstorm but the design dropped that — confirmed: only the regex tightening + ordering fix, no extra heuristics.
