# DirectHire — Implementation Checklist

**Legend:**
- `C` = Candidate
- `R` = Recruiter
- `S` = Shared (Both / Infrastructure)

---

## Phase 1: Environment & Scaffolding
- [x] `[S]` Initialize Git repo with branch strategy (`main`, `develop`, `candidate-dev`, `recruiter-dev`).
- [x] `[S]` Create `frontend/` monorepo with npm workspaces.
- [x] `[S]` Scaffold `frontend/apps/candidate` (Vite + React).
- [x] `[S]` Scaffold `frontend/apps/recruiter` (Vite + React).
- [x] `[S]` Create `frontend/shared/` package (components, hooks, theme, api).
- [x] `[S]` Create `backend/` directory; setup Python venv.
- [x] `[S]` Create `backend/requirements.txt` (FastAPI, Uvicorn, Motor, Pydantic, etc.).
- [x] `[S]` Scaffold FastAPI app structure (`main.py`, `core/config.py`, `core/database.py`).
- [x] `[S]` Create `backend/uploads/` directory for local file storage.
- [x] `[S]` Create subdirectories: `uploads/resumes/`, `uploads/logos/`, `uploads/avatars/`.

## Phase 2: Auth & Core Infrastructure
- [x] `[S]` Implement JWT token generation in `core/security.py`.
- [x] `[S]` Build `POST /api/auth/register` endpoint.
- [x] `[S]` Build `POST /api/auth/login` endpoint (OAuth2PasswordRequestForm).
- [x] `[S]` Create `User` Pydantic model with role enum (`CANDIDATE`, `RECRUITER`, `ADMIN`).
- [x] `[S]` Create `users` MongoDB collection.
- [x] `[S]` Setup CORS middleware in FastAPI.
- [x] `[S]` Create shared Axios client with JWT interceptor.
- [x] `[S]` Create `useAuth` Zustand store in `frontend/shared/`.

