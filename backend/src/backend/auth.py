from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .crypto import hash_api_key
from .database import get_db
from .models import ApiKey, User

bearer_scheme = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


@dataclass
class AuthActor:
    user: User
    actor_type: str  # "user" | "api_key"
    actor_id: str


def create_access_token(user_id: str, email: str) -> tuple[str, int]:
    settings = get_settings()
    now = datetime.now(UTC)
    exp = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, int(exp.timestamp())


def create_refresh_token(user_id: str, email: str) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    exp = now + timedelta(days=settings.refresh_token_expire_days)
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str, expected_type: str = "access") -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "TOKEN_EXPIRED", "message": "Authentication token has expired"},
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_TOKEN", "message": "Invalid authentication token"},
        ) from exc

    if payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_TOKEN_TYPE", "message": f"Expected {expected_type} token"},
        )
    return payload


async def _authenticate_api_key(token: str, db: AsyncSession) -> AuthActor:
    hashed = hash_api_key(token)
    result = await db.execute(select(ApiKey).where(ApiKey.key_hash == hashed))
    api_key = result.scalar_one_or_none()
    if api_key is None or api_key.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_API_KEY", "message": "API key is invalid or revoked"},
        )
    now = datetime.now(UTC)
    if api_key.expires_at is not None and api_key.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "API_KEY_EXPIRED", "message": "API key has expired"},
        )
    user_result = await db.execute(select(User).where(User.id == api_key.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "USER_NOT_FOUND", "message": "API key owner no longer exists"},
        )
    api_key.last_used_at = now
    await db.commit()
    return AuthActor(user=user, actor_type="api_key", actor_id=api_key.id)


async def get_current_actor(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
    x_api_key: str | None = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> AuthActor:
    if x_api_key:
        return await _authenticate_api_key(x_api_key.strip(), db)

    if credentials is not None and credentials.credentials:
        token = credentials.credentials.strip()
        if token.startswith("dsc_"):
            return await _authenticate_api_key(token, db)
        payload = decode_token(token, expected_type="access")
        user_id = payload.get("sub")
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "USER_NOT_FOUND", "message": "User not found"},
            )
        return AuthActor(user=user, actor_type="user", actor_id=user.id)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": "UNAUTHORIZED", "message": "Missing authentication credentials"},
    )


async def get_current_user(actor: AuthActor = Depends(get_current_actor)) -> User:
    return actor.user
