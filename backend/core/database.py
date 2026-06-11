"""
MongoDB database connection using Motor + Beanie
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from core.config import settings

# Models
from apps.auth.models import User
from apps.candidate.models import CandidateProfile, Resume, Application
from apps.recruiter.models import Job, Ranking, Offer
from apps.company.models import Company
from apps.agents.models import AgentEvent
from apps.assessment.models import Assessment
from apps.interview.models import Interview
from apps.notifications.models import Notification


class Database:
    client: AsyncIOMotorClient = None

    @classmethod
    async def connect(cls):
        cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = cls.client[settings.MONGODB_DB_NAME]

        # Initialize Beanie ODM
        await init_beanie(
            database=db,
            document_models=[
                User,
                CandidateProfile,
                Resume,
                Application,
                Job,
                Ranking,
                Offer,
                Company,
                AgentEvent,
                Assessment,
                Interview,
                Notification,
            ]
        )
        print(f" Connected to MongoDB: {settings.MONGODB_DB_NAME}")

    @classmethod
    async def disconnect(cls):
        if cls.client:
            cls.client.close()
            print(" Disconnected from MongoDB")

    @classmethod
    async def ping(cls):
        await cls.client.admin.command("ping")
