from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.core.errors import ApiError
from app.models import User, UserRole
from app.schemas.qa import AdminQAQueueResponse, QuestionDetail, QuestionMergeRequest
from app.services import qa as qa_service
from app.services.access import is_admin

router = APIRouter(prefix="/admin/qa", tags=["admin-qa"])


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not is_admin(user):
        raise ApiError(403, "FORBIDDEN", "Admin privileges required.")
    return user


@router.get("/queue", response_model=AdminQAQueueResponse)
async def get_qa_queue(
    q: str | None = Query(None),
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> AdminQAQueueResponse:
    return await qa_service.get_admin_qa_queue(session, q=q)


@router.post("/merge", response_model=QuestionDetail)
async def merge_questions(
    payload: QuestionMergeRequest,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.merge_questions(session, payload.source_question_id, payload.target_question_id, admin)


@router.post("/questions/{question_id}/pin", response_model=QuestionDetail)
async def toggle_question_pin(
    question_id: UUID,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.toggle_question_pin_admin(session, question_id, admin)


@router.post("/questions/{question_id}/close", response_model=QuestionDetail)
async def close_question(
    question_id: UUID,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.close_question_admin(session, question_id, admin)
