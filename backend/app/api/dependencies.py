from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from app.core.config import settings

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/api/auth/login"
)

# Placeholder for database session dependency
def get_db() -> Generator:
    try:
        # yield db_session
        yield None
    finally:
        pass

# Placeholder for current user dependency
async def get_current_user(
    db: Any = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> Any:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    # user = crud.user.get(db, id=token_data)
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    # return user
    return {"id": token_data, "role": "USER"}
