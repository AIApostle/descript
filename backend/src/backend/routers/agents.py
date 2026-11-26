from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import AuthActor, get_current_actor
from ..crypto import (
    CryptoValidationError,
    parse_ed25519_public_key,
    public_key_fingerprint,
    public_key_to_base64,
    public_key_to_pem,
)
from ..database import get_db
from ..models import Agent, AuditEvent, ByteNetwork, Credential
from ..schemas import (
    AgentBulkCreateRequest,
    AgentCreateRequest,
    AgentOut,
    AgentStatusUpdateRequest,
    AgentUpdateRequest,
    AuditEventOut,
    BytecriptOut,
    CredentialCreateRequest,
    CredentialOut,
    CredentialRevokeRequest,
    CredentialStandaloneCreateRequest,
    CredentialUpdateRequest,
)
from ..services.bytecript import (
    build_bytecript,
    serialize_agent,
    serialize_audit_event,
    serialize_credential,
)

router = APIRouter(tags=["Agents & Credentials"])


async def _get_owned_agent(
    agent_id: str,
    actor: AuthActor,
    db: AsyncSession,
    *,
    with_relations: bool = True,
) -> Agent:
    stmt = select(Agent).where(Agent.id == agent_id, Agent.owner_id == actor.user.id)
    if with_relations:
        stmt = stmt.options(selectinload(Agent.credentials))
    agent = (await db.execute(stmt)).scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "AGENT_NOT_FOUND", "message": f"Agent '{agent_id}' not found"},
        )
    return agent


def _parse_key_or_400(public_key_input: str) -> tuple[str, str, str]:
    try:
        raw_bytes = parse_ed25519_public_key(public_key_input)
    except CryptoValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "INVALID_PUBLIC_KEY",
                "message": str(exc),
                "details": {
                    "field": "publicKey",
                    "expected": "base64, PEM, or OpenSSH Ed25519 public key",
                },
            },
        ) from exc
    return (
        public_key_to_base64(raw_bytes),
        public_key_to_pem(raw_bytes),
        public_key_fingerprint(raw_bytes),
    )


def _record_audit(
    db: AsyncSession,
    *,
    agent_id: str,
    actor: AuthActor,
    event_type: str,
    summary: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditEvent(
            agent_id=agent_id,
            actor_type=actor.actor_type,
            actor_id=actor.actor_id,
            event_type=event_type,
            summary=summary,
            event_metadata=metadata or {},
        )
    )


async def _apply_status_change(
    agent: Agent,
    new_status: str,
    reason: str | None,
    actor: AuthActor,
    db: AsyncSession,
) -> None:
    if agent.status == "revoked" and new_status != "revoked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "AGENT_REVOKED",
                "message": "A permanently revoked agent identity cannot be reactivated",
            },
        )
    if agent.status == new_status:
        return
    old_status = agent.status
    agent.status = new_status
    agent.bytecript_version += 1
    agent.updated_at = datetime.now(UTC)
    _record_audit(
        db,
        agent_id=agent.id,
        actor=actor,
        event_type=f"agent.{new_status}",
        summary=f"Identity status changed from {old_status} to {new_status}"
        + (f" ({reason})" if reason else ""),
        metadata={"previousStatus": old_status, "newStatus": new_status, "reason": reason},
    )


