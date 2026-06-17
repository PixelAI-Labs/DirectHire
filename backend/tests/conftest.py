from datetime import datetime, timezone
import io
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
from apps.agents.models import AgentEvent, CareerAgentReport
from apps.assessment.models import Assessment
from apps.interview.models import Interview
from apps.notifications.models import Notification

from apps.auth.security import create_access_token
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
TEST_PASSWORD_HASH = pwd_context.hash("password123")

@pytest_asyncio.fixture(scope="session")
async def db():
    """Setup a test database and initialize Beanie."""
    assert settings.MONGODB_DB_NAME.endswith("test"), "Must use a test database!"
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    await init_beanie(
        database=database,
        document_models=[
            User, CandidateProfile, Resume, Application,
            Job, Ranking, Offer, Company, AgentEvent, CareerAgentReport,
            Assessment, Interview, Notification
        ]
    )
    yield database
    await client.drop_database(settings.MONGODB_DB_NAME)
    client.close()


@pytest_asyncio.fixture(autouse=True)
async def clear_db(db):
    """Clear all collections before each test."""
    models = [
        User, CandidateProfile, Resume, Application,
        Job, Ranking, Offer, Company, AgentEvent, CareerAgentReport,
        Assessment, Interview, Notification
    ]
    for model in models:
        await model.delete_all()
    yield


@pytest_asyncio.fixture
async def async_client(db):
    """Provides an AsyncClient for testing FastAPI endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_candidate(db):
    """Create and return a test candidate user."""
    user = User(
        email="candidate@test.com",
        hashed_password=TEST_PASSWORD_HASH,
        full_name="Test Candidate",
        role=UserRole.CANDIDATE
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def test_recruiter(db):
    """Create and return a test recruiter user."""
    user = User(
        email="recruiter@test.com",
        hashed_password=TEST_PASSWORD_HASH,
        full_name="Test Recruiter",
        role=UserRole.RECRUITER
    )
    await user.insert()
    return user


@pytest.fixture
def candidate_token(test_candidate):
    """Return a valid auth header for the candidate."""
    token = create_access_token({"sub": test_candidate.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def recruiter_token(test_recruiter):
    """Return a valid auth header for the recruiter."""
    token = create_access_token({"sub": test_recruiter.email})
    return {"Authorization": f"Bearer {token}"}


# ─── Reusable entity fixtures ────────────────────────────────────────

@pytest_asyncio.fixture
async def test_company(db, test_recruiter):
    """Create a company owned by the test recruiter."""
    company = Company(
        name="Test Company",
        description="A test company",
        website="https://test.com",
        recruiters=[test_recruiter.email],
        created_by=str(test_recruiter.id),
    )
    await company.insert()
    test_recruiter.company_id = str(company.id)
    await test_recruiter.save()
    return company


@pytest_asyncio.fixture
async def test_job(db, test_recruiter, test_company):
    """Create an OPEN job under the test company."""
    job = Job(
        company_id=str(test_company.id),
        title="Software Engineer",
        description="Build great software",
        requirements=["Python", "FastAPI"],
        skills=["Python", "React"],
        location="Remote",
        salary_min=100000,
        salary_max=150000,
        role_type="FULL_TIME",
        remote_option="HYBRID",
        status="OPEN",
    )
    await job.insert()
    return job


@pytest_asyncio.fixture
async def test_assessment(db, test_recruiter, test_candidate, test_job):
    """Create an assessment assigned to the test candidate."""
    assessment = Assessment(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        title="Technical Assessment",
        questions=["What is Python?", "Explain REST APIs."],
        status="ASSIGNED",
    )
    await assessment.insert()
    return assessment


@pytest_asyncio.fixture
async def test_interview(db, test_recruiter, test_candidate, test_job):
    """Create a scheduled interview."""
    interview = Interview(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        recruiter_id=str(test_recruiter.id),
        scheduled_at=datetime.now(timezone.utc),
        format="VIDEO",
        status="SCHEDULED",
    )
    await interview.insert()
    return interview


@pytest_asyncio.fixture
async def test_application(db, test_candidate, test_job):
    """Create a job application."""
    application = Application(
        job_id=str(test_job.id),
        candidate_id=str(test_candidate.id),
        status="APPLIED",
    )
    await application.insert()
    return application


@pytest.fixture
def fake_pdf_bytes():
    """Return minimal valid-looking PDF bytes for upload tests."""
    return io.BytesIO(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF")


@pytest.fixture
def mock_upload_dir(monkeypatch, tmp_path):
    """Monkeypatch settings.UPLOAD_DIR to a temporary directory."""
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    return tmp_path
