"""Interview AI Service — Gemini-powered question generation."""
from __future__ import annotations

import logging

import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)


def _sanitize_prompt_text(text: str) -> str:
    """Escape triple backticks to prevent prompt injection."""
    return text.replace("```", "'''")


class InterviewAIService:
    """Generates interview questions using Google Gemini 1.5 Flash."""

    def __init__(self, api_key: str | None = None) -> None:
        key = api_key or settings.GEMINI_API_KEY
        if key:
            genai.configure(api_key=key)
        self._has_key = key is not None

    async def generate_question(
        self,
        job_title: str,
        skills: list[str],
        previous_qa: list[dict],
    ) -> str:
        """Generate the next interview question based on job context and QA history."""
        if not self._has_key:
            return _fallback_question(job_title, skills, previous_qa)

        model = genai.GenerativeModel("gemini-1.5-flash-latest")

        context = _build_question_prompt(job_title, skills, previous_qa)
        try:
            response = await model.generate_content_async(context)
            return response.text.strip()
        except Exception as exc:
            logger.exception("Gemini question generation failed; using fallback question")
            return _fallback_question(job_title, skills, previous_qa)

    async def generate_followup(self, transcript: str, context: str) -> str:
        """Generate a follow-up question based on the candidate's answer."""
        if not self._has_key:
            return "Could you elaborate on that with a specific example?"

        model = genai.GenerativeModel("gemini-1.5-flash-latest")

        safe_transcript = _sanitize_prompt_text(transcript)
        safe_context = _sanitize_prompt_text(context)
        prompt = (
            "You are an interviewer conducting a mock interview. "
            "The candidate just answered a question. "
            f"Previous context:\n```text\n{safe_context}\n```\n\n"
            f"Candidate's answer:\n```text\n{safe_transcript}\n```\n\n"
            "Generate a natural follow-up question to probe deeper. "
            "Return only the question, no explanation."
        )
        try:
            response = await model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as exc:
            logger.exception("Gemini follow-up generation failed; using fallback question")
            return "Could you elaborate on that with a specific example?"


def _build_question_prompt(job_title: str, skills: list[str], previous_qa: list[dict]) -> str:
    skills_str = ", ".join(skills) if skills else "general software engineering"
    history = ""
    if previous_qa:
        lines = []
        for qa in previous_qa[-5:]:
            lines.append(
                "Q:\n{question}\nA:\n{answer}".format(
                    question=_sanitize_prompt_text(str(qa.get("question", "")).strip()),
                    answer=_sanitize_prompt_text(str(qa.get("answer", "")).strip()),
                )
            )
        history = "\n\nRecent Q&A:\n```text\n" + "\n---\n".join(lines) + "\n```"

    return (
        f"You are an interviewer for the position: {job_title}.\n"
        f"Key skills for this role: {skills_str}.{history}\n\n"
        "Based on the conversation history, generate the next relevant interview question. "
        "Vary question types (technical, behavioral, situational). "
        "Return only the question text, no explanation."
    )


def _fallback_question(job_title: str, skills: list[str], previous_qa: list[dict]) -> str:
    if len(previous_qa) == 0:
        return f"Tell me about your experience with {skills[0] if skills else 'the relevant technologies'}."
    elif len(previous_qa) == 1:
        return "Can you describe a challenging project you worked on and how you overcame obstacles?"
    elif len(previous_qa) == 2:
        return "How do you stay updated with the latest industry trends and technologies?"
    else:
        return "What do you consider your greatest professional strength and area for improvement?"