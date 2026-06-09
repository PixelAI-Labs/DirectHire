"""Company Router"""
from fastapi import APIRouter, Depends, HTTPException, status

from apps.auth.models import User
from apps.auth.security import get_current_user
from apps.company.models import Company
from apps.company.schemas import CompanyCreate, CompanyOut, CompanyUpdate

router = APIRouter()


def _authorize_company_access(company: Company, user: User) -> bool:
    return user.email in company.recruiters or company.created_by == str(user.id)


def _company_to_out(company: Company) -> CompanyOut:
    return CompanyOut(
        id=str(company.id),
        name=company.name,
        logo_url=company.logo_url,
        description=company.description,
        website=company.website,
        recruiters=company.recruiters,
        created_by=company.created_by,
    )


@router.post("/", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CompanyCreate,
    current_user: User = Depends(get_current_user),
):
    company = Company(
        name=payload.name,
        logo_url=payload.logo_url,
        description=payload.description,
        website=payload.website,
        recruiters=[current_user.email],
        created_by=str(current_user.id),
    )
    await company.insert()
    return _company_to_out(company)


@router.get("/", response_model=list[CompanyOut])
async def list_companies(current_user: User = Depends(get_current_user)):
    companies = await Company.find(
        {
            "$or": [
                {"recruiters": current_user.email},
                {"created_by": str(current_user.id)},
            ]
        }
    ).to_list()
    return [_company_to_out(c) for c in companies]


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(
    company_id: str,
    current_user: User = Depends(get_current_user),
):
    company = await Company.find_one(Company.id == company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    if not _authorize_company_access(company, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this company",
        )
    return _company_to_out(company)


@router.put("/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: str,
    payload: CompanyUpdate,
    current_user: User = Depends(get_current_user),
):
    company = await Company.find_one(Company.id == company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    if not _authorize_company_access(company, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this company",
        )
    if payload.name is not None:
        company.name = payload.name
    if payload.logo_url is not None:
        company.logo_url = payload.logo_url
    if payload.description is not None:
        company.description = payload.description
    if payload.website is not None:
        company.website = payload.website
    await company.save()
    return _company_to_out(company)