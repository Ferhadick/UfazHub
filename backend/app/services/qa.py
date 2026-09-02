from collections import defaultdict
from uuid import UUID

from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.models import ActionEventType, Answer, Question, QuestionStatus, Resource, User, Vote
from app.schemas.qa import (
    AdminQAQueueCluster,
    AdminQAQueueResponse,
    AnswerCreate,
    AnswerRead,
    AnswerUpdate,
    QuestionCreate,
    QuestionDetail,
    QuestionRead,
    QuestionUpdate,
)
from app.services.access import assert_author_or_admin, assert_user_can_answer, assert_user_can_write, is_admin
from app.services.events import log_action


def _serialize_question(q: Question) -> QuestionRead:
    has_verified = any(
        a.author and (a.author.is_verified or a.author.role.value in ("verified_ufazian", "admin"))
        for a in (q.answers or [])
        if not a.is_hidden
    )
    return QuestionRead(
        id=q.id,
        author_id=q.author_id,
        author=q.author,
        title=q.title,
        body=q.body,
        topic_tag=q.topic_tag,
        linked_resource_id=q.linked_resource_id,
        linked_resource=q.linked_resource,
        status=q.status,
        upvotes=q.upvotes,
        downvotes=q.downvotes,
        is_hidden=q.is_hidden,
        is_pinned_admin=q.is_pinned_admin,
        answers_count=len([a for a in (q.answers or []) if not a.is_hidden]),
        has_verified_answer=has_verified,
        created_at=q.created_at,
        updated_at=q.updated_at,
    )


