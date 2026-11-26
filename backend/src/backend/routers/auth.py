from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from ..crypto import hash_password, verify_password
from ..database import get_db
from ..models import User
from ..schemas import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    UserOut,
    UserUpdateRequest,
)
from ..services.bytecript import serialize_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    existing = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "EMAIL_EXISTS", "message": "An account with this email already exists"},
        )

    now = datetime.now(UTC)
    user = User(
        email=payload.email,
        name=payload.name.strip() if payload.name else None,
        organization=payload.organization.strip() if payload.organization else None,
        password_hash=hash_password(payload.password),
        role="user",
        email_verified=True,
        last_login_at=now,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token, expires_at = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id, user.email)
    return AuthResponse(
        user=serialize_user(user),
        token=token,
        refreshToken=refresh_token,
        expiresAt=expires_at,
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    user = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_CREDENTIALS", "message": "Invalid email or password"},
        )

    user.last_login_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(user)

    token, expires_at = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id, user.email)
    return AuthResponse(
        user=serialize_user(user),
        token=token,
        refreshToken=refresh_token,
        expiresAt=expires_at,
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    claims = decode_token(payload.refreshToken, expected_type="refresh")
    user_id = claims.get("sub")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "USER_NOT_FOUND", "message": "User not found"},
        )

    token, expires_at = create_access_token(user.id, user.email)
    new_refresh = create_refresh_token(user.id, user.email)
    return AuthResponse(
        user=serialize_user(user),
        token=token,
        refreshToken=new_refresh,
        expiresAt=expires_at,
    )


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return serialize_user(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if payload.name is not None:
        current_user.name = payload.name.strip() or None
    if payload.organization is not None:
        current_user.organization = payload.organization.strip() or None
    await db.commit()
    await db.refresh(current_user)
    return serialize_user(current_user)
