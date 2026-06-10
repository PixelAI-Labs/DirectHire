# DirectHire — Implementation Plan

## 1. Overview
DirectHire is an autonomous multi-agent recruitment ecosystem. AI Career Agents and Hiring Agents collaborate to automate the hiring pipeline — from application to offer — while keeping humans in control.

This plan maps the PRD, DRD, and System Architecture into concrete, sequential build phases. Work is explicitly partitioned into **Candidate**, **Recruiter**, and **Shared** tracks.

---

## 2. Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router, Zustand |
| Styling | Vanilla CSS with Design Tokens (DRD aligned) |
| Backend | FastAPI, Uvicorn, Motor (async MongoDB) |
| Database | MongoDB Atlas |
| AI / Agents | Hybrid: Gemma (Existing Agents), Gemini 3.1 Pro (Main Brain), Ollama STT/TTS via LangChain |
| File Storage | Local filesystem (`backend/uploads/`) |
| Notifications | In-app + Email (SMTP), later WebSocket + Push |
| Deployment | Vercel (Frontend), Railway (Backend) |

---

## 3. Architecture Layout
```
directhire/
├── frontend/
│   ├── apps/
│   │   ├── candidate/            # Candidate SPA
│   │   └── recruiter/            # Recruiter SPA
│   └── shared/                   # Components, hooks, theme, API client
├── backend/
│   ├── apps/
│   │   ├── auth/
│   │   ├── candidate/            # Candidate domain
│   │   ├── recruiter/            # Recruiter domain
│   │   ├── company/              # Company domain
│   │   ├── jobs/                 # Public job discovery
│   │   ├── agents/               # AI orchestration
│   │   ├── assessment/
│   │   ├── interview/
│   │   ├── notifications/        # Notification service
│   │   └── analytics/
│   ├── core/                     # DB, config, security
│   └── uploads/                  # Local file storage
└── docs/
```

---

## 4. Build Phases

### Phase 1: Environment & Scaffolding
**Goal**: Monorepo structure, tooling, and shared infra are ready for parallel Candidate/Recruiter development.

**Shared**
- [ ] Initialize Git repo; setup branch strategy (`main`, `develop`, `candidate-dev`, `recruiter-dev`).
- [ ] Create `frontend/` monorepo with npm workspaces.
- [ ] Scaffold `frontend/apps/candidate` and `frontend/apps/recruiter` (Vite + React).
- [ ] Create `frontend/shared/` package (components, hooks, theme, api client).
- [ ] Create `backend/` directory; setup Python venv and `requirements.txt`.
- [ ] Scaffold FastAPI app with `main.py`, `core/config.py`, and `core/database.py` (Motor).
- [ ] Create `backend/uploads/` directory for local file storage (resumes, logos).

### Phase 2: Auth & Core Infrastructure
**Goal**: Secure access and shared data models are in place.

**Shared**
- [ ] Implement JWT token generation (`core/security.py`).
- [ ] Build `/api/auth/register` and `/api/auth/login` endpoints.
- [ ] Create shared Pydantic models: `User`, `BaseDocument`.
- [ ] Create `users` MongoDB collection.
- [ ] Setup CORS middleware in FastAPI.
- [ ] Build shared Axios client with JWT interceptor.
- [ ] Build `useAuth` Zustand store in `frontend/shared/`.

---

### Phase 3: Company Domain
**Goal**: Recruiters belong to companies; jobs belong to companies.

**Recruiter**
- [ ] Create `Company` Pydantic model:
  - `name`, `logo_url`, `description`, `website`, `recruiters[]`
