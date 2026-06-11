"""STT Service using Hugging Face Inference API (Whisper Large v3)"""
import logging

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class STTService:
    def __init__(self, api_token: str | None = None):
        self.api_token = api_token or settings.HUGGINGFACE_API_TOKEN
        self.api_url = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"

    async def transcribe(self, audio_bytes: bytes) -> str:
        """Upload raw audio bytes and return transcription text."""
        if not self.api_token:
            return ""

        headers = {
            "Authorization": f"Bearer {self.api_token}",
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    files={"file": ("audio.webm", audio_bytes, "audio/webm")},
                )

                if response.status_code == 503:
                    # Model is loading, return empty string
                    return ""
                if response.status_code != 200:
                    return ""

                data = response.json()
                return data.get("text", "")
        except Exception:
            logger.exception("STT transcription failed")
            return ""