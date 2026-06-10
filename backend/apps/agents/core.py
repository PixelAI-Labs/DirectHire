"""Agent Core Configuration"""
from langchain_openai import ChatOpenAI
from core.config import settings

def get_agent_llm(temperature: float = 0.0) -> ChatOpenAI:
    """Returns a configured instance of the Gemma LLM for agent usage."""
    return ChatOpenAI(
        api_key=settings.GEMMA_API_KEY,
        base_url=settings.GEMMA_API_BASE_URL,
        model=settings.GEMMA_E4B_MODEL,
        temperature=temperature,
    )
