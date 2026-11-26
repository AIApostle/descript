from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..crypto import (
    parse_ed25519_public_key,
    verify_bytecript_signature,
    verify_ed25519_signature,
)
from ..database import get_db
from ..models import Agent, AuditEvent, AuthChallenge
from ..schemas import (
    BytecriptVerifyRequest,
    BytecriptVerifyResultOut,
    ChallengeCreateRequest,
    ChallengeOut,
    ChallengeVerifyRequest,
    IssuerInfoOut,
    MessageVerifyRequest,
    PublicAgentOut,
    VerificationResultOut,
)
from ..services.bytecript import get_issuer_info, serialize_public_agent

router = APIRouter(tags=["Verification & Public Identity"])


async def _load_public_agent(agent_id: str, db: AsyncSession) -> Agent | None:
    stmt = (
        select(Agent)
        .where(Agent.id == agent_id)
        .options(selectinload(Agent.credentials), selectinload(Agent.owner))
    )
    return (await db.execute(stmt)).scalar_one_or_none()


@router.get("/issuer", response_model=IssuerInfoOut)
async def issuer_info() -> IssuerInfoOut:
    return get_issuer_info()


@router.get("/public/agents/{agent_id}", response_model=PublicAgentOut)
async def get_public_agent(agent_id: str, db: AsyncSession = Depends(get_db)) -> PublicAgentOut:
    agent = await _load_public_agent(agent_id, db)
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "AGENT_NOT_FOUND", "message": f"Agent '{agent_id}' not found"},
        )
    return serialize_public_agent(agent, owner=agent.owner)


@router.post("/challenges", response_model=ChallengeOut, status_code=status.HTTP_201_CREATED)
async def create_challenge(
    payload: ChallengeCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> ChallengeOut:
    agent = await _load_public_agent(payload.agentId, db)
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "AGENT_NOT_FOUND", "message": f"Agent '{payload.agentId}' not found"},
        )
    if agent.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "AGENT_NOT_ACTIVE",
                "message": f"Cannot issue auth challenge: agent status is '{agent.status}'",
            },
        )

    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=5)
    nonce = f"dsc_chg_{secrets.token_urlsafe(32)}"
    challenge = AuthChallenge(
        agent_id=agent.id,
        nonce=nonce,
        audience=payload.audience,
        expires_at=expires_at,
    )
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)

    return ChallengeOut(
        challengeId=challenge.id,
        agentId=agent.id,
        nonce=challenge.nonce,
        audience=challenge.audience,
        expiresAt=challenge.expires_at,
    )


def _match_active_credential(agent: Agent, message: bytes, signature: str):
    now = datetime.now(UTC)
    for cred in agent.credentials:
        if cred.status != "active":
            continue
        if cred.expires_at is not None:
            exp = cred.expires_at if cred.expires_at.tzinfo else cred.expires_at.replace(tzinfo=UTC)
            if exp < now:
                continue
        raw_pub = parse_ed25519_public_key(cred.public_key)
        if verify_ed25519_signature(raw_pub, message, signature):
            return cred
    return None


