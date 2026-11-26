from __future__ import annotations

import secrets
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import AuthActor, get_current_actor
from ..crypto import hash_api_key
from ..database import get_db
from ..models import ApiKey
from ..schemas import ApiKeyCreateRequest, ApiKeyCreateResponse, ApiKeyOut

router = APIRouter(prefix="/api-keys", tags=["Developer API Keys"])


def _serialize_api_key(key: ApiKey) -> ApiKeyOut:
    return ApiKeyOut(
        id=key.id,
        name=key.name,
        keyPrefix=key.key_prefix,
        scopes=key.scopes or [],
        createdAt=key.created_at,
        lastUsedAt=key.last_used_at,
        expiresAt=key.expires_at,
        revokedAt=key.revoked_at,
    )


@router.get("", response_model=list[ApiKeyOut])
async def list_api_keys(
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> list[ApiKeyOut]:
    rows = (
        await db.execute(
            select(ApiKey).where(ApiKey.user_id == actor.user.id).order_by(ApiKey.created_at.desc())
        )
    ).scalars().all()
    return [_serialize_api_key(k) for k in rows]


@router.post("", response_model=ApiKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: ApiKeyCreateRequest,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyCreateResponse:
    raw_secret = f"dsc_live_{secrets.token_urlsafe(32)}"
    prefix = raw_secret[:16]
    record = ApiKey(
        user_id=actor.user.id,
        name=payload.name.strip(),
        key_prefix=prefix,
        key_hash=hash_api_key(raw_secret),
        scopes=payload.scopes,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return ApiKeyCreateResponse(
        id=record.id,
        name=record.name,
        keyPrefix=record.key_prefix,
        scopes=record.scopes or [],
        createdAt=record.created_at,
        lastUsedAt=record.last_used_at,
        expiresAt=record.expires_at,
        revokedAt=record.revoked_at,
        secret=raw_secret,
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> None:
    record = (
        await db.execute(
            select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == actor.user.id)
        )
    ).scalar_one_or_none()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "API_KEY_NOT_FOUND", "message": "API key not found"},
        )
    if record.revoked_at is None:
        record.revoked_at = datetime.now(UTC)
        await db.commit()
