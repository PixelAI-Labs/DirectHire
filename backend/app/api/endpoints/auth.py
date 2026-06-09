from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token

router = APIRouter()

@router.post("/login")
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    # Example placeholder implementation
    if form_data.username == "test@example.com" and form_data.password == "password":
        access_token = create_access_token(subject=form_data.username)
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(status_code=400, detail="Incorrect email or password")
