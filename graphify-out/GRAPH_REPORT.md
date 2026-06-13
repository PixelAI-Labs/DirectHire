# Graph Report - .  (2026-06-12)

## Corpus Check
- 203 files · ~52,959 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 997 nodes · 1663 edges · 88 communities (74 shown, 14 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 211 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Interview Pipeline|Interview Pipeline]]
- [[_COMMUNITY_Shared UI Primitives|Shared UI Primitives]]
- [[_COMMUNITY_Assessment Engine|Assessment Engine]]
- [[_COMMUNITY_File Upload|File Upload]]
- [[_COMMUNITY_Shared Hooks & Notifications UI|Shared Hooks & Notifications UI]]
- [[_COMMUNITY_Recruiter Job & Offer API|Recruiter Job & Offer API]]
- [[_COMMUNITY_Recruiter Auth Pages & Services|Recruiter Auth Pages & Services]]
- [[_COMMUNITY_Shared UI Primitives|Shared UI Primitives]]
- [[_COMMUNITY_Assessment Engine|Assessment Engine]]
- [[_COMMUNITY_API Client Services|API Client Services]]
- [[_COMMUNITY_Workspace package.json Files|Workspace package.json Files]]
- [[_COMMUNITY_Workspace package.json Files|Workspace package.json Files]]
- [[_COMMUNITY_Candidate Profile & Resume|Candidate Profile & Resume]]
- [[_COMMUNITY_Hiring Agent Orchestrator|Hiring Agent Orchestrator]]
- [[_COMMUNITY_Assessment Engine|Assessment Engine]]
- [[_COMMUNITY_Frontend Build Config|Frontend Build Config]]
- [[_COMMUNITY_Frontend Build Config|Frontend Build Config]]
- [[_COMMUNITY_Assessment Engine|Assessment Engine]]
- [[_COMMUNITY_Candidate Auth Pages|Candidate Auth Pages]]
- [[_COMMUNITY_Hiring Agent Orchestrator|Hiring Agent Orchestrator]]
- [[_COMMUNITY_Workspace package.json Files|Workspace package.json Files]]
- [[_COMMUNITY_Form & Modal Primitives|Form & Modal Primitives]]
- [[_COMMUNITY_Voice Recording Components|Voice Recording Components]]
- [[_COMMUNITY_Layout Components|Layout Components]]
- [[_COMMUNITY_Candidate Auth Pages|Candidate Auth Pages]]
- [[_COMMUNITY_Auth & Security|Auth & Security]]
- [[_COMMUNITY_Frontend Build Config|Frontend Build Config]]
- [[_COMMUNITY_Backend Test Suite|Backend Test Suite]]
- [[_COMMUNITY_Company Management|Company Management]]
- [[_COMMUNITY_Notifications Service|Notifications Service]]
- [[_COMMUNITY_Career Agent|Career Agent]]
- [[_COMMUNITY_Career Agent|Career Agent]]
- [[_COMMUNITY_Auth & Security|Auth & Security]]
- [[_COMMUNITY_Candidate Pages|Candidate Pages]]
- [[_COMMUNITY_Animation & Motion|Animation & Motion]]
- [[_COMMUNITY_Frontend Build Config|Frontend Build Config]]
- [[_COMMUNITY_Shared Hooks & Notifications UI|Shared Hooks & Notifications UI]]
- [[_COMMUNITY_Frontend Build Config|Frontend Build Config]]
- [[_COMMUNITY_Design System Theme|Design System Theme]]
- [[_COMMUNITY_Auth & Security|Auth & Security]]
- [[_COMMUNITY_Auth & Security|Auth & Security]]
- [[_COMMUNITY_Auth & Security|Auth & Security]]
- [[_COMMUNITY_Auth & Security|Auth & Security]]
- [[_COMMUNITY_Auth & Security|Auth & Security]]
- [[_COMMUNITY_Database Layer|Database Layer]]
- [[_COMMUNITY_Auth & Security|Auth & Security]]
- [[_COMMUNITY_Candidate Profile & Resume|Candidate Profile & Resume]]
- [[_COMMUNITY_Company Management|Company Management]]
- [[_COMMUNITY_Backend Test Suite|Backend Test Suite]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Hiring Agent Orchestrator|Hiring Agent Orchestrator]]
- [[_COMMUNITY_Hiring Agent Orchestrator|Hiring Agent Orchestrator]]
- [[_COMMUNITY_Hiring Agent Orchestrator|Hiring Agent Orchestrator]]
- [[_COMMUNITY_Hiring Agent Orchestrator|Hiring Agent Orchestrator]]
- [[_COMMUNITY_Agents Schemas & Events|Agents Schemas & Events]]
- [[_COMMUNITY_Landing Page Marketing|Landing Page Marketing]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]

