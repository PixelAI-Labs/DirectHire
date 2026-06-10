"""Career Agent"""
from langchain_core.messages import SystemMessage, HumanMessage
from apps.agents.core import get_agent_llm

class CareerAgent:
    @property
    def llm(self):
        return get_agent_llm(temperature=0.2)
        
    async def review_resume(self, resume_text: str) -> str:
        """Analyzes a resume against industry standards and provides actionable feedback."""
        system_prompt = (
            "You are an expert Career Coach and Technical Recruiter. "
            "Review the provided resume text and provide constructive feedback on formatting, "
            "impact, clarity, and missing sections. Keep it concise and actionable."
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Resume:\n{resume_text}")
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return f"Error reviewing resume: {e}"

    async def analyze_skill_gap(self, resume_skills: list[str], job_requirements: list[str]) -> str:
        """Compares candidate skills vs. job requirements to identify gaps."""
        system_prompt = (
            "You are an expert Career Coach. Compare the candidate's skills with the job requirements. "
            "Identify matched skills and missing skills (skill gaps). Suggest quick ways the candidate "
            "can bridge these gaps."
        )
        
        prompt_content = f"Candidate Skills: {', '.join(resume_skills)}\nJob Requirements: {', '.join(job_requirements)}"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_content)
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return f"Error analyzing skill gap: {e}"

    async def score_job_match(self, resume_text: str, job_description: str) -> str:
        """Scores candidate-job fit from 0-100 based on resume and job description."""
        system_prompt = (
            "You are an expert AI Recruiter. Compare the candidate's resume with the job description. "
            "Output a single match score from 0 to 100 representing the fit, followed by a brief 2-sentence justification."
        )
        
        prompt_content = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_content)
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return f"Error scoring job match: {e}"

    async def suggest_application_strategy(self, resume_text: str, job_description: str) -> str:
        """Tailors resume/cover letter advice per job."""
        system_prompt = (
            "You are a Career Coach. Read the resume and the job description. "
            "Suggest 3 specific ways the candidate should tailor their resume to better match this role, "
            "and provide an outline for a compelling cover letter."
        )
        
        prompt_content = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_content)
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return f"Error suggesting application strategy: {e}"

    async def prepare_interview(self, job_description: str) -> str:
        """Generates likely interview questions and tips."""
        system_prompt = (
            "You are an Interview Prep Coach. Based on the provided job description, "
            "generate 5 likely behavioral or technical interview questions the candidate might face. "
            "Include a brief tip on how to answer each."
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Job Description:\n{job_description}")
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return f"Error preparing interview: {e}"
