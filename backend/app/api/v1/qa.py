from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models import QuestionStatus, User
from app.schemas.qa import AnswerCreate, AnswerUpdate, QuestionCreate, QuestionDetail, QuestionRead, QuestionUpdate
from app.schemas.resource import VoteRequest
from app.services import qa as qa_service

router = APIRouter(prefix="/qa", tags=["qa"])


@router.get("/questions")
async def list_questions(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    topic: str | None = Query(None),
    status_filter: QuestionStatus | None = Query(None, alias="status"),
    q: str | None = Query(None),
    sort: str = Query("recent", pattern="^(recent|upvotes|unanswered)$"),
    session: AsyncSession = Depends(get_session),
) -> dict:
    items, total = await qa_service.list_questions(
        session=session,
        limit=limit,
        offset=offset,
        topic_tag=topic,
        status=status_filter,
        q=q,
        sort=sort,
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.post("/questions", response_model=QuestionDetail, status_code=status.HTTP_201_CREATED)
async def create_question(
    payload: QuestionCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.create_question(session, payload, user)


@router.get("/questions/{question_id}", response_model=QuestionDetail)
async def get_question(
    question_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.get_question(session, question_id)


@router.patch("/questions/{question_id}", response_model=QuestionDetail)
async def update_question(
    question_id: UUID,
    payload: QuestionUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.update_question(session, question_id, payload, user)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    await qa_service.delete_question(session, question_id, user)


@router.post("/questions/{question_id}/vote", response_model=QuestionDetail)
async def vote_question(
    question_id: UUID,
    payload: VoteRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.vote_question(session, question_id, payload.value, user)


@router.post("/questions/{question_id}/answers", response_model=QuestionDetail, status_code=status.HTTP_201_CREATED)
async def create_answer(
    question_id: UUID,
    payload: AnswerCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.create_answer(session, question_id, payload, user)


@router.patch("/answers/{answer_id}", response_model=QuestionDetail)
async def update_answer(
    answer_id: UUID,
    payload: AnswerUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.update_answer(session, answer_id, payload, user)


@router.delete("/answers/{answer_id}", response_model=QuestionDetail)
async def delete_answer(
    answer_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.delete_answer(session, answer_id, user)


@router.post("/questions/{question_id}/pin-answer/{answer_id}", response_model=QuestionDetail)
async def pin_answer(
    question_id: UUID,
    answer_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.pin_answer(session, question_id, answer_id, user)


@router.post("/answers/{answer_id}/vote", response_model=QuestionDetail)
async def vote_answer(
    answer_id: UUID,
    payload: VoteRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuestionDetail:
    return await qa_service.vote_answer(session, answer_id, payload.value, user)
