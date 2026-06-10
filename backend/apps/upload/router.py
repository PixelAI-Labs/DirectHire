"""
Upload Router — Generic file upload + static file serving
"""
import os
import re
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel

from core.config import settings
from apps.auth.models import User
from apps.auth.security import get_current_user

router = APIRouter()

# ------------------------------------------------------------------
# Shared utility
# ------------------------------------------------------------------

def sanitize_filename(filename: str) -> str:
    """Strip path separators and dangerous characters to prevent path traversal."""
    filename = os.path.basename(filename)
    filename = re.sub(r"[^\w\-.]", "_", filename)
    return filename


async def save_upload_file(
    file: UploadFile,
    subdir: str,
    prefix: str = "",
) -> tuple[str, int]:
    """
    Save an UploadFile to uploads/<subdir>/ with an optional prefix.
    Returns (absolute_path, size_bytes).
    """
    upload_dir = os.path.join(settings.UPLOAD_DIR, subdir)
    os.makedirs(upload_dir, exist_ok=True)

    safe_name = sanitize_filename(file.filename or "unknown")
    full_path = os.path.join(upload_dir, f"{prefix}{safe_name}" if prefix else safe_name)

    size = 0
    with open(full_path, "wb") as buffer:
        while chunk := file.file.read(8192):
            buffer.write(chunk)
            size += len(chunk)

    return full_path, size


# ------------------------------------------------------------------
# Schemas
# ------------------------------------------------------------------

class UploadOut(BaseModel):
    filename: str
    file_type: str
    url: str
    size_bytes: int


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@router.post("/", response_model=UploadOut)
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = "resume",
    current_user: User = Depends(get_current_user),
):
    """
    Generic file upload endpoint.
    Validates file type (PDF, PNG, JPG only), max 5MB.
    Saves to the appropriate uploads/ subdirectory.
    Returns the public URL path.
    """
    if file_type not in settings.UPLOAD_TYPE_DIRS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file_type '{file_type}'. Allowed: {list(settings.UPLOAD_TYPE_DIRS.keys())}",
        )

    content_type = getattr(file, "content_type", None) or ""
    if content_type not in settings.ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{content_type}' not allowed. Allowed: {list(settings.ALLOWED_UPLOAD_TYPES)}",
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    subdir = settings.UPLOAD_TYPE_DIRS[file_type]

    file.file.seek(0, 2)  # seek to end
    size = file.file.tell()
    file.file.seek(0)  # reset

    if size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit",
        )

    prefix = f"{current_user.id}_"
    full_path, _ = await save_upload_file(file, subdir, prefix=prefix)
    filename = os.path.basename(full_path)

    public_url = f"/uploads/{subdir}/{filename}"

    return UploadOut(
        filename=filename,
        file_type=file_type,
        url=public_url,
        size_bytes=size,
    )


@router.get("/{file_type}/{filename}")
async def serve_file(file_type: str, filename: str):
    """
    Serve uploaded files from the uploads directory.
    """
    if file_type not in settings.UPLOAD_TYPE_DIRS:
        raise HTTPException(status_code=404, detail="File type not found")

    safe_name = sanitize_filename(filename)
    file_path = os.path.join(
        settings.UPLOAD_DIR,
        settings.UPLOAD_TYPE_DIRS[file_type],
        safe_name,
    )

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)