## God Nodes (most connected - your core abstractions)
1. `NotificationService` - 26 edges
2. `useToast()` - 26 edges
3. `cn()` - 25 edges
4. `Button()` - 24 edges
5. `Card()` - 22 edges
6. `FastAPI` - 18 edges
7. `compilerOptions` - 18 edges
8. `compilerOptions` - 18 edges
9. `useReveal()` - 18 edges
10. `BackgroundTasks` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Candidate App Screenshot` --references--> `Candidate Dashboard`  [INFERRED]
  image.png → DRD.md
- `Recruiter App Screenshot` --references--> `Recruiter Dashboard`  [INFERRED]
  image copy.png → DRD.md
- `Phase 8 AI Mock Interview` --implements--> `Interview Intelligence Engine`  [INFERRED]
  plan.md → PRD.md
- `User` --uses--> `NotificationService`  [INFERRED]
  backend/apps/jobs/router.py → backend/apps/notifications/service.py
- `JobCreate` --uses--> `NotificationService`  [INFERRED]
  backend/apps/recruiter/router.py → backend/apps/notifications/service.py

## Import Cycles
- 1-file cycle: `backend/main.py -> backend/main.py`

## Hyperedges (group relationships)
- **Auth Flow** — plan_auth_register, plan_auth_login, plan_auth_me, plan_jwt_security, plan_axios_client [EXTRACTED 0.95]
- **Hiring Agent Engine Suite** — prd_job_intelligence_engine, prd_resume_intelligence_engine, prd_assessment_intelligence_engine, prd_interview_intelligence_engine, prd_candidate_ranking_engine, prd_offer_intelligence_engine [EXTRACTED 1.00]
- **Career Agent Engine Suite** — prd_strategic_aligner_agent, prd_proxy_liaison_agent, prd_contract_guardian_agent [EXTRACTED 1.00]

## Communities (88 total, 14 thin omitted)

### Community 0 - "Interview Pipeline"
Cohesion: 0.06
Nodes (48): UploadFile, User, Interview, _build_question_prompt(), _fallback_question(), InterviewAIService, Interview AI Service — Gemini-powered question generation., Escape triple backticks to prevent prompt injection. (+40 more)

### Community 1 - "Shared UI Primitives"
Cohesion: 0.09
Nodes (35): ButtonProps, CardProps, AIChatDemo(), initialMessages, Message, FinalCTA(), features, ForCandidates() (+27 more)

### Community 2 - "Assessment Engine"
Cohesion: 0.06
Nodes (41): Assessment, _assessment_to_out(), create_assessment(), evaluate_assessment(), _generate_questions(), get_assessment(), list_assessments(), list_assessments_for_job() (+33 more)

### Community 3 - "File Upload"
Cohesion: 0.06
Nodes (29): Avatar(), AvatarProps, Column, DataTable(), DataTableProps, Footer(), footerColumns, FooterProps (+21 more)

### Community 4 - "Shared Hooks & Notifications UI"
Cohesion: 0.07
Nodes (29): NotificationPanelProps, useApi(), UseApiOptions, AuthState, useAuth, FormValues, useForm(), UseFormProps (+21 more)

### Community 5 - "Recruiter Job & Offer API"
Cohesion: 0.09
Nodes (31): UploadFile, User, UploadFile, User, extract_resume_with_gemma(), Gemma 27B OCR and Resume Extraction Service, _fetch_jobs_for_items(), get_applications() (+23 more)

### Community 6 - "Recruiter Auth Pages & Services"
Cohesion: 0.07
Nodes (34): Candidate Vite App Entry, Candidate Dashboard, Recruiter Dashboard, Candidate App Screenshot, Recruiter App Screenshot, Agent Orchestrator, POST /api/auth/login, GET /api/auth/me (+26 more)

### Community 7 - "Shared UI Primitives"
Cohesion: 0.11
Nodes (21): Badge(), BadgeProps, Button(), Card(), Skeleton(), SkeletonProps, TextAreaProps, JobDetail (+13 more)

### Community 8 - "Assessment Engine"
Cohesion: 0.08
Nodes (22): Assessment, Settings, Auth Models — User, Role definitions, Settings, User, UserRole, Application, CandidateProfile (+14 more)

### Community 9 - "API Client Services"
Cohesion: 0.07
Nodes (28): dependencies, axios, clsx, framer-motion, lucide-react, react, react-dom, socket.io-client (+20 more)

### Community 10 - "Workspace package.json Files"
Cohesion: 0.07
Nodes (26): dependencies, axios, @directhire/shared, framer-motion, react, react-dom, react-router-dom, zustand (+18 more)

### Community 11 - "Workspace package.json Files"
Cohesion: 0.08
Nodes (25): dependencies, axios, @directhire/shared, framer-motion, react, react-dom, react-router-dom, zustand (+17 more)

### Community 12 - "Candidate Profile & Resume"
Cohesion: 0.11
Nodes (14): ToastProvider(), Agent(), Message, QUICK_ACTIONS, ApplicationItem, Applications(), STATUS_COLORS, NotFound() (+6 more)

### Community 13 - "Hiring Agent Orchestrator"
Cohesion: 0.10
Nodes (24): analyze_candidate(), draft_offer_endpoint(), _extract_match_score(), _get_candidate_resume_text(), match_candidate(), negotiate_offer(), rank_candidates(), Agent Orchestrator Router (+16 more)

### Community 14 - "Assessment Engine"
Cohesion: 0.14
Nodes (22): analyze_assessment_endpoint(), Call HiringAgent.analyze_assessment to evaluate test results., User, User, JobCreate, apply_to_job(), get_public_job(), list_public_jobs() (+14 more)

### Community 15 - "Frontend Build Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+14 more)

### Community 16 - "Frontend Build Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+14 more)

### Community 17 - "Assessment Engine"
Cohesion: 0.14
Nodes (18): AnalysisResult, AssessmentCreate, AssessmentEvaluate, AssessmentOut, AssessmentSubmit, BaseModel, CompanyCreate, CompanyOut (+10 more)

### Community 18 - "Candidate Auth Pages"
Cohesion: 0.21
Nodes (11): Login(), agentService, apiClient, setAuthToken(), authService, LoginCredentials, RegisterData, candidateService (+3 more)

### Community 19 - "Hiring Agent Orchestrator"
Cohesion: 0.47
Nodes (19): HiringAgent, AgentEvent, AnalyzeRequest, DraftOfferRequest, DraftOfferResponse, MatchRequest, NegotiateRequest, RankRequest (+11 more)

### Community 20 - "Workspace package.json Files"
Cohesion: 0.10
Nodes (19): description, devDependencies, eslint, prettier, engines, node, npm, name (+11 more)

### Community 21 - "Form & Modal Primitives"
Cohesion: 0.19
Nodes (11): NotificationPanel(), TextArea, useToast(), Layout(), Layout(), CandidateView(), Companies(), CompanyForm() (+3 more)

### Community 22 - "Voice Recording Components"
Cohesion: 0.15
Nodes (12): formatDuration(), VoiceRecorder(), VoiceRecorderProps, WaveformVisualizer(), WaveformVisualizerProps, useVoiceRecorder(), UseVoiceRecorderReturn, EvaluationData (+4 more)

### Community 23 - "Layout Components"
Cohesion: 0.15
Nodes (7): CenteredSection(), CenteredSectionProps, FluidContainer(), FluidContainerProps, sizeClasses, SplitScreen(), SplitScreenProps

### Community 24 - "Candidate Auth Pages"
Cohesion: 0.14
Nodes (11): Input, InputProps, Login(), PASSWORD_CRITERIA, Register(), STRENGTH_COLORS, STRENGTH_LABELS, PASSWORD_CRITERIA (+3 more)

### Community 25 - "Auth & Security"
Cohesion: 0.16
Nodes (13): get_me(), login(), Auth Router — Registration, Login, Token Management, register(), LoginPayload, Auth Pydantic Schemas, RegisterPayload, TokenResponse (+5 more)

### Community 26 - "Frontend Build Config"
Cohesion: 0.13
Nodes (14): compilerOptions, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+6 more)

### Community 27 - "Backend Test Suite"
Cohesion: 0.13
Nodes (14): async_client(), candidate_token(), clear_db(), db(), Return a valid auth header for the recruiter., Setup a test database and initialize Beanie., Clear all collections before each test., Provides an AsyncClient for testing FastAPI endpoints. (+6 more)

### Community 28 - "Company Management"
Cohesion: 0.27
Nodes (13): User, Company, _authorize_company_access(), _company_to_out(), create_company(), get_company(), list_companies(), To set a company logo, first upload the file via POST /api/upload with     file (+5 more)

### Community 29 - "Notifications Service"
Cohesion: 0.21
Nodes (11): User, list_notifications(), mark_all_read(), mark_read(), List current user's notifications, newest first., Mark a single notification as read., Mark all current user's notifications as read., Return count of unread notifications. (+3 more)

### Community 30 - "Career Agent"
Cohesion: 0.17
Nodes (6): CareerAgent, Analyzes a resume against industry standards and provides actionable feedback., Compares candidate skills vs. job requirements to identify gaps., Scores candidate-job fit from 0-100 based on resume and job description., Tailors resume/cover letter advice per job., Generates likely interview questions and tips.

### Community 31 - "Career Agent"
Cohesion: 0.18
Nodes (9): get_agent_llm(), Agent Core Configuration, Returns a configured instance of the Gemma LLM for agent usage., _parse_llm_json_response(), Parse scheduling prompt with LLM and log the suggestion., Generate negotiation advice and log it., Strip markdown fences and parse JSON from LLM response., _run_negotiate_task() (+1 more)

### Community 32 - "Auth & Security"
Cohesion: 0.18
Nodes (5): get_current_user(), Any, lifespan(), DirectHire API FastAPI application entry point, FastAPI

### Community 33 - "Candidate Pages"
Cohesion: 0.22
Nodes (8): ScoreRing(), ScoreRingProps, container, InterviewDetail(), InterviewDetailData, item, MOCK_INTERVIEW, getScoreColor()

### Community 34 - "Animation & Motion"
Cohesion: 0.22
Nodes (9): Design Tokens, Motion Philosophy, Performance Targets, Shared System + Auth + Landing Plan, Shared System + Auth + Landing Spec, Backend Structure, Frontend Structure, Future Service Extraction (+1 more)

### Community 35 - "Frontend Build Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 36 - "Shared Hooks & Notifications UI"
Cohesion: 0.25
Nodes (7): Toast(), toastConfig, ToastContext, ToastContextValue, ToastItem, ToastProps, ToastType

### Community 37 - "Frontend Build Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 38 - "Design System Theme"
Cohesion: 0.29
Nodes (6): colors, easing, radius, shadows, spacing, typography

### Community 39 - "Auth & Security"
Cohesion: 0.33
Nodes (4): create_access_token(), get_current_user(), timedelta, User

### Community 40 - "Auth & Security"
Cohesion: 0.33
Nodes (4): Settings, Settings, BaseSettings, Application configuration

### Community 41 - "Auth & Security"
Cohesion: 0.33
Nodes (3): Any, create_access_token(), timedelta

### Community 43 - "Auth & Security"
Cohesion: 0.53
Nodes (5): AsyncClient, test_get_current_user(), test_login_user(), test_register_duplicate_user(), test_register_user()

### Community 45 - "Auth & Security"
Cohesion: 0.50
Nodes (3): Any, OAuth2PasswordRequestForm, login_access_token()

### Community 46 - "Candidate Profile & Resume"
Cohesion: 0.67
Nodes (3): AsyncClient, test_create_candidate_profile(), test_get_candidate_profile()

### Community 47 - "Company Management"
Cohesion: 0.67
Nodes (3): AsyncClient, test_create_company(), test_create_job()

## Knowledge Gaps
- **301 isolated node(s):** `allow`, `Any`, `OAuth2PasswordRequestForm`, `Any`, `Any` (+296 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FastAPI` connect `Auth & Security` to `Interview Pipeline`, `Assessment Engine`, `Recruiter Job & Offer API`, `Auth & Security`, `Database Layer`, `Hiring Agent Orchestrator`, `Auth & Security`, `Assessment Engine`, `Analytics Dashboard`, `Auth & Security`, `Company Management`, `Notifications Service`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `NotificationService` connect `Assessment Engine` to `Interview Pipeline`, `Assessment Engine`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `AgentEvent` connect `Hiring Agent Orchestrator` to `Assessment Engine`, `Database Layer`, `Agents Schemas & Events`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `NotificationService` (e.g. with `Assessment` and `AssessmentCreate`) actually correct?**
  _`NotificationService` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `useToast()` (e.g. with `Layout()` and `Login()`) actually correct?**
  _`useToast()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `allow`, `Any`, `OAuth2PasswordRequestForm` to the rest of the system?**
  _399 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Interview Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.05928614640048397 - nodes in this community are weakly interconnected._