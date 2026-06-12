# Startup script for DirectHire ecosystem
Write-Host "Starting Backend Service..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "Starting Candidate App..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run candidate"

Write-Host "Starting Recruiter App..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run recruiter"

Write-Host "All services are starting in separate windows!"
