from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="DirectHire API",
    description="Autonomous multi-agent recruitment ecosystem",
    version="1.0.0",
)

# Set all CORS enabled origins
if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.ALLOWED_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.APP_ENV}

@app.get("/")
async def root():
    return {"message": "Welcome to DirectHire API"}
