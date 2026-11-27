from __future__ import annotations

import asyncio
import json
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.responses import StreamingResponse

from ..crypto import parse_ed25519_public_key, verify_ed25519_signature
from ..database import get_db, get_session_factory
from ..models import Agent, AuditEvent, Credential, PlatformAuthSession
from ..schemas import (
    AgentClaimCodeRequest,
    AgentClaimCodeResponse,
    AuthenticatedAgentOut,
    PlatformCodeExchangeRequest,
    PlatformCodeExchangeResponse,
    PlatformCodeRequest,
    PlatformCodeResponse,
    PlatformPendingSessionOut,
)

router = APIRouter(prefix="/auth/platform", tags=["Descript Platform Auth (Agent OTP)"])


def _generate_user_code() -> str:
    # 6-digit grouped code like DSC-748-912
    part1 = secrets.randbelow(900) + 100
    part2 = secrets.randbelow(900) + 100
    return f"DSC-{part1}-{part2}"


async def _load_agent_with_credentials(agent_id: str, db: AsyncSession) -> Agent | None:
    stmt = (
        select(Agent)
        .where(Agent.id == agent_id)
        .options(selectinload(Agent.credentials), selectinload(Agent.owner))
    )
    return (await db.execute(stmt)).scalar_one_or_none()


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


@router.post("/code/request", response_model=PlatformCodeResponse, status_code=status.HTTP_201_CREATED)
async def request_platform_code(
    payload: PlatformCodeRequest,
    db: AsyncSession = Depends(get_db),
) -> PlatformCodeResponse:
    """External platforms request an OTP verification code for an agent or network."""
    user_code = _generate_user_code()
    now = datetime.now(UTC)
    expires_at = now + timedelta(seconds=payload.expiresInSeconds)

    # Determine byte_network
    byte_network = payload.byteNetwork
    if payload.agentId and not byte_network:
        agent = await _load_agent_with_credentials(payload.agentId, db)
        if agent:
            byte_network = agent.byte_network

    auth_session = PlatformAuthSession(
        user_code=user_code,
        platform_name=payload.platformName,
        platform_domain=payload.platformDomain,
        requested_scopes=payload.requestedScopes,
        agent_id=payload.agentId,
        byte_network=byte_network,
        status="pending",
        expires_at=expires_at,
    )
    db.add(auth_session)
    await db.commit()
    await db.refresh(auth_session)

    return PlatformCodeResponse(
        authSessionId=auth_session.id,
        userCode=auth_session.user_code,
        platformName=auth_session.platform_name,
        platformDomain=auth_session.platform_domain,
        requestedScopes=auth_session.requested_scopes,
        byteNetwork=auth_session.byte_network,
        verificationUri=f"https://descript-ffch.onrender.com/verify/code?code={auth_session.user_code}",
        expiresAt=auth_session.expires_at,
        pollInterval=2,
    )


