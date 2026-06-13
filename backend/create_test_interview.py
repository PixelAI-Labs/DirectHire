import motor.motor_asyncio
import asyncio
from datetime import datetime, timezone

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.directhire
    interview = {
        "job_id": "6a2c4bd0500ab8ac8c5ff6e0",
        "candidate_id": "6a2c4c29500ab8ac8c5ff6e1",
        "recruiter_id": "6a2c4b59500ab8ac8c5ff6de",
        "scheduled_at": datetime.now(timezone.utc).isoformat(),
        "format": "VIDEO",
        "status": "SCHEDULED",
        "notes": "",
        "communication_score": 0.0,
        "technical_score": 0.0,
        "confidence_score": 0.0,
        "behavioral_analysis": "",
        "transcript": "",
        "qa_history": [],
        "evaluation_summary": "",
        "overall_score": 0.0,
        "strengths": [],
        "weaknesses": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    res = await db.interviews.insert_one(interview)
    print(f"Created interview ID: {str(res.inserted_id)}")

if __name__ == '__main__':
    asyncio.run(main())
