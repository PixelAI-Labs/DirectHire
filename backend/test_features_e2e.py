import httpx
import json
import asyncio

BASE_URL = "http://127.0.0.1:8000"

async def test_all():
    # Credentials
    recruiter_login = {"username": "recruiter@example.com", "password": "Password123!"}
    candidate_login = {"username": "candidate@example.com", "password": "Password123!"}
    
    # 1. Login Recruiter & Candidate
    async with httpx.AsyncClient() as client:
        rec_res = await client.post(f"{BASE_URL}/api/auth/login", data=recruiter_login)
        rec_data = rec_res.json()
        rec_token = rec_data["access_token"]
        rec_headers = {"Authorization": f"Bearer {rec_token}"}
        
        cand_res = await client.post(f"{BASE_URL}/api/auth/login", data=candidate_login)
        cand_data = cand_res.json()
        cand_token = cand_data["access_token"]
        cand_headers = {"Authorization": f"Bearer {cand_token}"}
        
        # Get Candidate ID
        cand_profile_res = await client.get(f"{BASE_URL}/api/candidate/profile", headers=cand_headers)
        candidate_id = cand_profile_res.json()["user_id"]
        
        # Get Jobs to find the FastAPI job
        jobs_res = await client.get(f"{BASE_URL}/api/recruiter/jobs", headers=rec_headers)
        jobs = jobs_res.json()
        fastapi_job = [j for j in jobs if "FastAPI" in j["title"]][0]
        job_id = fastapi_job["id"]
        
        print(f"Candidate ID: {candidate_id}")
        print(f"FastAPI Job ID: {job_id}\n")
        
        # ==========================================
        # FEATURE 1: AUTOMATED RANDOM TEST GENERATION (ASSESSMENT)
        # ==========================================
        print("--- Testing Feature: Automated Random Test Generation ---")
        assessment_payload = {
            "job_id": job_id,
            "candidate_id": candidate_id,
            "title": "FastAPI Core Competencies Test",
            "questions": []  # Trigger automatic generation
        }
        create_assess_res = await client.post(
            f"{BASE_URL}/api/assessments/",
            headers=rec_headers,
            json=assessment_payload,
            timeout=30.0  # Allow time for LLM generation
        )
        assert create_assess_res.status_code == 201, f"Failed: {create_assess_res.text}"
        assess_data = create_assess_res.json()
        assess_id = assess_data["id"]
        print(f"Assessment Created Successfully! ID: {assess_id}")
        print("Generated Questions:")
        for idx, q in enumerate(assess_data["questions"]):
            print(f"  {idx + 1}. {q}")
        
        # Submit Candidate Answers
        submit_payload = {
            "answers": [
                "FastAPI uses Pydantic for data validation and serialization by declaring types in route arguments.",
                "Dependency Injection in FastAPI is managed via 'Depends' to share db sessions or auth security.",
                "FastAPI is built on Starlette and Uvicorn, which allows it to handle concurrency using async/await syntax.",
                "Pydantic models define schemas. BaseSettings handles environment config validation.",
                "Uvicorn is an ASGI server that runs the FastAPI application."
            ]
        }
        submit_res = await client.post(
            f"{BASE_URL}/api/assessments/{assess_id}/submit",
            headers=cand_headers,
            json=submit_payload
        )
        assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"
        print(f"Assessment Submitted. Status: {submit_res.json()['status']}")
        
        # Recruiter Evaluates Assessment
        eval_payload = {
            "technical_score": 90.0,
            "coding_score": 85.0,
            "reasoning_score": 95.0,
            "ai_feedback": "Excellent conceptual understanding of FastAPI, Pydantic, and async execution."
        }
        eval_res = await client.post(
            f"{BASE_URL}/api/assessments/{assess_id}/evaluate",
            headers=rec_headers,
            json=eval_payload
        )
        assert eval_res.status_code == 200, f"Eval failed: {eval_res.text}"
        print(f"Assessment Evaluated. Technical Score: {eval_res.json()['technical_score']} | Feedback: {eval_res.json()['ai_feedback']}\n")

        # ==========================================
        # FEATURE 2: AI INTERVIEW (MOCK INTERVIEW)
        # ==========================================
        print("--- Testing Feature: AI Interview ---")
        # 1. Schedule Interview
        interview_payload = {
            "job_id": job_id,
            "candidate_id": candidate_id,
            "scheduled_at": None,
            "format": "VIDEO"
        }
        create_int_res = await client.post(
            f"{BASE_URL}/api/interviews/",
            headers=rec_headers,
            json=interview_payload
        )
        assert create_int_res.status_code == 201, f"Failed: {create_int_res.text}"
        int_data = create_int_res.json()
        interview_id = int_data["id"]
        print(f"Interview Scheduled! ID: {interview_id}")
        
        # 2. Get Next Question (Generated by AI)
        print("Generating Next Question via AI...")
        next_q_res = await client.post(
            f"{BASE_URL}/api/interviews/{interview_id}/question",
            headers=cand_headers,
            json={"previous_qa": []},
            timeout=30.0
        )
        assert next_q_res.status_code == 200, f"Next question failed: {next_q_res.text}"
        first_q = next_q_res.json()["question"]
        print(f"AI Question: {first_q}")
        
        # 3. Submit Answer
        print("Submitting Answer...")
        answer_payload = {
            "question": first_q,
            "answer": "Yes, I have extensively used FastAPI for building backend microservices. I prefer Beanie ODM for MongoDB integration because it provides a neat Pydantic-like interface."
        }
        ans_res = await client.post(
            f"{BASE_URL}/api/interviews/{interview_id}/answer",
            headers=cand_headers,
            json=answer_payload
        )
        assert ans_res.status_code == 200, f"Answer failed: {ans_res.text}"
        
        # 4. Generate next question based on history
        next_q_res2 = await client.post(
            f"{BASE_URL}/api/interviews/{interview_id}/question",
            headers=cand_headers,
            json={"previous_qa": [{"question": first_q, "answer": answer_payload["answer"]}]},
            timeout=30.0
        )
        assert next_q_res2.status_code == 200, f"Next question 2 failed: {next_q_res2.text}"
        second_q = next_q_res2.json()["question"]
        print(f"AI Follow-up Question: {second_q}")
        
        # Submit Answer 2
        answer_payload2 = {
            "question": second_q,
            "answer": "Beanie documents map directly to MongoDB collections and validate fields on write using Pydantic, which prevents dirty data entry."
        }
        await client.post(
            f"{BASE_URL}/api/interviews/{interview_id}/answer",
            headers=cand_headers,
            json=answer_payload2
        )
        
        # 5. Evaluate Interview Session (AI Evaluation)
        print("Evaluating Interview Session via AI...")
        eval_int_res = await client.post(
            f"{BASE_URL}/api/interviews/{interview_id}/evaluate",
            headers=cand_headers,
            timeout=30.0
        )
        assert eval_int_res.status_code == 200, f"Eval failed: {eval_int_res.text}"
        int_eval = eval_int_res.json()
        print("Interview Evaluation Summary:")
        print(f"  Overall Score: {int_eval['overall_score']}")
        print(f"  Communication Score: {int_eval['communication_score']}")
        print(f"  Technical Score: {int_eval['technical_score']}")
        print(f"  Confidence Score: {int_eval['confidence_score']}")
        print(f"  Summary: {int_eval['summary']}")
        print(f"  Strengths: {int_eval.get('strengths', [])}")

if __name__ == '__main__':
    asyncio.run(test_all())