- [ ] Create `companies` MongoDB collection.
- [ ] Build `POST /api/companies` (create company).
- [ ] Build `GET /api/companies` (list recruiter's companies).
- [ ] Build `GET /api/companies/{id}` (company details).
- [ ] Build `PUT /api/companies/{id}` (update company).
- [ ] Update `User` model to track `company_id` for recruiters.

### Phase 4: Recruiter Domain (Backend)
**Goal**: Full backend for the Recruiter experience.

**Recruiter**
- [ ] Create `Job` Pydantic model with `company_id` field.
- [ ] Create `Ranking` Pydantic model.
- [ ] Create `Offer` Pydantic model.
- [ ] Build `POST /api/recruiter/jobs` router.
- [ ] Build `GET /api/recruiter/jobs` router.
- [ ] Build `GET /api/recruiter/jobs/{id}/candidates` router (ranked).
- [ ] Build `GET /api/recruiter/rankings` router.
- [ ] Build `POST /api/recruiter/offers` router.
- [ ] Implement candidate ranking formula (Resume 25%, Assessment 30%, etc.).

### Phase 5: Job Discovery System (Public)
**Goal**: Candidates can browse, search, and apply to jobs.

**Candidate**
- [ ] Create public `GET /api/jobs` endpoint (search, filter, pagination).
- [ ] Create public `GET /api/jobs/{id}` endpoint (job details with company info).
- [ ] Build `POST /api/jobs/{id}/apply` endpoint (creates Application).
- [ ] Implement job search filters: location, salary range, skills, role type.
- [ ] Add job embedding for semantic search.

---

### Phase 6: Candidate Domain (Backend)
**Goal**: Full backend for the Candidate experience.

**Candidate**
- [ ] Create Pydantic models: `CandidateProfile`, `Resume`, `Application`.
- [ ] Build `GET /api/candidate/profile` router.
- [ ] Build `PUT /api/candidate/profile` router.
- [ ] Build `POST /api/candidate/resume` (upload to local `uploads/` + parse).
- [ ] Integrate resume text extraction (PDF/OCR parser).
- [ ] Build `GET /api/candidate/applications` router.
- [ ] Build `GET /api/candidate/offers` router.

---

### Phase 7: Agent Orchestration (Explicit Capabilities)
**Goal**: AI agents have concrete, implementable capabilities.

**Shared**
- [ ] Setup `apps/agents/` with Gemini 3.1 Pro client (Main Brain) alongside existing Gemma configuration, plus Ollama (STT/TTS).
- [ ] Create `AgentEvent` model and `agent_events` collection.
- [ ] Build **Career Agent** with explicit capabilities:
  - **Resume Review**: Analyze resume against industry standards.
  - **Skill Gap Analysis**: Compare skills vs. job requirements.
  - **Job Matching**: Score candidate-job fit (0-100).
  - **Application Suggestions**: Tailor resume/cover letter per job.
  - **Interview Preparation**: Generate likely questions and tips.
- [ ] Build **Hiring Agent** with explicit capabilities:
  - **Resume Screening**: Parse and score resumes against job description.
  - **Candidate Ranking**: Sort applicants by match score.
  - **Assessment Analysis**: Evaluate test results, flag anomalies.
  - **Offer Drafting**: Generate offer letters with salary recommendations.
- [ ] Build **Agent Orchestrator** (The Bus):
  - `POST /api/agents/match` — triggers Career → Hiring Agent evaluation.
  - `POST /api/agents/schedule` — parses natural language to schedule interviews.
  - `POST /api/agents/negotiate` — salary/term negotiation support.
  - `POST /api/agents/analyze` — runs full pipeline on a candidate.
- [ ] Implement async scoring via FastAPI `BackgroundTasks`.

### Phase 8: Assessment & Interview Integration
**Goal**: Dynamic assessments and EchoHire interview integration are wired into the pipeline.

**Shared**
- [ ] Build `apps/assessment/` engine for dynamic test generation.
- [ ] Build `apps/interview/` integration with EchoHire.
- [ ] Store assessment and interview results in MongoDB.

---

### Phase 9: Notification System
**Goal**: Users get notified of critical events via email; later WebSocket + Push.

**Shared**
- [ ] Create `Notification` model:
  - `user_id`, `type`, `title`, `message`, `read`, `created_at`
- [ ] Create `notifications` MongoDB collection.
- [ ] Build `POST /api/notifications` (internal service, not public).
- [ ] Build `GET /api/notifications` (list user's notifications).
- [ ] Build `PUT /api/notifications/{id}/read` (mark as read).
- [ ] Integrate notification triggers into existing flows:
  - Application submitted → candidate + recruiter notified.
  - Interview scheduled → both parties notified.
  - Assessment assigned → candidate notified.
  - Offer generated → candidate notified.
  - Offer accepted → recruiter notified.
- [ ] Setup SMTP email delivery for all notifications.
- [ ] *(Future)*: Add WebSocket real-time delivery and Push notifications.

---

### Phase 10: File Storage Strategy (Local)
**Goal**: Handle resumes, logos, and other uploads via local filesystem.

**Shared**
- [ ] Create `backend/uploads/` directory structure:
  - `uploads/resumes/` — candidate resumes
  - `uploads/logos/` — company logos
  - `uploads/avatars/` — user profile pictures
- [ ] Build `POST /api/upload` endpoint (multipart upload, save to local path).
- [ ] Serve uploaded files via `GET /uploads/{filename}` (static file serving).
- [ ] Add file type validation (PDF, PNG, JPG only).
- [ ] Add file size limits (max 5MB per file).
- [ ] Update `Resume` model to store `file_path` pointing to local file.
- [ ] Update `Company` model to store `logo_path` pointing to local file.
- [ ] *(Future)*: Migrate to Cloudinary / S3 / Supabase when scaling.

---

### Phase 11: Candidate Frontend
**Goal**: Candidate-facing React app is functional and premium.

**Candidate**
- [ ] Implement shared design tokens (colors, typography, spacing) in `frontend/shared/theme`.
- [ ] Build shared components: `Button`, `Card`, `Modal`, `DataTable`, `MarkdownRenderer`.
- [ ] Candidate routes: `/`, `/login`, `/profile`, `/jobs`, `/jobs/:id`, `/applications`, `/offers`, `/agent`.
- [ ] Build Login / Register pages.
- [ ] Build **Job Discovery** page: search, filter, browse jobs with company info.
- [ ] Build **Job Detail** page: view requirements, click Apply.
- [ ] Build **Profile** page: resume upload, skill gap visualization.
- [ ] Build **Dashboard**: active applications, match scores, timeline.
- [ ] Build **Career Agent Chat**: real-time chat with AI.

### Phase 12: Recruiter Frontend
**Goal**: Recruiter-facing React app is functional and premium.

**Recruiter**
- [ ] Reuse shared design tokens and components.
- [ ] Recruiter routes: `/`, `/login`, `/companies`, `/jobs`, `/jobs/:id`, `/candidates`.
- [ ] Build Login / Register pages.
- [ ] Build **Company Management**: create/edit company profile, upload logo.
- [ ] Build **Dashboard**: open roles, pipeline metrics, analytics counters.
- [ ] Build **Create Job** form (linked to company).
- [ ] Build **Job Details** page: AI-ranked applicant table.
- [ ] Build **Candidate View**: AI summary, resume viewer.
- [ ] Build **Notifications Panel**: view all job/candidate related alerts.

---

### Phase 13: Integration & Deployment
**Goal**: End-to-end flow works and is live.

**Shared**
- [ ] Wire Candidate app → Backend APIs (jobs, applications, agent chat).
- [ ] Wire Recruiter app → Backend APIs (companies, jobs, candidates).
- [ ] End-to-end testing of Agent Communication Layer.
- [ ] Test notification triggers for all 5 events.
- [ ] Verify local file uploads and static file serving.
- [ ] Write pytest cases for Auth, Candidate, and Recruiter endpoints.
- [ ] Setup `Dockerfile` for FastAPI.
- [ ] Deploy backend to Railway.
- [ ] Deploy frontend apps to Vercel (separate projects).

---

## 5. Data Flow

```
Candidate App
     │
     ├──► Career Agent (Resume Review, Job Matching, Interview Prep)
     │         │
     ├──► Job Discovery → Browse / Search / Apply
     │         │
     └──► Notifications (Application, Interview, Offer)

Agent Bus
     │
     ├──► Career Agent ↔ Hiring Agent (Match, Schedule, Negotiate)
     │
Recruiter App
     │
     ├──► Company Management
     │         │
     ├──► Hiring Agent (Resume Screening, Ranking, Offer Drafting)
     │         │
     └──► Notifications (New Applicant, Interview Response)
```

---

## 6. Success Criteria
- [ ] Candidates can browse/search jobs, apply, and chat with Career Agent.
- [ ] Recruiters can manage companies, post jobs, and review AI-ranked candidates.
- [ ] Agent communication layer handles match scoring, scheduling, and negotiation.
- [ ] Notifications fire on all critical events (Application, Interview, Assessment, Offer).
- [ ] Resumes and logos are uploaded/served via local storage.
- [ ] Lighthouse score > 95, 60 FPS on UI animations.
