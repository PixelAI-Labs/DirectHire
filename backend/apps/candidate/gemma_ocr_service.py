"""
Gemma 27B OCR and Resume Extraction Service
"""
import PyPDF2
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from core.config import settings

async def extract_resume_with_gemma(file_path: str) -> str:
    # 1. Extract raw text from PDF
    raw_text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                raw_text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return "Failed to read PDF."

    # 2. Skip Gemma extraction if API key is not set
    if not settings.GEMMA_API_KEY or settings.GEMMA_API_KEY == "your_gemma_api_key_here":
        print("GEMMA_API_KEY not configured. Returning raw PyPDF2 text.")
        return raw_text

    # 3. Call Gemma 27B to clean up and structure the OCR text
    try:
        llm = ChatOpenAI(
            api_key=settings.GEMMA_API_KEY,
            base_url=settings.GEMMA_API_BASE_URL,
            model=settings.GEMMA_DENSE_MODEL,
            temperature=0.0
        )
        
        system_prompt = (
            "You are an expert OCR cleanup and resume parsing assistant. "
            "Clean up the following raw text extracted from a PDF resume. "
            "Fix any formatting issues, remove noise, and return a clean, structured "
            "Markdown representation of the resume focusing on Skills, Experience, and Education."
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=raw_text)
        ]
        
        response = await llm.ainvoke(messages)
        return response.content
        
    except Exception as e:
        print(f"Error calling Gemma 27B: {e}")
        return raw_text
