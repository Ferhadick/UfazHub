from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.api.deps import DbSession, get_current_user
from app.core.errors import ApiError
from app.models import User
from app.schemas.user import UserPublic, UserUpdate

router = APIRouter(prefix="/users", tags=["profile"])


@router.get("/me", response_model=UserPublic)
async def me(user: Annotated[User, Depends(get_current_user)]) -> UserPublic:
    return user


@router.patch("/me", response_model=UserPublic)
async def update_me(payload: UserUpdate, session: DbSession, user: Annotated[User, Depends(get_current_user)]) -> UserPublic:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    await session.commit()
    await session.refresh(user)
    return user


@router.get("/{username}", response_model=UserPublic)
async def public_profile(username: str, session: DbSession) -> UserPublic:
    user = await session.scalar(select(User).where(User.username == username))
    if user is None:
        raise ApiError(404, "USER_NOT_FOUND", "User was not found.")
    return user
