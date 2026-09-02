from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Response, UploadFile
from sqlalchemy import select

from app.api.deps import DbSession, get_current_user
from app.core.errors import ApiError
from app.models import User
from app.models.user import UserAvatar
from app.schemas.user import UserPublic, UserUpdate

router = APIRouter(prefix="/users", tags=["profile"])

MAX_AVATAR_BYTES = 3 * 1024 * 1024  # 3MB limit
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"}


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


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    session: DbSession,
    user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> UserPublic:
    content_type = file.content_type or "image/webp"
    if content_type not in ALLOWED_MIME_TYPES and not content_type.startswith("image/"):
        raise ApiError(400, "INVALID_IMAGE_TYPE", "File must be a valid image (JPEG, PNG, WebP, GIF, or SVG).")

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise ApiError(413, "FILE_TOO_LARGE", "Image must be 3MB or smaller.")
    if len(content) == 0:
        raise ApiError(400, "EMPTY_FILE", "Uploaded file is empty.")

    avatar = await session.get(UserAvatar, user.id)
    if avatar is None:
        avatar = UserAvatar(user_id=user.id, image_data=content, content_type=content_type)
        session.add(avatar)
    else:
        avatar.image_data = content
        avatar.content_type = content_type

    timestamp = int(datetime.now().timestamp())
    user.avatar_url = f"/api/v1/users/{user.username}/avatar?t={timestamp}"
    await session.commit()
    await session.refresh(user)
    return user


@router.delete("/me/avatar", response_model=UserPublic)
async def delete_avatar(
    session: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> UserPublic:
    avatar = await session.get(UserAvatar, user.id)
    if avatar is not None:
        await session.delete(avatar)
    user.avatar_url = None
    await session.commit()
    await session.refresh(user)
    return user


@router.get("/{username}/avatar")
async def get_avatar(username: str, session: DbSession) -> Response:
    user = await session.scalar(select(User).where(User.username == username))
    if user is None:
        raise ApiError(404, "USER_NOT_FOUND", "User was not found.")
    avatar = await session.get(UserAvatar, user.id)
    if avatar is None or not avatar.image_data:
        raise ApiError(404, "AVATAR_NOT_FOUND", "Avatar was not found.")
    return Response(
        content=avatar.image_data,
        media_type=avatar.content_type,
        headers={"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"},
    )


@router.get("/{username}", response_model=UserPublic)
async def public_profile(username: str, session: DbSession) -> UserPublic:
    user = await session.scalar(select(User).where(User.username == username))
    if user is None:
        raise ApiError(404, "USER_NOT_FOUND", "User was not found.")
    return user

