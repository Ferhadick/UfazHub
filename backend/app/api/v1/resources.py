from pathlib import Path
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile

from app.api.deps import DbSession, get_current_user, get_optional_guest, get_optional_user
from app.core.config import settings
from app.core.errors import ApiError
from app.models import ActionEventType, GuestSession, User
from app.schemas.common import PaginatedResponse
from app.schemas.resource import ResourceCreate, ResourceRead, ResourceUpdate, VoteRequest
from app.services.access import assert_user_can_write
from app.services.events import ensure_guest_session, log_action
from app.services.resources import create_resource, delete_resource, get_resource, list_resources, update_resource, vote_resource

router = APIRouter(prefix="/resources", tags=["resources"])

ALLOWED_UPLOAD_EXTENSIONS = {
    ".pdf", ".txt", ".md", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".csv",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".zip"
}


@router.get("", response_model=PaginatedResponse[ResourceRead])
async def index(
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    type: str | None = None,
    q: str | None = None,
) -> PaginatedResponse[ResourceRead]:
    items, total = await list_resources(session, limit, offset, type, q=q)
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("", response_model=ResourceRead, status_code=201)
async def create(payload: ResourceCreate, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> ResourceRead:
    return await create_resource(session, payload, user)


@router.post("/upload", status_code=201)
async def upload(
    request: Request,
    session: DbSession,
    user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> dict[str, str | int | None]:
    await assert_user_can_write(session, user)
    original_name = (file.filename or "attachment").strip()
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_UPLOAD_EXTENSIONS:
        raise ApiError(400, "UNSUPPORTED_FILE", "Upload a PDF, document, image, spreadsheet, text file, or ZIP archive.")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise ApiError(413, "FILE_TOO_LARGE", f"Files must be {settings.max_upload_mb} MB or smaller.")
    if not content:
        raise ApiError(400, "EMPTY_FILE", "The uploaded file is empty.")

    upload_dir = Path(settings.upload_dir) / "resources"
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{suffix}"
    (upload_dir / stored_name).write_bytes(content)

    public_url = f"{str(request.base_url).rstrip('/')}/uploads/resources/{stored_name}"
    return {
        "url": public_url,
        "filename": original_name,
        "content_type": file.content_type,
        "size": len(content),
    }


@router.post("/blocked-submit", status_code=204)
async def blocked_submit(session: DbSession, request: Request, response: Response) -> Response:
    guest = await ensure_guest_session(session, request, response)
    await log_action(session, ActionEventType.submit_attempt_blocked, guest=guest, metadata={"target": "resource"})
    await session.commit()
    return Response(status_code=204)


@router.get("/{resource_id}", response_model=ResourceRead)
async def show(
    resource_id: UUID,
    session: DbSession,
    user: Annotated[User | None, Depends(get_optional_user)],
    guest: Annotated[GuestSession | None, Depends(get_optional_guest)],
) -> ResourceRead:
    resource = await get_resource(session, resource_id)
    await log_action(session, ActionEventType.view_resource, user=user, guest=guest, target_type="resource", target_id=resource_id)
    await session.commit()
    return resource


@router.patch("/{resource_id}", response_model=ResourceRead)
async def update(resource_id: UUID, payload: ResourceUpdate, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> ResourceRead:
    return await update_resource(session, resource_id, payload, user)


@router.delete("/{resource_id}", status_code=204)
async def destroy(resource_id: UUID, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> Response:
    await delete_resource(session, resource_id, user)
    return Response(status_code=204)


@router.post("/{resource_id}/vote", response_model=ResourceRead)
async def vote(resource_id: UUID, payload: VoteRequest, session: DbSession, user: Annotated[User | None, Depends(get_optional_user)], request: Request, response: Response) -> ResourceRead:
    if user is None:
        guest = await ensure_guest_session(session, request, response)
        await log_action(session, ActionEventType.vote_attempt_blocked, guest=guest, target_type="resource", target_id=resource_id)
        await session.commit()
        raise ApiError(401, "AUTH_REQUIRED", "Create an account to vote and build reputation.")
    return await vote_resource(session, resource_id, payload.value, user)
