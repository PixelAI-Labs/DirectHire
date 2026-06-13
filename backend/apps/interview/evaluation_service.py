"""Interview Evaluation Service — Gemini-powered structured evaluation."""
from __future__ import annotations

import json
import logging

import google.generativeai as genai
from core.config import settings

logger = logging.getLogger(__name__)


class InterviewEvaluationService:
    """Evaluates mock interview sessions and returns structured scores."""

    async def evaluate_session(
        self,
        qa_history: list[dict],
        job_title: str,
        skills: list[str],
    ) -> dict:
        """
        Evaluate the interview and return structured scores and analysis.

        Returns:
            dict with keys: overall_score, communication_score, technical_score,
            confidence_score (all 0-100), behavioral_analysis, strengths,
            weaknesses, summary.
        """
        if not qa_history:
            return _empty_evaluation()

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return _rule_based_evaluation(qa_history, job_title, skills)

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash-latest")

        skills_str = ", ".join(skills) if skills else "general software engineering"
        qa_entries = []
        for idx, qa in enumerate(qa_history):
            qa_entries.append(
                "Q{idx}:\n{question}\nA{idx}:\n{answer}".format(
                    idx=idx + 1,
                    question=_sanitize_prompt_text(str(qa.get("question", "")).strip()),
                    answer=_sanitize_prompt_text(str(qa.get("answer", "")).strip()),
                )
            )
        qa_text = "\n\n".join(qa_entries)

        prompt = (
            "You are an expert interview evaluator. Evaluate the following mock interview "
            f"for the position: {job_title} (key skills: {skills_str}).\n\n"
            "Return a structured JSON evaluation with the following fields only "
            "(no markdown, no code fences, pure JSON):\n"
            "{\n"
            '  "overall_score": <int 0-100>,\n'
            '  "communication_score": <int 0-100>,\n'
            '  "technical_score": <int 0-100>,\n'
            '  "confidence_score": <int 0-100>,\n'
            '  "behavioral_analysis": "<2-3 sentence analysis of candidate behavior and communication style>",\n'
            '  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],\n'
            '  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],\n'
            '  "summary": "<2-3 sentence overall summary of interview performance>"\n'
            "}\n\n"
            "Q&A History:\n"
            "```text\n"
            f"{qa_text}\n"
            "```\n"
        )

        try:
            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            # Strip markdown code fences if present
            if text.startswith("```"):
                text = text.split("```", 1)[1]
                text = text.lstrip("json\n").rstrip("```").strip()

            result = json.loads(text)
            # Ensure all keys are present
            return {
                "overall_score": max(0, min(100, int(result.get("overall_score", 0)))),
                "communication_score": max(0, min(100, int(result.get("communication_score", 0)))),
                "technical_score": max(0, min(100, int(result.get("technical_score", 0)))),
                "confidence_score": max(0, min(100, int(result.get("confidence_score", 0)))),
                "behavioral_analysis": str(result.get("behavioral_analysis", "")),
                "strengths": list(result.get("strengths", [])),
                "weaknesses": list(result.get("weaknesses", [])),
                "summary": str(result.get("summary", "")),
            }
        except Exception as exc:
            logger.exception("Gemini evaluation failed; falling back to rule-based scoring")
            return _rule_based_evaluation(qa_history, job_title, skills)


def _sanitize_prompt_text(text: str) -> str:
    """Escape triple backticks to prevent prompt injection."""
    return text.replace("```", "'''")


def _empty_evaluation() -> dict:
    return {
        "overall_score": 0,
        "communication_score": 0,
        "technical_score": 0,
        "confidence_score": 0,
        "behavioral_analysis": "No answers were recorded for this interview session.",
        "strengths": [],
        "weaknesses": ["No interview data available for evaluation."],
        "summary": "Interview session had no recorded Q&A to evaluate.",
    }


def _rule_based_evaluation(qa_history: list[dict], job_title: str, skills: list[str]) -> dict:
    """Fallback evaluation when Gemini API key is not configured."""
    n = len(qa_history)
    answered = sum(1 for qa in qa_history if qa.get("answer", "").strip())
    completeness = answered / max(n, 1)

    # Simple heuristics based on answer lengths
    total_chars = sum(len(qa.get("answer", "")) for qa in qa_history)
    avg_length = total_chars / max(answered, 1)

    # Estimate scores
    base = int(40 + completeness * 30)
    detail_bonus = min(15, avg_length // 30)
    overall = min(100, base + detail_bonus)

    return {
        "overall_score": overall,
        "communication_score": min(100, overall + 5),
        "technical_score": min(100, overall - 5),
        "confidence_score": min(100, overall + (10 if avg_length > 100 else 0)),
        "behavioral_analysis": (
            f"Candidate answered {answered} of {n} questions. "
            f"Average answer length was {avg_length:.0f} characters, "
            "indicating moderate detail in responses."
        ),
        "strengths": [
            "Completed the mock interview session",
            "Provided answers to most questions",
        ],
        "weaknesses": [
            "Detailed evaluation requires Gemini API key configuration",
            "Consider providing more detailed examples in answers",
        ],
        "summary": (
            f"Candidate completed a {job_title} mock interview with {n} questions. "
            f"Overall score reflects answer completeness and detail level. "
            "Configure Gemini API key for AI-powered detailed evaluation."
        ),
    }