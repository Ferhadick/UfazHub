from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Response

from app.api.deps import DbSession, get_optional_guest
from app.models import GuestSession
from app.core.config import settings
from app.schemas.user import LoginRequest, TokenResponse, UserCreate
from app.services.auth import create_refresh_token, login_user, refresh_access_token, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    payload: UserCreate,
    session: DbSession,
    response: Response,
    guest: Annotated[GuestSession | None, Depends(get_optional_guest)],
) -> TokenResponse:
    result = await register_user(session, payload, guest)
    response.delete_cookie("ufaz_guest")
    response.set_cookie("ufaz_refresh", create_refresh_token(result.user), httponly=True, samesite="lax", secure=settings.cookie_secure)
    return result


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: DbSession,
    response: Response,
    guest: Annotated[GuestSession | None, Depends(get_optional_guest)],
) -> TokenResponse:
    result = await login_user(session, payload, guest)
    response.delete_cookie("ufaz_guest")
    response.set_cookie("ufaz_refresh", create_refresh_token(result.user), httponly=True, samesite="lax", secure=settings.cookie_secure)
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh(session: DbSession, ufaz_refresh: Annotated[str | None, Cookie()] = None) -> TokenResponse:
    return await refresh_access_token(session, ufaz_refresh)


@router.post("/logout", status_code=204)
async def logout(response: Response) -> Response:
    response.delete_cookie("ufaz_refresh")
    response.status_code = 204
    return response