@router.get("/pending", response_model=list[PlatformPendingSessionOut])
async def list_pending_requests(
    agent_id: str | None = None,
    byte_network: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[PlatformPendingSessionOut]:
    """List active, unclaimed verification requests for an agent or byte network."""
    now = datetime.now(UTC)
    stmt = (
        select(PlatformAuthSession)
        .where(
            PlatformAuthSession.status == "pending",
            PlatformAuthSession.expires_at > now,
        )
        .order_by(PlatformAuthSession.created_at.desc())
    )
    if agent_id:
        stmt = stmt.where(
            (PlatformAuthSession.agent_id == agent_id) | (PlatformAuthSession.agent_id.is_(None))
        )
    if byte_network:
        stmt = stmt.where(
            (PlatformAuthSession.byte_network == byte_network) | (PlatformAuthSession.byte_network.is_(None))
        )

    rows = (await db.execute(stmt)).scalars().all()
    return [
        PlatformPendingSessionOut(
            authSessionId=r.id,
            userCode=r.user_code,
            platformName=r.platform_name,
            platformDomain=r.platform_domain,
            requestedScopes=r.requested_scopes,
            byteNetwork=r.byte_network,
            agentId=r.agent_id,
            status=r.status,
            expiresAt=r.expires_at,
            createdAt=r.created_at,
        )
        for r in rows
    ]


@router.get("/stream")
async def stream_pending_requests(
    agent_id: str | None = None,
    byte_network: str | None = None,
) -> StreamingResponse:
    """Real-time SSE stream enabling agents or dashboards to receive verification codes as they arrive."""
    async def event_generator():
        seen_session_ids = set()
        session_factory = get_session_factory()
        for _ in range(300):  # Maximum stream duration ~10 minutes
            now = datetime.now(UTC)
            async with session_factory() as session:
                stmt = select(PlatformAuthSession).where(
                    PlatformAuthSession.status == "pending",
                    PlatformAuthSession.expires_at > now,
                )
                if agent_id:
                    stmt = stmt.where(
                        (PlatformAuthSession.agent_id == agent_id) | (PlatformAuthSession.agent_id.is_(None))
                    )
                if byte_network:
                    stmt = stmt.where(
                        (PlatformAuthSession.byte_network == byte_network) | (PlatformAuthSession.byte_network.is_(None))
                    )

                sessions = (await session.execute(stmt)).scalars().all()
                for s in sessions:
                    if s.id not in seen_session_ids:
                        seen_session_ids.add(s.id)
                        data = {
                            "authSessionId": s.id,
                            "userCode": s.user_code,
                            "platformName": s.platform_name,
                            "platformDomain": s.platform_domain,
                            "requestedScopes": s.requested_scopes,
                            "byteNetwork": s.byte_network,
                            "agentId": s.agent_id,
                            "expiresAt": s.expires_at.isoformat(),
                        }
                        yield f"event: auth_request\ndata: {json.dumps(data)}\n\n"

            yield ": ping\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/code/{user_code}")
