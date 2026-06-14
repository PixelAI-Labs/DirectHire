# 🚀 DirectHire: The Autonomous AI Recruitment Ecosystem

<div align="center">
  <h3>Built for the <strong>FAR AWAY Hackathon (Round 1)</strong> by Zuup</h3>
  <p><strong>Transforming hiring from a manual chore into an intelligent, agent-driven collaboration.</strong></p>
</div>

---

## 🌍 About The Project

**DirectHire** is not just another job board or ATS. It is a fully autonomous, multi-agent ecosystem designed to completely reinvent the recruitment process. By giving every candidate a personal **Career Agent** and every recruiter a dedicated **Hiring Agent**, DirectHire enables seamless, intelligent collaboration that optimizes hiring outcomes with unprecedented transparency and efficiency.

### 🌟 Vision
- **Every candidate has a Career Agent.**
- **Every recruiter has a Hiring Agent.**
These agents collaborate to optimize hiring while maintaining complete transparency and human oversight.

---

## ✨ Ecosystem Features (MVP Scope)

DirectHire is divided into two distinct platforms, each powered by specialized AI engines.

### 🧑‍💼 Candidate Platform: The Career Agent
Your personal advocate in the job market, comprised of specialized sub-agents:

* **Strategic Aligner Agent:** Optimizes your resume, matches jobs, detects skill gaps, and calculates your true Career Alignment Score.
* **Proxy Liaison Agent:** Automates recruiter communications, manages your availability, and schedules interviews seamlessly.
* **Contract Guardian Agent:** Benchmarks salaries, analyzes contracts, and provides robust negotiation support by highlighting red/green flags.

### 🏢 Recruiter Platform: The Hiring Agent
A comprehensive suite of intelligence engines designed to discover and evaluate top talent:

* **Job & Resume Intelligence Engines:** Extracts core competencies from job requirements and evaluates candidates to generate Suitability, Eligibility, and Potential scores.
* **Assessment & Interview Intelligence:** Generates dynamic, adaptive assessments. Integrates with **EchoHire** to provide deep behavioral, communication, and technical analysis.
* **Candidate Ranking Engine:** A deterministic algorithm to surface top talent instantly:
  * *Resume (25%)* | *Assessment (30%)* | *Coding (15%)* | *Interview (15%)* | *Reasoning (10%)* | *Growth Potential (5%)*
* **Offer Intelligence:** Provides AI-driven salary recommendations and Offer Confidence Scores.

---

## 🤝 Agent Communication Layer
The core of DirectHire's automation. Career Agents and Hiring Agents communicate directly to share:
- Resume Intelligence & Job Requirements
- Assessment & Interview Requests
- Salary Expectations & Availability

---

## 🏗️ Architecture

DirectHire is built as a **Modular Monolith** for fast iteration and seamless deployment, structured to easily transition into microservices in the future.

* **Frontend:** Cleanly separated into Candidate and Recruiter domains (`apps/candidate`, `apps/recruiter`) using modern web technologies.
* **Backend:** Modular Python backend powering AI agents and intelligence engines.
* **Database:** MongoDB for scalable, flexible document storage of users, resumes, assessments, and agent events.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/PixelAI-Labs/DirectHire.git
cd DirectHire

# Review environment variables
cp .env.example .env

# Run startup script
./startup.ps1
```

---

## 🏆 Hackathon Context

This project was built for **Round 1: Online (MVP Submission)** of the **FAR AWAY Hackathon**, an international hackathon organized by **Zuup** (under Zylon Labs). 

* **Theme:** AI, Software & Interdisciplinary Solutions
* **Objective:** "Push from idea → MVP → real-world product. Build boldly. Ship something real."

We are incredibly excited to present DirectHire to the world and look forward to the possibility of presenting our polished, scalable product in the **Grand Finale in Japan!** 🇯🇵

---
<div align="center">
  <i>"Every candidate deserves an advocate. Every recruiter deserves an assistant. DirectHire makes it happen."</i>
</div>
