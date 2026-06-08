# DirectHire
# System Architecture

Version: 1.0

---

# Architecture Decision

## Chosen Architecture

Modular Monolith

Reason:

- Fast development
- Easy deployment
- Minimal DevOps
- Fewer integration issues
- Suitable for hackathons

---

# High Level Architecture

DirectHire

├── Frontend

├── Backend

└── MongoDB

---

# Frontend Structure

frontend/

├── apps/

│ ├── candidate/

│ └── recruiter/

│

├── shared/

│ ├── components/

│ ├── hooks/

│ ├── services/

│ └── theme/

---

## Candidate Developer

Works only in:

apps/candidate/

---

## Recruiter Developer

Works only in:

apps/recruiter/

---

# Backend Structure

backend/

├── apps/

│ ├── auth/

│ ├── candidate/

│ ├── recruiter/

│ ├── agents/

│ ├── assessment/

│ ├── interview/

│ └── analytics/

---

# Candidate Domain

Responsibilities:

- Profile
- Resume
- Applications
- Career Agent
- Contract Guardian

---

# Recruiter Domain

Responsibilities:

- Jobs
- Rankings
- Hiring Agent
- Offers

---

# Agent Domain

Responsibilities:

- Career Agent
- Hiring Agent
- Agent Orchestration
- Scheduling
- Matching
- Negotiation

---

# Agent Communication

Career Agent

↓

Agent Orchestrator

↓

Hiring Agent

---

# API Structure

## Candidate

/api/candidate/profile

/api/candidate/applications

/api/candidate/offers

---

## Recruiter

/api/recruiter/jobs

/api/recruiter/candidates

/api/recruiter/rankings

/api/recruiter/offers

---

## Agents

/api/agents/match

/api/agents/schedule

/api/agents/negotiate

/api/agents/analyze

---

# Database Collections

users

jobs

applications

resumes

assessments

interviews

offers

agent_events

---

# Git Strategy

Branches:

main

develop

candidate-dev

recruiter-dev

Workflow:

candidate-dev → develop

recruiter-dev → develop

develop → main

---

# Deployment

Frontend:

Vercel

Backend:

Railway

Database:

MongoDB Atlas

---

# Future Evolution

candidate-service

recruiter-service

assessment-service

interview-service

agent-service

Current architecture is intentionally designed so these services can be extracted later without major refactoring.