@router.get("/agents", response_model=list[AgentOut])
async def list_agents(
    status_filter: str | None = Query(default=None, alias="status"),
    network: str | None = Query(default=None, alias="byteNetwork"),
    search: str | None = Query(default=None),
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> list[AgentOut]:
    stmt = (
        select(Agent)
        .where(Agent.owner_id == actor.user.id)
        .options(selectinload(Agent.credentials))
        .order_by(Agent.created_at.desc())
    )
    if status_filter:
        stmt = stmt.where(Agent.status == status_filter)
    if network:
        stmt = stmt.where(Agent.byte_network == network)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(Agent.name.ilike(pattern) | Agent.id.ilike(pattern))

    agents = (await db.execute(stmt)).scalars().all()
    return [serialize_agent(a, owner=actor.user) for a in agents]


@router.post("/agents", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
async def create_agent(
    payload: AgentCreateRequest,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> AgentOut:
    network = (
        await db.execute(select(ByteNetwork).where(ByteNetwork.slug == payload.byteNetwork))
    ).scalar_one_or_none()
    if network is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "INVALID_NETWORK",
                "message": f"Byte Network '{payload.byteNetwork}' was not found",
            },
        )

    dup = (
        await db.execute(
            select(Agent).where(Agent.owner_id == actor.user.id, Agent.name == payload.name)
        )
    ).scalar_one_or_none()
    if dup is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "DUPLICATE_AGENT_NAME",
                "message": f"An agent named '{payload.name}' already exists in your workspace",
            },
        )

    pub_b64, pub_pem, fingerprint = _parse_key_or_400(payload.publicKey)

    agent = Agent(
        owner_id=actor.user.id,
        name=payload.name,
        description=payload.description.strip() if payload.description else None,
        byte_network=network.slug,
        residence=network.residence_domain,
        status="active",
        agent_type=payload.agentType,
        framework=payload.framework,
        capabilities=payload.capabilities,
        public_metadata=payload.publicMetadata,
        bytecript_version=1,
    )
    db.add(agent)
    await db.flush()

    cred = Credential(
        agent_id=agent.id,
        algorithm=payload.algorithm,
        public_key=pub_b64,
        public_key_pem=pub_pem,
        fingerprint=fingerprint,
        label=payload.credentialLabel or "Primary Key",
        status="active",
    )
    db.add(cred)
    await db.flush()

    _record_audit(
        db,
        agent_id=agent.id,
        actor=actor,
        event_type="agent.registered",
        summary=f"Registered agent '{agent.name}' in {network.slug} ({network.residence_domain})",
        metadata={"byteNetwork": network.slug, "residence": network.residence_domain},
    )
    _record_audit(
        db,
        agent_id=agent.id,
        actor=actor,
        event_type="credential.added",
        summary=f"Bound initial {cred.algorithm} credential ({fingerprint[:16]}...)",
        metadata={"credentialId": cred.id, "fingerprint": fingerprint, "algorithm": cred.algorithm},
    )

    await db.commit()
    loaded = await _get_owned_agent(agent.id, actor, db)
    return serialize_agent(loaded, owner=actor.user)


@router.post("/agents/bulk", response_model=list[AgentOut], status_code=status.HTTP_201_CREATED)
async def bulk_create_agents(
    payload: AgentBulkCreateRequest,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> list[AgentOut]:
    networks = {
        n.slug: n for n in (await db.execute(select(ByteNetwork))).scalars().all()
    }
    created_ids: list[str] = []

    for item in payload.agents:
        single = AgentCreateRequest(
            name=item.name,
            description=item.description,
            byteNetwork=item.byteNetwork,
            publicKey=item.publicKey,
            agentType=item.agentType,
            framework=item.framework,
            capabilities=item.capabilities,
        )
        network = networks.get(single.byteNetwork)
        if network is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "INVALID_NETWORK", "message": f"Byte Network '{single.byteNetwork}' not found"},
            )
        dup = (
            await db.execute(
                select(Agent).where(Agent.owner_id == actor.user.id, Agent.name == single.name)
            )
        ).scalar_one_or_none()
        if dup is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": "DUPLICATE_AGENT_NAME", "message": f"Duplicate agent name '{single.name}'"},
            )
        pub_b64, pub_pem, fingerprint = _parse_key_or_400(single.publicKey)
        agent = Agent(
            owner_id=actor.user.id,
            name=single.name,
            description=single.description,
            byte_network=network.slug,
            residence=network.residence_domain,
            status="active",
            agent_type=single.agentType,
            framework=single.framework,
            capabilities=single.capabilities,
            public_metadata={},
            bytecript_version=1,
        )
        db.add(agent)
        await db.flush()
        cred = Credential(
            agent_id=agent.id,
            algorithm="ed25519",
            public_key=pub_b64,
            public_key_pem=pub_pem,
            fingerprint=fingerprint,
            label="Primary Key",
            status="active",
        )
        db.add(cred)
        await db.flush()
        _record_audit(
            db,
            agent_id=agent.id,
            actor=actor,
            event_type="agent.registered",
            summary=f"Bulk-registered agent '{agent.name}' in {network.slug}",
            metadata={"byteNetwork": network.slug, "bulk": True},
        )
        created_ids.append(agent.id)

    await db.commit()
    results = []
    for aid in created_ids:
        loaded = await _get_owned_agent(aid, actor, db)
        results.append(serialize_agent(loaded, owner=actor.user))
    return results


