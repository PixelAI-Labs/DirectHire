"""Career Agent"""
from langchain_core.messages import SystemMessage, HumanMessage
from apps.agents.core import get_agent_llm

class CareerAgent:
    def __init__(self):
        self.llm = get_agent_llm(temperature=0.2)
        
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