def _serialize_question_detail(q: Question) -> QuestionDetail:
    base = _serialize_question(q)
    visible_answers = [a for a in (q.answers or []) if not a.is_hidden]
    sorted_answers = sorted(
        visible_answers,
        key=lambda a: (not a.is_pinned, -(a.upvotes - a.downvotes), a.created_at),
    )
    answer_reads = [
        AnswerRead(
            id=a.id,
            question_id=a.question_id,
            author_id=a.author_id,
            author=a.author,
            body=a.body,
            linked_resources=a.linked_resources or [],
            upvotes=a.upvotes,
            downvotes=a.downvotes,
            is_pinned=a.is_pinned,
            is_helpful=a.is_helpful,
            is_hidden=a.is_hidden,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in sorted_answers
    ]
    return QuestionDetail(
        **base.model_dump(),
        answers=answer_reads,
    )


async def create_question(session: AsyncSession, payload: QuestionCreate, user: User) -> QuestionDetail:
    await assert_user_can_write(session, user)
    if payload.linked_resource_id:
        res = await session.get(Resource, payload.linked_resource_id)
        if not res:
            raise ApiError(404, "RESOURCE_NOT_FOUND", "Linked resource not found.")

    question = Question(
        author_id=user.id,
        title=payload.title,
        body=payload.body,
        topic_tag=payload.topic_tag.strip().lower(),
        linked_resource_id=payload.linked_resource_id,
        status=QuestionStatus.open,
    )
    session.add(question)
    user.reputation_score += 2
    await session.flush()
    await log_action(session, ActionEventType.question_created, user=user, target_type="question", target_id=question.id)
    await session.commit()
    return await get_question(session, question.id)


async def list_questions(
    session: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    topic_tag: str | None = None,
    status: QuestionStatus | None = None,
    q: str | None = None,
    sort: str = "recent",
    include_hidden: bool = False,
) -> tuple[list[QuestionRead], int]:
    stmt = select(Question).options(
        selectinload(Question.author),
        selectinload(Question.linked_resource).selectinload(Resource.author),
        selectinload(Question.linked_resource).selectinload(Resource.tags),
        selectinload(Question.answers).selectinload(Answer.author),
    )
    count_stmt = select(func.count()).select_from(Question)

    if not include_hidden:
        stmt = stmt.where(Question.is_hidden.is_(False))
        count_stmt = count_stmt.where(Question.is_hidden.is_(False))

    if topic_tag and topic_tag.lower() != "all":
        stmt = stmt.where(Question.topic_tag.ilike(f"%{topic_tag.strip()}%"))
        count_stmt = count_stmt.where(Question.topic_tag.ilike(f"%{topic_tag.strip()}%"))

    if status:
        stmt = stmt.where(Question.status == status)
        count_stmt = count_stmt.where(Question.status == status)

    if q:
        pat = f"%{q.strip()}%"
        cond = or_(Question.title.ilike(pat), Question.body.ilike(pat), Question.topic_tag.ilike(pat))
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    if sort == "upvotes":
        stmt = stmt.order_by(desc(Question.is_pinned_admin), desc(Question.upvotes), desc(Question.created_at))
    elif sort == "unanswered":
        stmt = stmt.where(Question.status == QuestionStatus.open).order_by(desc(Question.created_at))
    else:
        stmt = stmt.order_by(desc(Question.is_pinned_admin), desc(Question.created_at))

    stmt = stmt.limit(limit).offset(offset)
    questions = list((await session.scalars(stmt)).all())
    total = int(await session.scalar(count_stmt) or 0)
    return [_serialize_question(q) for q in questions], total


async def get_question(session: AsyncSession, question_id: UUID, include_hidden: bool = False) -> QuestionDetail:
    session.expire_all()
    stmt = (
        select(Question)
        .where(Question.id == question_id)
        .options(
            selectinload(Question.author),
            selectinload(Question.linked_resource).selectinload(Resource.author),
            selectinload(Question.linked_resource).selectinload(Resource.tags),
            selectinload(Question.answers).selectinload(Answer.author),
        )
        .execution_options(populate_existing=True)
    )
    if not include_hidden:
        stmt = stmt.where(Question.is_hidden.is_(False))

    question = await session.scalar(stmt)
    if not question:
        raise ApiError(404, "QUESTION_NOT_FOUND", "Question was not found.")
    return _serialize_question_detail(question)


async def update_question(session: AsyncSession, question_id: UUID, payload: QuestionUpdate, user: User) -> QuestionDetail:
    await assert_user_can_write(session, user)
    question = await session.get(Question, question_id)
    if not question:
        raise ApiError(404, "QUESTION_NOT_FOUND", "Question not found.")
    assert_author_or_admin(question.author_id, user, "edit this question")

    data = payload.model_dump(exclude_unset=True)
    if "topic_tag" in data and data["topic_tag"]:
        data["topic_tag"] = data["topic_tag"].strip().lower()

    for k, v in data.items():
        setattr(question, k, v)

    await session.commit()
    return await get_question(session, question_id, include_hidden=True)


async def delete_question(session: AsyncSession, question_id: UUID, user: User) -> None:
    await assert_user_can_write(session, user)
    question = await session.get(Question, question_id)
    if not question:
        raise ApiError(404, "QUESTION_NOT_FOUND", "Question not found.")
    assert_author_or_admin(question.author_id, user, "delete this question")
    await session.delete(question)
    await session.commit()


async def vote_question(session: AsyncSession, question_id: UUID, value: int, user: User) -> QuestionDetail:
    await assert_user_can_write(session, user)
    question = await session.get(Question, question_id)
    if not question or question.is_hidden:
        raise ApiError(404, "QUESTION_NOT_FOUND", "Question not found.")

    existing = await session.scalar(
        select(Vote).where(Vote.user_id == user.id, Vote.target_type == "question", Vote.target_id == question_id)
    )
    old_value = existing.value if existing else 0
    if value == 0 and existing is not None:
        await session.delete(existing)
    elif existing is not None:
        existing.value = value
    elif value != 0:
        session.add(Vote(user_id=user.id, target_type="question", target_id=question_id, value=value))

    question.upvotes += (1 if value == 1 else 0) - (1 if old_value == 1 else 0)
    question.downvotes += (1 if value == -1 else 0) - (1 if old_value == -1 else 0)
    await log_action(session, ActionEventType.vote_cast, user=user, target_type="question", target_id=question_id, metadata={"value": value})
    await session.commit()
    return await get_question(session, question_id)


async def create_answer(session: AsyncSession, question_id: UUID, payload: AnswerCreate, user: User) -> QuestionDetail:
    await assert_user_can_answer(session, user)
    question = await session.get(Question, question_id)
    if not question or question.is_hidden:
        raise ApiError(404, "QUESTION_NOT_FOUND", "Question not found.")
    if question.status == QuestionStatus.closed:
        raise ApiError(400, "QUESTION_CLOSED", "This question is closed for new answers.")

    answer = Answer(
        question_id=question_id,
        author_id=user.id,
        body=payload.body,
        linked_resources=payload.linked_resources,
    )
    session.add(answer)
    question.status = QuestionStatus.answered
    user.reputation_score += 10
    await session.flush()
    await log_action(session, ActionEventType.answer_created, user=user, target_type="answer", target_id=answer.id)
    await session.commit()
    return await get_question(session, question_id)


async def update_answer(session: AsyncSession, answer_id: UUID, payload: AnswerUpdate, user: User) -> QuestionDetail:
    await assert_user_can_write(session, user)
    answer = await session.get(Answer, answer_id)
    if not answer or answer.is_hidden:
        raise ApiError(404, "ANSWER_NOT_FOUND", "Answer not found.")
    assert_author_or_admin(answer.author_id, user, "edit this answer")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(answer, k, v)
    await session.commit()
    return await get_question(session, answer.question_id, include_hidden=True)


async def delete_answer(session: AsyncSession, answer_id: UUID, user: User) -> QuestionDetail:
    await assert_user_can_write(session, user)
    answer = await session.get(Answer, answer_id)
    if not answer:
        raise ApiError(404, "ANSWER_NOT_FOUND", "Answer not found.")
    assert_author_or_admin(answer.author_id, user, "delete this answer")
    question_id = answer.question_id
    await session.delete(answer)
    await session.commit()
    return await get_question(session, question_id, include_hidden=True)


async def pin_answer(session: AsyncSession, question_id: UUID, answer_id: UUID, user: User) -> QuestionDetail:
    await assert_user_can_write(session, user)
    question = await session.get(Question, question_id)
    if not question:
        raise ApiError(404, "QUESTION_NOT_FOUND", "Question not found.")

    is_author = question.author_id == user.id
    if not (is_author or is_admin(user)):
        raise ApiError(403, "FORBIDDEN", "Only the question author or an admin can pin or mark helpful answers.")

    answer = await session.get(Answer, answer_id)
    if not answer or answer.question_id != question_id:
        raise ApiError(404, "ANSWER_NOT_FOUND", "Answer not found in this thread.")

    # Toggle pin
    answer.is_pinned = not answer.is_pinned
    answer.is_helpful = answer.is_pinned
    if answer.is_pinned:
        await log_action(session, ActionEventType.answer_pinned, user=user, target_type="answer", target_id=answer.id)
    await session.commit()
    return await get_question(session, question_id)


async def vote_answer(session: AsyncSession, answer_id: UUID, value: int, user: User) -> QuestionDetail:
    await assert_user_can_write(session, user)
    answer = await session.get(Answer, answer_id)
    if not answer or answer.is_hidden:
        raise ApiError(404, "ANSWER_NOT_FOUND", "Answer not found.")

    existing = await session.scalar(
        select(Vote).where(Vote.user_id == user.id, Vote.target_type == "answer", Vote.target_id == answer_id)
    )
    old_value = existing.value if existing else 0
    if value == 0 and existing is not None:
        await session.delete(existing)
    elif existing is not None:
        existing.value = value
    elif value != 0:
        session.add(Vote(user_id=user.id, target_type="answer", target_id=answer_id, value=value))

    answer.upvotes += (1 if value == 1 else 0) - (1 if old_value == 1 else 0)
    answer.downvotes += (1 if value == -1 else 0) - (1 if old_value == -1 else 0)
    await log_action(session, ActionEventType.vote_cast, user=user, target_type="answer", target_id=answer_id, metadata={"value": value})
    await session.commit()
    return await get_question(session, answer.question_id)


async def get_admin_qa_queue(session: AsyncSession, q: str | None = None) -> AdminQAQueueResponse:
    stmt = (
        select(Question)
        .options(
            selectinload(Question.author),
            selectinload(Question.linked_resource).selectinload(Resource.author),
            selectinload(Question.linked_resource).selectinload(Resource.tags),
            selectinload(Question.answers).selectinload(Answer.author),
        )
        .order_by(desc(Question.created_at))
    )
    all_questions = list((await session.scalars(stmt)).all())
    serialized = [_serialize_question(q) for q in all_questions]

    # Group by keywords / topics
    cluster_map: dict[str, list[QuestionRead]] = defaultdict(list)
    keywords = ["internship", "master", "exam", "machine learning", "petroleum", "career", "cs", "math", "general"]

    if q and q.strip():
        keywords = [q.strip().lower()]

    for question in serialized:
        matched = False
        text_content = f"{question.title} {question.body or ''} {question.topic_tag}".lower()
        for kw in keywords:
            if kw in text_content:
                cluster_map[kw].append(question)
                matched = True
        if not matched:
            cluster_map[question.topic_tag or "general"].append(question)

    clusters = [
        AdminQAQueueCluster(keyword=kw, count=len(items), questions=items)
        for kw, items in cluster_map.items()
        if len(items) > 0
    ]
    clusters.sort(key=lambda c: c.count, reverse=True)

    unanswered_count = len([q for q in serialized if q.status == QuestionStatus.open])
    return AdminQAQueueResponse(
        total_unanswered=unanswered_count,
        total_questions=len(serialized),
        clusters=clusters,
        recent_questions=serialized[:20],
    )


async def merge_questions(session: AsyncSession, source_id: UUID, target_id: UUID, admin_user: User) -> QuestionDetail:
    if not is_admin(admin_user):
        raise ApiError(403, "FORBIDDEN", "Only admins can merge questions.")
    if source_id == target_id:
        raise ApiError(400, "BAD_REQUEST", "Cannot merge a question into itself.")

    source = await session.get(Question, source_id)
    target = await session.get(Question, target_id)
    if not source or not target:
        raise ApiError(404, "NOT_FOUND", "Source or target question not found.")

    # Reassign answers from source to target
    stmt = select(Answer).where(Answer.question_id == source_id)
    answers = list((await session.scalars(stmt)).all())
    for a in answers:
        a.question_id = target_id

    source.status = QuestionStatus.closed
    source.merged_into_id = target_id
    source.is_hidden = True

    if answers:
        target.status = QuestionStatus.answered

    await log_action(
        session,
        ActionEventType.question_merged,
        user=admin_user,
        target_type="question",
        target_id=target_id,
        metadata={"source_question_id": str(source_id)},
    )
    await session.commit()
    return await get_question(session, target_id)


async def toggle_question_pin_admin(session: AsyncSession, question_id: UUID, admin_user: User) -> QuestionDetail:
    if not is_admin(admin_user):
        raise ApiError(403, "FORBIDDEN", "Only admins can pin questions.")
    question = await session.get(Question, question_id)
    if not question:
        raise ApiError(404, "QUESTION_NOT_FOUND", "Question not found.")
    question.is_pinned_admin = not question.is_pinned_admin
    await session.commit()
    return await get_question(session, question_id)


async def close_question_admin(session: AsyncSession, question_id: UUID, admin_user: User) -> QuestionDetail:
    if not is_admin(admin_user):
        raise ApiError(403, "FORBIDDEN", "Only admins can close questions.")
    question = await session.get(Question, question_id)
    if not question:
        raise ApiError(404, "QUESTION_NOT_FOUND", "Question not found.")
    question.status = QuestionStatus.closed
    await session.commit()
    return await get_question(session, question_id)
