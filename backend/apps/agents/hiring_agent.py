"""Hiring Agent"""
import json
import re
from langchain_core.messages import SystemMessage, HumanMessage
from apps.agents.core import get_agent_llm


class HiringAgent:
    @property
    def llm(self):
        return get_agent_llm(temperature=0.2)

    async def screen_resume(self, resume_text: str, job_description: str) -> dict:
        """
        Parse and score resume vs job description.
        Return: {
            "eligibility_score": float (0-100),
            "suitability_score": float (0-100),
            "potential_score": float (0-100),
            "summary": str,
            "strengths": list[str],
            "concerns": list[str]
        }
        """
        system_prompt = (
            "You are an expert Technical Recruiter and Hiring Manager. "
            "Analyze the resume against the job description and output a JSON object with exactly these fields:\n"
            "  eligibility_score: float (0-100) — does the candidate meet minimum qualifications?\n"
            "  suitability_score: float (0-100) — how well does the resume fit the role?\n"
            "  potential_score: float (0-100) — growth potential if hired?\n"
            "  summary: str — 2-3 sentence overall assessment\n"
            "  strengths: list[str] — 3-5 key strengths\n"
            "  concerns: list[str] — 2-4 potential concerns\n"
            "Output ONLY the JSON object, no markdown, no explanation."
        )
        prompt_content = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_content),
        ]

        try:
            response = await self.llm.ainvoke(messages)
            raw = response.content.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw).strip()
                raw = re.sub(r"\s*```$", "", raw).strip()
            data = json.loads(raw)
            # Ensure numeric fields are floats
            for key in ("eligibility_score", "suitability_score", "potential_score"):
                if key in data:
                    data[key] = float(data[key])
            return data
        except Exception as e:
            return {
                "eligibility_score": 0.0,
                "suitability_score": 0.0,
                "potential_score": 0.0,
                "summary": f"Error scoring resume: {e}",
                "strengths": [],
                "concerns": [],
            }

    async def rank_candidates(
        self, candidates_list: list[dict], job_description: str
    ) -> list[dict]:
        """
        Sort applicants by match score.
        Input: list of {candidate_id, resume_text, skills, experience_years}
        Return: Same list sorted by overall_score descending, each item gets
                "overall_score", "resume_score", "skill_match_score"
        """
        system_prompt = (
            "You are an expert Hiring Manager. Rank the candidates for the given job. "
            "Output a JSON array of objects, one per candidate, with these fields:\n"
            "  candidate_id: str — must match the input id exactly\n"
            "  resume_score: float (0-100) — overall resume quality and relevance\n"
            "  skill_match_score: float (0-100) — skill overlap with job requirements\n"
            "  overall_score: float (0-100) — composite score (resume 40% + skill match 60%)\n"
            "Output ONLY the JSON array, no markdown, no explanation."
        )
        candidates_str = json.dumps(candidates_list, indent=2)
        prompt_content = f"Candidates:\n{candidates_str}\n\nJob Description:\n{job_description}"
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_content),
        ]

        try:
            response = await self.llm.ainvoke(messages)
            raw = response.content.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw).strip()
                raw = re.sub(r"\s*```$", "", raw).strip()
            ranked = json.loads(raw)
            # Ensure numeric fields
            for item in ranked:
                for key in ("resume_score", "skill_match_score", "overall_score"):
                    if key in item:
                        item[key] = float(item[key])
            # Sort descending by overall_score
            ranked.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
            return ranked
        except Exception as e:
            return [
                {
                    "candidate_id": c.get("candidate_id"),
                    "resume_score": 0.0,
                    "skill_match_score": 0.0,
                    "overall_score": 0.0,
                    "error": str(e),
                }
                for c in candidates_list
            ]

    async def analyze_assessment(
        self, assessment_results: dict, job_requirements: list[str]
    ) -> dict:
        """
        Evaluate test results, flag anomalies.
        Return: {
            "technical_score": float,
            "coding_score": float,
            "reasoning_score": float,
            "anomalies": list[str],
            "summary": str
        }
        """
        system_prompt = (
            "You are an expert Technical Interviewer. Evaluate the assessment results "
            "against the job requirements and output a JSON object with:\n"
            "  technical_score: float (0-100)\n"
            "  coding_score: float (0-100)\n"
            "  reasoning_score: float (0-100)\n"
            "  anomalies: list[str] — any suspicious patterns (e.g. too perfect, inconsistent with resume)\n"
            "  summary: str — 2-3 sentence evaluation summary\n"
            "Output ONLY the JSON object, no markdown."
        )
        prompt_content = (
            f"Assessment Results:\n{json.dumps(assessment_results, indent=2)}\n\n"
            f"Job Requirements:\n{json.dumps(job_requirements, indent=2)}"
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_content),
        ]

        try:
            response = await self.llm.ainvoke(messages)
            raw = response.content.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw).strip()
                raw = re.sub(r"\s*```$", "", raw).strip()
            data = json.loads(raw)
            for key in ("technical_score", "coding_score", "reasoning_score"):
                if key in data:
                    data[key] = float(data[key])
            return data
        except Exception as e:
            return {
                "technical_score": 0.0,
                "coding_score": 0.0,
                "reasoning_score": 0.0,
                "anomalies": [],
                "summary": f"Error analyzing assessment: {e}",
            }

    async def draft_offer(
        self, candidate_profile: dict, job: dict, company: dict
    ) -> dict:
        """
        Generate offer letter text + salary recommendation.
        Return: {
            "offer_text": str,
            "recommended_salary": float,
            "confidence": str (Hire|Consider|Reject),
            "salary_reasoning": str
        }
        """
        system_prompt = (
            "You are an expert Talent Acquisition lead. Draft a job offer letter and "
            "recommend a salary. Output a JSON object with:\n"
            "  offer_text: str — professional offer letter (3-5 sentences, warm but formal)\n"
            "  recommended_salary: float — annual salary in USD\n"
            "  confidence: str — one of 'Hire', 'Consider', or 'Reject'\n"
            "  salary_reasoning: str — 1-2 sentences explaining the salary recommendation\n"
            "Output ONLY the JSON object, no markdown."
        )
        prompt_content = (
            f"Candidate Profile:\n{json.dumps(candidate_profile, indent=2)}\n\n"
            f"Job Details:\n{json.dumps(job, indent=2)}\n\n"
            f"Company Info:\n{json.dumps(company, indent=2)}"
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_content),
        ]

        try:
            response = await self.llm.ainvoke(messages)
            raw = response.content.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw).strip()
                raw = re.sub(r"\s*```$", "", raw).strip()
            data = json.loads(raw)
            if "recommended_salary" in data:
                data["recommended_salary"] = float(data["recommended_salary"])
            return data
        except Exception as e:
            return {
                "offer_text": "",
                "recommended_salary": 0.0,
                "confidence": "Reject",
                "salary_reasoning": f"Error drafting offer: {e}",
            }