@router.post("/challenges/verify", response_model=VerificationResultOut)
async def verify_challenge(
    payload: ChallengeVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> VerificationResultOut:
    now = datetime.now(UTC)
    agent = await _load_public_agent(payload.agentId, db)
    if agent is None:
        return VerificationResultOut(
            verified=False,
            agentId=payload.agentId,
            reason="Agent not found",
            verifiedAt=now,
        )

    if agent.status != "active":
        return VerificationResultOut(
            verified=False,
            agentId=agent.id,
            agentName=agent.name,
            status=agent.status,
            byteNetwork=agent.byte_network,
            reason=f"Agent identity is '{agent.status}' and cannot authenticate",
            verifiedAt=now,
        )

    stmt = select(AuthChallenge).where(AuthChallenge.agent_id == agent.id)
    if payload.challengeId:
        stmt = stmt.where(AuthChallenge.id == payload.challengeId)
    elif payload.nonce:
        stmt = stmt.where(AuthChallenge.nonce == payload.nonce)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "MISSING_CHALLENGE", "message": "Provide either challengeId or nonce"},
        )

    challenge = (await db.execute(stmt)).scalar_one_or_none()
    if challenge is None:
        return VerificationResultOut(
            verified=False,
            agentId=agent.id,
            agentName=agent.name,
            status=agent.status,
            byteNetwork=agent.byte_network,
            reason="Challenge not found for this agent",
            verifiedAt=now,
        )
    if challenge.used_at is not None:
        return VerificationResultOut(
            verified=False,
            agentId=agent.id,
            agentName=agent.name,
            status=agent.status,
            byteNetwork=agent.byte_network,
            reason="Challenge nonce has already been consumed",
            verifiedAt=now,
        )
    exp = challenge.expires_at if challenge.expires_at.tzinfo else challenge.expires_at.replace(tzinfo=UTC)
    if exp < now:
        return VerificationResultOut(
            verified=False,
            agentId=agent.id,
            agentName=agent.name,
            status=agent.status,
            byteNetwork=agent.byte_network,
            reason="Challenge has expired",
            verifiedAt=now,
        )

    matched = _match_active_credential(agent, challenge.nonce.encode("utf-8"), payload.signature)
    if matched is None:
        return VerificationResultOut(
            verified=False,
            agentId=agent.id,
            agentName=agent.name,
            status=agent.status,
            byteNetwork=agent.byte_network,
            reason="Signature does not match any active credential for this agent",
            verifiedAt=now,
        )

    challenge.used_at = now
    db.add(
        AuditEvent(
            agent_id=agent.id,
            actor_type="agent",
            actor_id=agent.id,
            event_type="challenge.verified",
            summary=f"Verified challenge-response authentication for audience '{challenge.audience or 'default'}'",
            event_metadata={
                "challengeId": challenge.id,
                "credentialId": matched.id,
                "audience": challenge.audience,
            },
        )
    )
    await db.commit()

    return VerificationResultOut(
        verified=True,
        agentId=agent.id,
        agentName=agent.name,
        status=agent.status,
        credentialId=matched.id,
        fingerprint=matched.fingerprint,
        byteNetwork=agent.byte_network,
        verifiedAt=now,
    )


@router.post("/verify", response_model=VerificationResultOut)
async def verify_message_signature(
    payload: MessageVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> VerificationResultOut:
    now = datetime.now(UTC)
    agent = await _load_public_agent(payload.agentId, db)
    if agent is None:
        return VerificationResultOut(
            verified=False,
            agentId=payload.agentId,
            reason="Agent not found",
            verifiedAt=now,
        )

    if agent.status != "active":
        return VerificationResultOut(
            verified=False,
            agentId=agent.id,
            agentName=agent.name,
            status=agent.status,
            byteNetwork=agent.byte_network,
            reason=f"Agent identity is '{agent.status}' and cannot authenticate",
            verifiedAt=now,
        )

    matched = _match_active_credential(agent, payload.message.encode("utf-8"), payload.signature)
    if matched is None:
        return VerificationResultOut(
            verified=False,
            agentId=agent.id,
            agentName=agent.name,
            status=agent.status,
            byteNetwork=agent.byte_network,
            reason="Signature verification failed against active credentials",
            verifiedAt=now,
        )

    return VerificationResultOut(
        verified=True,
        agentId=agent.id,
        agentName=agent.name,
        status=agent.status,
        credentialId=matched.id,
        fingerprint=matched.fingerprint,
        byteNetwork=agent.byte_network,
        verifiedAt=now,
    )


@router.post("/verify/bytecript", response_model=BytecriptVerifyResultOut)
async def verify_bytecript(
    payload: BytecriptVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> BytecriptVerifyResultOut:
    now = datetime.now(UTC)
    issuer = get_issuer_info()
    sig_valid = verify_bytecript_signature(payload.bytecript, issuer.publicKey)
    agent_id = payload.bytecript.get("agentId")

    live_status: str | None = None
    reason: str | None = None

    if not sig_valid:
        reason = "Bytecript issuer signature is invalid or tampered"

    if payload.checkLiveStatus and isinstance(agent_id, str) and agent_id:
        agent = await _load_public_agent(agent_id, db)
        if agent is None:
            live_status = "unknown"
            if sig_valid:
                reason = "Signature valid, but agent ID was not found in directory"
            return BytecriptVerifyResultOut(
                verified=False,
                signatureValid=sig_valid,
                liveStatus=live_status,
                agentId=agent_id,
                reason=reason,
                verifiedAt=now,
            )
        live_status = agent.status
        if agent.status != "active":
            return BytecriptVerifyResultOut(
                verified=False,
                signatureValid=sig_valid,
                liveStatus=live_status,
                agentId=agent_id,
                reason=f"Agent live status is '{agent.status}'",
                verifiedAt=now,
            )

    return BytecriptVerifyResultOut(
        verified=sig_valid,
        signatureValid=sig_valid,
        liveStatus=live_status,
        agentId=agent_id if isinstance(agent_id, str) else None,
        reason=reason,
        verifiedAt=now,
    )
