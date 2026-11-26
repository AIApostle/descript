from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from ..config import get_settings
from ..crypto import (
    get_issuer_public_key_bytes,
    public_key_fingerprint,
    public_key_to_base64,
    public_key_to_pem,
    sign_bytecript_payload,
)
from ..models import Agent, AuditEvent, Credential, User
from ..schemas import (
    AgentOut,
    AuditEventOut,
    BytecriptCredentialClaim,
    BytecriptOut,
    CredentialOut,
    IssuerInfoOut,
    PublicAgentOut,
    UserOut,
)


def _iso_utc(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def get_issuer_info() -> IssuerInfoOut:
    settings = get_settings()
    pub_bytes = get_issuer_public_key_bytes(settings.resolved_issuer_seed())
    return IssuerInfoOut(
        issuer="Descript Identity Authority",
        algorithm="ed25519",
        publicKey=public_key_to_base64(pub_bytes),
        publicKeyPem=public_key_to_pem(pub_bytes),
        fingerprint=public_key_fingerprint(pub_bytes),
    )


def build_bytecript(agent: Agent, owner: User | None = None) -> BytecriptOut:
    settings = get_settings()
    issuer_seed = settings.resolved_issuer_seed()
    issuer_pub_b64 = public_key_to_base64(get_issuer_public_key_bytes(issuer_seed))

    active_creds = sorted(
        [c for c in agent.credentials if c.status == "active"],
        key=lambda c: (c.created_at, c.id),
    )
    cred_claims = [
        {
            "id": c.id,
            "algorithm": c.algorithm,
            "publicKeyFingerprint": c.fingerprint,
            "publicKey": c.public_key,
        }
        for c in active_creds
    ]

    issued_at = _iso_utc(agent.updated_at or agent.created_at)
    controller_verified = bool(owner.email_verified) if owner is not None else True

    unsigned_payload: dict[str, Any] = {
        "type": "Bytecript",
        "version": agent.bytecript_version,
        "agentId": agent.id,
        "agentName": agent.name,
        "description": agent.description,
        "byteNetwork": agent.byte_network,
        "residence": agent.residence,
        "status": agent.status,
        "credentials": cred_claims,
        "issuedAt": issued_at,
        "controllerVerified": controller_verified,
    }
    signature = sign_bytecript_payload(unsigned_payload, issuer_seed)

    return BytecriptOut(
        type="Bytecript",
        version=agent.bytecript_version,
        agentId=agent.id,
        agentName=agent.name,
        description=agent.description,
        byteNetwork=agent.byte_network,
        residence=agent.residence,
        status=agent.status,  # type: ignore[arg-type]
        credentials=[BytecriptCredentialClaim(**c) for c in cred_claims],
        issuedAt=issued_at,
        controllerVerified=controller_verified,
        issuerPublicKey=issuer_pub_b64,
        signature=signature,
    )


def serialize_user(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        organization=user.organization,
        role=user.role,
        emailVerified=user.email_verified,
        createdAt=user.created_at,
        lastLoginAt=user.last_login_at,
    )


def serialize_credential(cred: Credential) -> CredentialOut:
    return CredentialOut(
        id=cred.id,
        agentId=cred.agent_id,
        algorithm=cred.algorithm,
        publicKey=cred.public_key,
        publicKeyPem=cred.public_key_pem,
        fingerprint=cred.fingerprint,
        publicKeyFingerprint=cred.fingerprint,
        label=cred.label,
        status=cred.status,  # type: ignore[arg-type]
        createdAt=cred.created_at,
        expiresAt=cred.expires_at,
        revokedAt=cred.revoked_at,
        revocationReason=cred.revocation_reason,
    )


def serialize_agent(agent: Agent, owner: User | None = None, include_bytecript: bool = True) -> AgentOut:
    creds = [serialize_credential(c) for c in agent.credentials]
    return AgentOut(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        byteNetwork=agent.byte_network,
        residence=agent.residence,
        status=agent.status,  # type: ignore[arg-type]
        agentType=agent.agent_type,
        framework=agent.framework,
        capabilities=agent.capabilities or [],
        publicMetadata=agent.public_metadata or {},
        createdAt=agent.created_at,
        updatedAt=agent.updated_at,
        credentials=creds,
        bytecript=build_bytecript(agent, owner=owner) if include_bytecript else None,
    )


def serialize_public_agent(agent: Agent, owner: User | None = None) -> PublicAgentOut:
    creds = [serialize_credential(c) for c in agent.credentials]
    return PublicAgentOut(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        byteNetwork=agent.byte_network,
        residence=agent.residence,
        status=agent.status,  # type: ignore[arg-type]
        agentType=agent.agent_type,
        framework=agent.framework,
        capabilities=agent.capabilities or [],
        publicMetadata=agent.public_metadata or {},
        createdAt=agent.created_at,
        updatedAt=agent.updated_at,
        credentials=creds,
        bytecript=build_bytecript(agent, owner=owner),
    )


def serialize_audit_event(evt: AuditEvent) -> AuditEventOut:
    return AuditEventOut(
        id=evt.id,
        agentId=evt.agent_id,
        actorType=evt.actor_type,
        actorId=evt.actor_id,
        eventType=evt.event_type,
        summary=evt.summary,
        metadata=evt.event_metadata or {},
        createdAt=evt.created_at,
    )
