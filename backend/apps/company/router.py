"""Company Router"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/")
async def create_company(): return {"message": "Create company — WIP"}

@router.get("/")
async def list_companies(): return {"message": "List companies — WIP"}

@router.get("/{id}")
async def get_company(): return {"message": "Get company — WIP"}

@router.put("/{id}")
async def update_company(): return {"message": "Update company — WIP"}