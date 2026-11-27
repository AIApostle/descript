from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import AuthActor, get_current_actor
from ..crypto import parse_ed25519_public_key, verify_ed25519_signature
from ..database import get_db
from ..models import Agent, Credential, Netprint, User
from ..schemas import NetprintCreateRequest, NetprintOut

router = APIRouter(prefix="/netprints", tags=["Descript Netprints (Agent Footprints)"])


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def _match_active_credential(agent: Agent, message: bytes, signature: str) -> Credential | None:
    now = datetime.now(UTC)
    for cred in agent.credentials:
        if cred.status != "active":
            continue
        if cred.expires_at is not None:
            exp = _ensure_utc(cred.expires_at)
            if exp < now:
                continue
        try:
            raw_pub = parse_ed25519_public_key(cred.public_key)
            if verify_ed25519_signature(raw_pub, message, signature):
                return cred
        except Exception:
            continue
    return None


@router.post("", response_model=NetprintOut, status_code=status.HTTP_201_CREATED)
async def record_netprint(
    payload: NetprintCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> NetprintOut:
    """
    Record an agent's footprint/activity across a platform.
    Can be submitted directly by the agent (with signature) or by a registered platform.
    """
    stmt = (
        select(Agent)
        .where(Agent.id == payload.agentId)
        .options(selectinload(Agent.credentials), selectinload(Agent.owner))
    )
    agent = (await db.execute(stmt)).scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "AGENT_NOT_FOUND", "message": f"Agent '{payload.agentId}' not found"},
        )

    # If signature is provided, verify it proves the agent authorized this action
    if payload.signature:
        canonical = f"netprint:{payload.agentId}:{payload.platformDomain}:{payload.action}"
        matched = _match_active_credential(agent, canonical.encode("utf-8"), payload.signature)
        if not matched:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "INVALID_SIGNATURE", "message": "Agent signature verification failed for netprint"},
            )

    netprint = Netprint(
        agent_id=payload.agentId,
        platform_name=payload.platformName,
        platform_domain=payload.platformDomain,
        action=payload.action,
        resource=payload.resource,
        status=payload.status,
        security_level=payload.securityLevel,
        ip_address=payload.ipAddress,
        payload=payload.payload,
    )
    db.add(netprint)
    await db.commit()
    await db.refresh(netprint)

    return NetprintOut(
        id=netprint.id,
        agentId=netprint.agent_id,
        agentName=agent.name,
        platformName=netprint.platform_name,
        platformDomain=netprint.platform_domain,
        action=netprint.action,
        resource=netprint.resource,
        status=netprint.status,
        securityLevel=netprint.security_level,
        ipAddress=netprint.ip_address,
        payload=netprint.payload,
        createdAt=netprint.created_at,
    )


@router.get("", response_model=list[NetprintOut])
async def list_netprints(
    agent_id: str | None = Query(default=None, alias="agentId"),
    platform_domain: str | None = Query(default=None, alias="platformDomain"),
    limit: int = Query(default=50, ge=1, le=200),
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> list[NetprintOut]:
    """List netprints for human dashboard or agent inspection."""
    stmt = (
        select(Netprint)
        .join(Agent, Agent.id == Netprint.agent_id)
        .where(Agent.owner_id == actor.user.id)
        .options(selectinload(Netprint.agent))
        .order_by(Netprint.created_at.desc())
        .limit(limit)
    )
    if agent_id:
        stmt = stmt.where(Netprint.agent_id == agent_id)
    if platform_domain:
        stmt = stmt.where(Netprint.platform_domain == platform_domain)

    rows = (await db.execute(stmt)).scalars().all()
    return [
        NetprintOut(
            id=r.id,
            agentId=r.agent_id,
            agentName=r.agent.name if r.agent else None,
            platformName=r.platform_name,
            platformDomain=r.platform_domain,
            action=r.action,
            resource=r.resource,
            status=r.status,
            securityLevel=r.security_level,
            ipAddress=r.ip_address,
            payload=r.payload,
            createdAt=r.created_at,
        )
        for r in rows
    ]