## Phase 3: Company Domain
- [x] `[R]` Create `Company` Pydantic model (name, logo_url, description, website, recruiters[]).
- [x] `[R]` Create `companies` MongoDB collection.
- [x] `[R]` Build `POST /api/companies` endpoint (create company).
- [x] `[R]` Build `GET /api/companies` endpoint (list recruiter's companies).
- [x] `[R]` Build `GET /api/companies/{id}` endpoint (company details).
- [x] `[R]` Build `PUT /api/companies/{id}` endpoint (update company).
- [x] `[R]` Update `User` model to store `company_id` for recruiters.

## Phase 4: Recruiter Domain (Backend)
- [x] `[R]` Create `Job` Pydantic model with `company_id` field.
- [x] `[R]` Create `Ranking` Pydantic model.
- [x] `[R]` Create `Offer` Pydantic model.
- [x] `[R]` Build `POST /api/recruiter/jobs` router.
- [x] `[R]` Build `GET /api/recruiter/jobs` router.
- [x] `[R]` Build `GET /api/recruiter/jobs/{id}/candidates` router (ranked).
- [x] `[R]` Build `GET /api/recruiter/rankings` router.
- [x] `[R]` Build `POST /api/recruiter/offers` router.
- [x] `[R]` Implement candidate ranking formula (Resume 25%, Assessment 30%, etc.).
- [x] `[R]` Build `PUT /api/recruiter/offers/{id}/status` router (accept/reject offer).

## Phase 5: Job Discovery System (Public)
- [x] `[C]` Create public `GET /api/jobs` endpoint (search, filter, pagination).
- [x] `[C]` Create public `GET /api/jobs/{id}` endpoint (job details with company info).
- [x] `[C]` Build `POST /api/jobs/{id}/apply` endpoint (creates Application).
- [x] `[C]` Implement job search filters: location, salary range, skills, role type.
- [x] `[C]` Add job embedding for semantic search.

## Phase 6: Candidate Domain (Backend)
- [x] `[C]` Create `CandidateProfile` Pydantic model.
- [x] `[C]` Create `Resume` Pydantic model (with `file_path` for local storage).
- [x] `[C]` Create `Application` Pydantic model.
- [x] `[C]` Build `GET /api/candidate/profile` router.
- [x] `[C]` Build `PUT /api/candidate/profile` router.
- [x] `[C]` Build `POST /api/candidate/resume` (UploadFile + save to `uploads/resumes/` + parse).
- [x] `[C]` Integrate resume PDF/OCR extraction logic.
- [x] `[C]` Build `GET /api/candidate/applications` router.
- [x] `[C]` Build `GET /api/candidate/offers` router.

## Phase 7: Agent Orchestration (Explicit Capabilities)
- [x] `[S]` Setup `apps/agents/` with Gemini 3.1 Pro client (Main Brain) alongside existing Gemma configuration, plus Ollama (STT/TTS).
- [x] `[S]` Create `AgentEvent` Pydantic model and `agent_events` collection.
- [x] `[C]` Define **Career Agent** capabilities:
  - [x] `[C]` Resume Review: analyze resume against industry standards.
  - [x] `[C]` Skill Gap Analysis: compare skills vs. job requirements.
  - [x] `[C]` Job Matching: score candidate-job fit (0-100).
  - [x] `[C]` Application Suggestions: tailor resume/cover letter per job.
  - [x] `[C]` Interview Preparation: generate likely questions and tips.
- [x] `[R]` Define **Hiring Agent** capabilities:
  - [x] `[R]` Resume Screening: parse and score resumes vs. job description.
  - [x] `[R]` Candidate Ranking: sort applicants by match score (batch + persist to DB).
  - [x] `[R]` Assessment Analysis: evaluate test results, flag anomalies.
  - [x] `[R]` Offer Drafting: generate offer letters with salary recommendations.
- [x] `[S]` Build **Agent Orchestrator** (The Bus):
  - [x] `[S]` `POST /api/agents/match` — CareerAgent + HiringAgent combined scoring, persists to Application.match_score + Ranking.
  - [x] `[S]` `POST /api/agents/analyze` — full pipeline (resume review + skill gap + screening).
  - [x] `[S]` `POST /api/agents/schedule` — LLM parses NL to structured interview suggestion.
  - [x] `[S]` `POST /api/agents/negotiate` — salary/term negotiation advice.
  - [x] `[S]` `POST /api/agents/screen` — direct HiringAgent.screen_resume.
  - [x] `[S]` `POST /api/agents/rank` — batch rank + persist all applicants for a job.
  - [x] `[S]` `POST /api/agents/assess` — evaluate assessment results, update Ranking.
  - [x] `[S]` `POST /api/agents/draft-offer` — generate offer letter + salary recommendation.
- [x] `[S]` Implement async scoring via FastAPI `BackgroundTasks`.

## Phase 8: Assessment & Interview Integration
- [x] `[S]` Build `apps/assessment/` engine for dynamic test generation (LLM generates questions from job description).
- [x] `[S]` Build `apps/interview/` module (scheduling, scoring, notes).
- [x] `[S]` Create `assessments` MongoDB collection.
- [x] `[S]` Create `interviews` MongoDB collection.
- [ ] `[S]` Integrate Hugging Face Whisper Large v3 (STT) for interview audio transcription.
- [ ] `[S]` Implement Gemini 3.5 Flash interactive interview agent (Brain) & TTS responses.
- [ ] `[C]` Build candidate Mock Interview Page with voice recording and premium dark-theme waveform.
- [ ] `[R]` Integrate mock interview evaluations, scoring summaries, and transcripts inside recruiter panel.


## Phase 9: Notification System
- [x] `[S]` Create `Notification` Pydantic model (user_id, type, title, message, read, created_at).
- [x] `[S]` Create `notifications` MongoDB collection.
- [x] `[S]` Build internal `NotificationService` (create, email via aiosmtplib).
- [x] `[S]` Build `GET /api/notifications` (list user's notifications).
- [x] `[S]` Build `PUT /api/notifications/{id}/read` (mark as read).
- [x] `[S]` Build `POST /api/notifications/mark-all-read`.
- [x] `[S]` Build `GET /api/notifications/unread-count`.
- [x] `[S]` Integrate notification triggers into existing flows:
  - [x] `[S]` Application submitted → candidate + recruiter notified.
  - [ ] `[S]` Interview scheduled → both parties notified.
  - [ ] `[S]` Assessment assigned → candidate notified.
  - [x] `[S]` Offer generated → candidate notified.
  - [x] `[S]` Offer accepted/rejected → recruiter notified.
- [x] `[S]` Setup SMTP email delivery for all notifications (gracefully skips if SMTP not configured).
- [ ] `[S]` *(Future)*: Add WebSocket real-time delivery and Push notifications.
- [ ] `[R]` Build **Notifications Panel** in recruiter frontend.
- [ ] `[C]` Build **Notifications Panel** in candidate frontend.

## Phase 10: File Storage Strategy (Local)
- [x] `[S]` Build `POST /api/upload` endpoint (multipart upload, save to local path).
- [x] `[S]` Serve uploaded files via `GET /uploads/{file_type}/{filename}` (static file serving).
- [x] `[S]` Add file type validation (PDF, PNG, JPG only).
- [x] `[S]` Add file size limits (max 5MB per file).
- [x] `[C]` Update `Resume` model to store `file_path` pointing to `uploads/resumes/`.
- [x] `[R]` Update `Company` model to store `logo_path` pointing to `uploads/logos/` (via generic upload endpoint).
- [ ] `[S]` *(Future)*: Migrate to Cloudinary / S3 / Supabase when scaling.

## Phase 11: Candidate Frontend
- [x] `[C]` Implement shared design tokens (DRD: colors, typography, motion).
- [x] `[C]` Build shared UI components in `frontend/shared/`.
- [x] `[C]` Setup Candidate app routing (`/`, `/login`, `/profile`, `/jobs`, `/jobs/:id`, `/applications`, `/offers`, `/agent`).
- [x] `[C]` Build Candidate Login / Register pages.
- [x] `[C]` Build **Job Discovery** page: search, filter, browse jobs with company info.
- [x] `[C]` Build **Job Detail** page: view requirements, click Apply.
- [x] `[C]` Build **Profile** page: resume upload, skills management.
- [x] `[C]` Build **Applications** page: real applications, match scores, statuses.
- [x] `[C]` Build **Offers** page: real offers, Accept/Reject actions.
- [x] `[C]` Build **Career Agent** chat interface.
- [x] `[C]` Wire all pages to backend APIs.
- [x] `[C]` Add route protection (`ProtectedRoute`) + auth-aware layout.

## Phase 12: Recruiter Frontend
- [x] `[R]` Reuse shared design tokens and components.
- [x] `[R]` Setup Recruiter app routing (`/`, `/login`, `/companies`, `/companies/create`, `/companies/:id/edit`, `/jobs`, `/jobs/create`, `/jobs/:id`, `/candidates/:id`).
- [x] `[R]` Build Recruiter Login / Register pages.
- [x] `[R]` Build **Company Management**: create/edit company profile.
- [x] `[R]` Build **Dashboard**: real open roles, pipeline metrics, analytics.
- [x] `[R]` Build **Create Job** form (linked to company).
- [x] `[R]` Build **Job Details** page: AI-ranked applicant table, send offers.
- [x] `[R]` Build **Candidate View**: profile + match scores.
- [ ] `[R]` Build **Notifications Panel**: view all job/candidate related alerts.
- [x] `[R]` Wire all pages to backend APIs.
- [x] `[R]` Add route protection (`ProtectedRoute` with role checks) + auth-aware layout.

## Phase 13: Integration & Deployment
- [x] `[C]` Wire Candidate app to backend APIs (jobs, applications, agent chat).
- [x] `[R]` Wire Recruiter app to backend APIs (companies, jobs, candidates).
- [x] `[S]` End-to-end Agent Communication Layer implemented (CareerAgent ↔ HiringAgent via Orchestrator).
- [x] `[S]` Notification triggers wired for application + offer events.
- [x] `[S]` Verify local file uploads and static file serving.
- [ ] `[S]` Write pytest cases for Auth endpoints.
- [ ] `[S]` Write pytest cases for Candidate endpoints.
- [ ] `[S]` Write pytest cases for Recruiter endpoints.
- [ ] `[S]` Write pytest cases for Agent endpoints.
- [ ] `[S]` Write pytest cases for Notification endpoints.
- [ ] `[S]` Setup `Dockerfile` for FastAPI.
- [ ] `[S]` Deploy backend to Railway.
- [ ] `[S]` Deploy Candidate app to Vercel.
- [ ] `[S]` Deploy Recruiter app to Vercel.

---

**Frontend Compile Status:** ✅ Candidate: 0 TS errors | ✅ Recruiter: 0 TS errors
**Backend Compile Status:** ✅ All new/modified Python files pass `py_compile`
**Last Updated:** 2026-06-10