@router.get("/agents/{agent_id}", response_model=AgentOut)
async def get_agent(
    agent_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> AgentOut:
    agent = await _get_owned_agent(agent_id, actor, db)
    return serialize_agent(agent, owner=actor.user)


@router.patch("/agents/{agent_id}", response_model=AgentOut)
async def update_agent(
    agent_id: str,
    payload: AgentUpdateRequest,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> AgentOut:
    agent = await _get_owned_agent(agent_id, actor, db)
    metadata_changed = False

    if payload.name is not None and payload.name != agent.name:
        dup = (
            await db.execute(
                select(Agent).where(
                    Agent.owner_id == actor.user.id,
                    Agent.name == payload.name,
                    Agent.id != agent.id,
                )
            )
        ).scalar_one_or_none()
        if dup is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": "DUPLICATE_AGENT_NAME", "message": f"Agent '{payload.name}' already exists"},
            )
        agent.name = payload.name
        metadata_changed = True

    if payload.description is not None:
        agent.description = payload.description.strip() or None
        metadata_changed = True
    if payload.agentType is not None:
        agent.agent_type = payload.agentType
        metadata_changed = True
    if payload.framework is not None:
        agent.framework = payload.framework
        metadata_changed = True
    if payload.capabilities is not None:
        agent.capabilities = payload.capabilities
        metadata_changed = True
    if payload.publicMetadata is not None:
        agent.public_metadata = payload.publicMetadata
        metadata_changed = True

    if metadata_changed:
        agent.bytecript_version += 1
        agent.updated_at = datetime.now(UTC)
        _record_audit(
            db,
            agent_id=agent.id,
            actor=actor,
            event_type="agent.updated",
            summary=f"Updated metadata for agent '{agent.name}'",
        )

    if payload.status is not None:
        await _apply_status_change(agent, payload.status, payload.reason, actor, db)

    await db.commit()
    loaded = await _get_owned_agent(agent.id, actor, db)
    return serialize_agent(loaded, owner=actor.user)


@router.patch("/agents/{agent_id}/status", response_model=AgentOut)
async def update_agent_status(
    agent_id: str,
    payload: AgentStatusUpdateRequest,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> AgentOut:
    agent = await _get_owned_agent(agent_id, actor, db)
    await _apply_status_change(agent, payload.status, payload.reason, actor, db)
    await db.commit()
    loaded = await _get_owned_agent(agent.id, actor, db)
    return serialize_agent(loaded, owner=actor.user)


@router.delete("/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> None:
    agent = await _get_owned_agent(agent_id, actor, db, with_relations=False)
    await db.delete(agent)
    await db.commit()


@router.get("/agents/{agent_id}/bytecript", response_model=BytecriptOut)
async def get_agent_bytecript(
    agent_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> BytecriptOut:
    agent = await _get_owned_agent(agent_id, actor, db)
    return build_bytecript(agent, owner=actor.user)


@router.get("/agents/{agent_id}/audit", response_model=list[AuditEventOut])
async def get_agent_audit(
    agent_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> list[AuditEventOut]:
    await _get_owned_agent(agent_id, actor, db, with_relations=False)
    events = (
        await db.execute(
            select(AuditEvent)
            .where(AuditEvent.agent_id == agent_id)
            .order_by(AuditEvent.created_at.desc())
        )
    ).scalars().all()
    return [serialize_audit_event(e) for e in events]


@router.get("/agents/{agent_id}/credentials", response_model=list[CredentialOut])
async def list_credentials(
    agent_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> list[CredentialOut]:
    agent = await _get_owned_agent(agent_id, actor, db)
    return [serialize_credential(c) for c in agent.credentials]


async def _add_credential_for_agent(
    agent: Agent,
    payload: CredentialCreateRequest,
    actor: AuthActor,
    db: AsyncSession,
) -> CredentialOut:
    if agent.status == "revoked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "AGENT_REVOKED", "message": "Cannot add credentials to a revoked agent"},
        )

    pub_b64, pub_pem, fingerprint = _parse_key_or_400(payload.publicKey)

    existing_same = [c for c in agent.credentials if c.fingerprint == fingerprint and c.status != "revoked"]
    if existing_same:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "DUPLICATE_CREDENTIAL", "message": "This public key is already bound to the agent"},
        )

    rotated_ids: list[str] = []
    if payload.deactivateExisting:
        for existing in agent.credentials:
            if existing.status == "active":
                existing.status = "inactive"
                rotated_ids.append(existing.id)

    cred = Credential(
        agent_id=agent.id,
        algorithm=payload.algorithm,
        public_key=pub_b64,
        public_key_pem=pub_pem,
        fingerprint=fingerprint,
        label=payload.label or ("Rotated Key" if payload.deactivateExisting else "Additional Key"),
        status="active",
        expires_at=payload.expiresAt,
    )
    db.add(cred)
    await db.flush()

    agent.bytecript_version += 1
    agent.updated_at = datetime.now(UTC)

    event_type = "credential.rotated" if payload.deactivateExisting else "credential.added"
    summary = (
        f"Rotated credential to {fingerprint[:16]}... (deactivated {len(rotated_ids)} prior active key(s))"
        if payload.deactivateExisting
        else f"Added {cred.algorithm} credential ({fingerprint[:16]}...)"
    )
    _record_audit(
        db,
        agent_id=agent.id,
        actor=actor,
        event_type=event_type,
        summary=summary,
        metadata={"credentialId": cred.id, "fingerprint": fingerprint, "deactivatedIds": rotated_ids},
    )

    await db.commit()
    await db.refresh(cred)
    return serialize_credential(cred)


@router.post("/agents/{agent_id}/credentials", response_model=CredentialOut, status_code=status.HTTP_201_CREATED)
async def add_credential(
    agent_id: str,
    payload: CredentialCreateRequest,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> CredentialOut:
    agent = await _get_owned_agent(agent_id, actor, db)
    return await _add_credential_for_agent(agent, payload, actor, db)


@router.post("/credentials", response_model=CredentialOut, status_code=status.HTTP_201_CREATED)
async def add_credential_standalone(
    payload: CredentialStandaloneCreateRequest,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> CredentialOut:
    agent = await _get_owned_agent(payload.agentId, actor, db)
    return await _add_credential_for_agent(agent, payload, actor, db)


@router.patch("/agents/{agent_id}/credentials/{cred_id}", response_model=CredentialOut)
async def update_credential(
    agent_id: str,
    cred_id: str,
    payload: CredentialUpdateRequest,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> CredentialOut:
    agent = await _get_owned_agent(agent_id, actor, db)
    cred = next((c for c in agent.credentials if c.id == cred_id), None)
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "CREDENTIAL_NOT_FOUND", "message": "Credential not found"},
        )
    if cred.status == "revoked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "CREDENTIAL_REVOKED", "message": "Revoked credentials cannot be modified"},
        )

    old_status = cred.status
    cred.status = payload.status
    if payload.label is not None:
        cred.label = payload.label

    if old_status != payload.status:
        agent.bytecript_version += 1
        agent.updated_at = datetime.now(UTC)
        _record_audit(
            db,
            agent_id=agent.id,
            actor=actor,
            event_type="credential.deactivated" if payload.status == "inactive" else "credential.reactivated",
            summary=f"Credential {cred.fingerprint[:16]}... marked {payload.status}",
            metadata={"credentialId": cred.id, "previousStatus": old_status, "newStatus": payload.status},
        )

    await db.commit()
    await db.refresh(cred)
    return serialize_credential(cred)


async def _revoke_credential_record(
    agent: Agent,
    cred: Credential,
    reason: str | None,
    actor: AuthActor,
    db: AsyncSession,
) -> CredentialOut:
    if cred.status != "revoked":
        cred.status = "revoked"
        cred.revoked_at = datetime.now(UTC)
        cred.revocation_reason = reason
        agent.bytecript_version += 1
        agent.updated_at = datetime.now(UTC)
        _record_audit(
            db,
            agent_id=agent.id,
            actor=actor,
            event_type="credential.revoked",
            summary=f"Revoked credential {cred.fingerprint[:16]}..."
            + (f" ({reason})" if reason else ""),
            metadata={"credentialId": cred.id, "fingerprint": cred.fingerprint, "reason": reason},
        )
        await db.commit()
        await db.refresh(cred)
    return serialize_credential(cred)


@router.delete("/agents/{agent_id}/credentials/{cred_id}", response_model=CredentialOut)
async def revoke_credential_delete(
    agent_id: str,
    cred_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> CredentialOut:
    agent = await _get_owned_agent(agent_id, actor, db)
    cred = next((c for c in agent.credentials if c.id == cred_id), None)
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "CREDENTIAL_NOT_FOUND", "message": "Credential not found"},
        )
    return await _revoke_credential_record(agent, cred, "Revoked by controller", actor, db)


@router.post("/agents/{agent_id}/credentials/{cred_id}/revoke", response_model=CredentialOut)
async def revoke_agent_credential(
    agent_id: str,
    cred_id: str,
    payload: CredentialRevokeRequest | None = None,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> CredentialOut:
    agent = await _get_owned_agent(agent_id, actor, db)
    cred = next((c for c in agent.credentials if c.id == cred_id), None)
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "CREDENTIAL_NOT_FOUND", "message": "Credential not found"},
        )
    reason = payload.reason if payload else None
    return await _revoke_credential_record(agent, cred, reason, actor, db)


@router.post("/credentials/{cred_id}/revoke", response_model=CredentialOut)
async def revoke_credential_by_id(
    cred_id: str,
    payload: CredentialRevokeRequest | None = None,
    actor: AuthActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> CredentialOut:
    cred = (
        await db.execute(
            select(Credential)
            .join(Agent, Credential.agent_id == Agent.id)
            .where(Credential.id == cred_id, Agent.owner_id == actor.user.id)
        )
    ).scalar_one_or_none()
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "CREDENTIAL_NOT_FOUND", "message": "Credential not found"},
        )
    agent = await _get_owned_agent(cred.agent_id, actor, db)
    reason = payload.reason if payload else None
    return await _revoke_credential_record(agent, cred, reason, actor, db)
