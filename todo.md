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
- [x] `[S]` Setup `apps/agents/` with OpenAI / Anthropic LangChain client.
- [x] `[S]` Create `AgentEvent` Pydantic model and `agent_events` collection.
- [x] `[C]` Define **Career Agent** capabilities:
  - [x] `[C]` Resume Review: analyze resume against industry standards.
  - [x] `[C]` Skill Gap Analysis: compare skills vs. job requirements.
  - [x] `[C]` Job Matching: score candidate-job fit (0-100).
  - [x] `[C]` Application Suggestions: tailor resume/cover letter per job.
  - [x] `[C]` Interview Preparation: generate likely questions and tips.
- [ ] `[R]` Define **Hiring Agent** capabilities:
  - [ ] `[R]` Resume Screening: parse and score resumes vs. job description.
  - [ ] `[R]` Candidate Ranking: sort applicants by match score.
  - [ ] `[R]` Assessment Analysis: evaluate test results, flag anomalies.
  - [ ] `[R]` Offer Drafting: generate offer letters with salary recommendations.
- [x] `[S]` Build **Agent Orchestrator** (The Bus):
  - [x] `[S]` `POST /api/agents/match` — triggers Career → Hiring Agent evaluation.
  - [x] `[S]` `POST /api/agents/schedule` — parses natural language to schedule interviews.
  - [x] `[S]` `POST /api/agents/negotiate` — salary/term negotiation support.
  - [x] `[S]` `POST /api/agents/analyze` — runs full pipeline on a candidate.
- [x] `[S]` Implement async scoring via FastAPI `BackgroundTasks`.

## Phase 8: Assessment & Interview Integration
- [ ] `[S]` Build `apps/assessment/` engine for dynamic test generation.
- [ ] `[S]` Build `apps/interview/` EchoHire integration.
- [ ] `[S]` Create `assessments` MongoDB collection.
- [ ] `[S]` Create `interviews` MongoDB collection.

## Phase 9: Notification System
- [ ] `[S]` Create `Notification` Pydantic model (user_id, type, title, message, read, created_at).
- [ ] `[S]` Create `notifications` MongoDB collection.
- [ ] `[S]` Build internal `POST /api/notifications` service (not public).
- [ ] `[S]` Build `GET /api/notifications` (list user's notifications).
- [ ] `[S]` Build `PUT /api/notifications/{id}/read` (mark as read).
- [ ] `[S]` Integrate notification triggers into existing flows:
  - [ ] `[S]` Application submitted → candidate + recruiter notified.
  - [ ] `[S]` Interview scheduled → both parties notified.
  - [ ] `[S]` Assessment assigned → candidate notified.
  - [ ] `[S]` Offer generated → candidate notified.
  - [ ] `[S]` Offer accepted → recruiter notified.
- [ ] `[S]` Setup SMTP email delivery for all notifications.
- [ ] `[S]` *(Future)*: Add WebSocket real-time delivery and Push notifications.

## Phase 10: File Storage Strategy (Local)
- [ ] `[S]` Build `POST /api/upload` endpoint (multipart upload, save to local path).
- [ ] `[S]` Serve uploaded files via `GET /uploads/{filename}` (static file serving).
- [ ] `[S]` Add file type validation (PDF, PNG, JPG only).
- [ ] `[S]` Add file size limits (max 5MB per file).
- [ ] `[C]` Update `Resume` model to store `file_path` pointing to `uploads/resumes/`.
- [ ] `[R]` Update `Company` model to store `logo_path` pointing to `uploads/logos/`.
- [ ] `[S]` *(Future)*: Migrate to Cloudinary / S3 / Supabase when scaling.

## Phase 11: Candidate Frontend
- [x] `[C]` Implement shared design tokens (DRD: colors, typography, motion).
- [x] `[C]` Build shared UI components in `frontend/shared/`.
- [x] `[C]` Setup Candidate app routing (`/`, `/login`, `/profile`, `/jobs`, `/jobs/:id`, `/applications`, `/offers`, `/agent`).
- [x] `[C]` Build Candidate Login / Register pages.
- [ ] `[C]` Build **Job Discovery** page: search, filter, browse jobs with company info.
- [ ] `[C]` Build **Job Detail** page: view requirements, click Apply.
- [ ] `[C]` Build **Profile** page: resume upload, skill gap analysis.
- [ ] `[C]` Build **Dashboard**: applications, match scores, timeline.
- [ ] `[C]` Build **Career Agent** chat interface.

## Phase 12: Recruiter Frontend
- [x] `[R]` Reuse shared design tokens and components.
- [ ] `[R]` Setup Recruiter app routing (`/`, `/login`, `/companies`, `/jobs`, `/jobs/:id`, `/candidates`).
- [x] `[R]` Build Recruiter Login / Register pages.
- [ ] `[R]` Build **Company Management**: create/edit company profile, upload logo.
- [x] `[R]` Build **Dashboard**: open roles, pipeline metrics, analytics.
- [ ] `[R]` Build **Create Job** form (linked to company).
- [ ] `[R]` Build **Job Details** page: AI-ranked applicant table.
- [ ] `[R]` Build **Candidate View**: AI summary, resume viewer.
- [ ] `[R]` Build **Notifications Panel**: view all job/candidate related alerts.

## Phase 13: Integration & Deployment
- [ ] `[C]` Wire Candidate app to backend APIs (jobs, applications, agent chat).
- [ ] `[R]` Wire Recruiter app to backend APIs (companies, jobs, candidates).
- [ ] `[S]` End-to-end test Agent Communication Layer.
- [ ] `[S]` Test notification triggers for all 5 events.
- [ ] `[S]` Verify local file uploads and static file serving.
- [ ] `[S]` Write pytest cases for Auth endpoints.
- [ ] `[S]` Write pytest cases for Candidate endpoints.
- [ ] `[S]` Write pytest cases for Recruiter endpoints.
- [ ] `[S]` Setup `Dockerfile` for FastAPI.
- [ ] `[S]` Deploy backend to Railway.
- [ ] `[S]` Deploy Candidate app to Vercel.
- [ ] `[S]` Deploy Recruiter app to Vercel.