async def get_code_details(
    user_code: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Inspect a verification code to display platform name and requested scopes."""
    stmt = select(PlatformAuthSession).where(PlatformAuthSession.user_code == user_code)
    auth_session = (await db.execute(stmt)).scalar_one_or_none()
    if auth_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "INVALID_CODE", "message": "Verification code not found or expired"},
        )

    now = datetime.now(UTC)
    is_expired = _ensure_utc(auth_session.expires_at) < now
    return {
        "authSessionId": auth_session.id,
        "userCode": auth_session.user_code,
        "platformName": auth_session.platform_name,
        "platformDomain": auth_session.platform_domain,
        "requestedScopes": auth_session.requested_scopes,
        "byteNetwork": auth_session.byte_network,
        "status": "expired" if is_expired else auth_session.status,
        "expiresAt": auth_session.expires_at,
    }


@router.post("/code/claim", response_model=AgentClaimCodeResponse)
async def claim_platform_code(
    payload: AgentClaimCodeRequest,
    db: AsyncSession = Depends(get_db),
) -> AgentClaimCodeResponse:
    """An AI agent proves ownership by signing the OTP user_code with its Ed25519 key."""
    stmt = select(PlatformAuthSession).where(PlatformAuthSession.user_code == payload.userCode)
    auth_session = (await db.execute(stmt)).scalar_one_or_none()
    if auth_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "CODE_NOT_FOUND", "message": "Verification code does not exist"},
        )

    now = datetime.now(UTC)
    if _ensure_utc(auth_session.expires_at) < now or auth_session.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "CODE_EXPIRED", "message": f"Verification code is {auth_session.status}"},
        )

    # Load agent
    agent = await _load_agent_with_credentials(payload.agentId, db)
    if agent is None or agent.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "AGENT_INACTIVE", "message": "Agent not found or inactive"},
        )

    # If auth_session is network-scoped, verify agent belongs to this network
    if auth_session.byte_network and auth_session.byte_network != agent.byte_network:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "NETWORK_MISMATCH",
                "message": f"Code requested for network '{auth_session.byte_network}' but agent belongs to '{agent.byte_network}'",
            },
        )

    # Verify cryptographic signature of the user_code
    message = payload.userCode.encode("utf-8")
    matched_cred = _match_active_credential(agent, message, payload.signature)
    if matched_cred is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_SIGNATURE", "message": "Signature does not match active agent key"},
        )

    # Issue platform access token
    access_token = f"dat_{secrets.token_urlsafe(36)}"
    auth_session.agent_id = agent.id
    auth_session.byte_network = agent.byte_network
    auth_session.controller_id = agent.owner_id
    auth_session.credential_id = matched_cred.id
    auth_session.access_token = access_token
    auth_session.status = "approved"
    auth_session.claimed_at = now

    # Audit log
    db.add(
        AuditEvent(
            agent_id=agent.id,
            actor_type="agent",
            actor_id=agent.id,
            event_type="platform.authorized",
            summary=f"Agent authorized '{auth_session.platform_name}' ({auth_session.platform_domain}) on {agent.byte_network} via Descript Auth OTP",
            event_metadata={
                "authSessionId": auth_session.id,
                "platform": auth_session.platform_name,
                "domain": auth_session.platform_domain,
                "scopes": auth_session.requested_scopes,
                "byteNetwork": agent.byte_network,
            },
        )
    )
    await db.commit()

    return AgentClaimCodeResponse(
        claimed=True,
        authSessionId=auth_session.id,
        agentId=agent.id,
        agentName=agent.name,
        status="approved",
        message=f"Successfully authenticated with {auth_session.platform_name}",
    )


@router.post("/code/exchange", response_model=PlatformCodeExchangeResponse)
async def exchange_platform_code(
    payload: PlatformCodeExchangeRequest,
    db: AsyncSession = Depends(get_db),
) -> PlatformCodeExchangeResponse:
    """External platform exchanges session ID + user code for the verified agent token."""
    stmt = (
        select(PlatformAuthSession)
        .where(
            PlatformAuthSession.id == payload.authSessionId,
            PlatformAuthSession.user_code == payload.userCode,
        )
    )
    auth_session = (await db.execute(stmt)).scalar_one_or_none()
    if auth_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "SESSION_NOT_FOUND", "message": "Auth session not found"},
        )

    now = datetime.now(UTC)
    if auth_session.status == "pending" and _ensure_utc(auth_session.expires_at) < now:
        auth_session.status = "expired"
        await db.commit()

    if auth_session.status != "approved" or not auth_session.agent_id:
        return PlatformCodeExchangeResponse(status=auth_session.status)

    agent = await _load_agent_with_credentials(auth_session.agent_id, db)
    if agent is None or agent.status != "active":
        return PlatformCodeExchangeResponse(status="revoked")

    cred = next((c for c in agent.credentials if c.id == auth_session.credential_id), None)
    fingerprint = cred.fingerprint if cred else "unknown"

    return PlatformCodeExchangeResponse(
        status="approved",
        agent=AuthenticatedAgentOut(
            id=agent.id,
            name=agent.name,
            byteNetwork=agent.byte_network,
            residence=agent.residence,
            status=agent.status,
            fingerprint=fingerprint,
            controllerOrg=agent.owner.organization if agent.owner else None,
        ),
        grantedScopes=auth_session.requested_scopes,
        accessToken=auth_session.access_token,
        expiresAt=auth_session.expires_at,
    )


@router.post("/token/verify")
async def verify_platform_token(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Third-party platform middleware calls this to verify an incoming Descript Agent Token."""
    stmt = select(PlatformAuthSession).where(PlatformAuthSession.access_token == token)
    auth_session = (await db.execute(stmt)).scalar_one_or_none()
    if auth_session is None or auth_session.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_TOKEN", "message": "Descript Agent Token is invalid or revoked"},
        )

    now = datetime.now(UTC)
    if _ensure_utc(auth_session.expires_at) < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "TOKEN_EXPIRED", "message": "Descript Agent Token has expired"},
        )

    agent = await _load_agent_with_credentials(auth_session.agent_id, db)
    if agent is None or agent.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "AGENT_REVOKED", "message": "Agent has been suspended or revoked by controller"},
        )

    return {
        "valid": True,
        "platformDomain": auth_session.platform_domain,
        "scopes": auth_session.requested_scopes,
        "byteNetwork": auth_session.byte_network,
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "byteNetwork": agent.byte_network,
            "status": agent.status,
            "controller": agent.owner.organization if agent.owner else None,
        },
    }
