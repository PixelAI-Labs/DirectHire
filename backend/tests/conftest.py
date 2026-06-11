import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from main import app
from core.config import settings
from apps.auth.models import User, UserRole
from apps.candidate.models import CandidateProfile, Resume, Application
from apps.recruiter.models import Job, Ranking, Offer
from apps.company.models import Company
from apps.agents.models import AgentEvent
from apps.assessment.models import Assessment
from apps.interview.models import Interview
from apps.notifications.models import Notification

from apps.auth.security import create_access_token


@pytest_asyncio.fixture
async def db():
    """Setup a test database and initialize Beanie."""
    # Ensure we use a test database
    assert settings.MONGODB_DB_NAME.endswith("test"), "Must use a test database!"
    
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    
    await init_beanie(
        database=database,
        document_models=[
            User, CandidateProfile, Resume, Application,
            Job, Ranking, Offer, Company, AgentEvent,
            Assessment, Interview, Notification
        ]
    )
    
    yield database
    
    # Teardown: drop the test database
    await client.drop_database(settings.MONGODB_DB_NAME)
    client.close()


@pytest_asyncio.fixture
async def async_client(db):
    """Provides an AsyncClient for testing FastAPI endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_candidate(db):
    """Create and return a test candidate user."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = User(
        email="candidate@test.com",
        hashed_password=pwd_context.hash("password123"),
        full_name="Test Candidate",
        role=UserRole.CANDIDATE
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def test_recruiter(db):
    """Create and return a test recruiter user."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = User(
        email="recruiter@test.com",
        hashed_password=pwd_context.hash("password123"),
        full_name="Test Recruiter",
        role=UserRole.RECRUITER
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
def candidate_token(test_candidate):
    """Return a valid auth header for the candidate."""
    token = create_access_token({"sub": test_candidate.email})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
def recruiter_token(test_recruiter):
    """Return a valid auth header for the recruiter."""
    token = create_access_token({"sub": test_recruiter.email})
    return {"Authorization": f"Bearer {token}"}
