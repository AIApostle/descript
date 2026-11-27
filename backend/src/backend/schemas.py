from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AgentStatus = Literal["pending", "active", "suspended", "revoked", "compromised"]
CredentialStatus = Literal["active", "inactive", "revoked"]


class ErrorDetail(BaseModel):
    error: str
    message: str
    details: dict[str, Any] | None = None


class HealthOut(BaseModel):
    status: Literal["ok", "degraded"]
    service: str = "descript-api"
    version: str
    environment: str
    database: Literal["postgres", "sqlite"]
    databaseConnected: bool
    latencyMs: float
    timestamp: datetime
    detail: str | None = None


class SignupRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=128)
    organization: str | None = Field(default=None, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if "@" not in cleaned or "." not in cleaned.split("@", 1)[-1]:
            raise ValueError("Invalid email address")
        return cleaned


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class RefreshRequest(BaseModel):
    refreshToken: str


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=128)
    organization: str | None = Field(default=None, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str | None = None
    organization: str | None = None
    role: str
    emailVerified: bool
    createdAt: datetime
    lastLoginAt: datetime | None = None


class AuthResponse(BaseModel):
    user: UserOut
    token: str
    refreshToken: str
    expiresAt: int


class ByteNetworkOut(BaseModel):
    slug: str
    name: str
    residenceDomain: str
    description: str
    issuer: str
    policySummary: str
    isPublic: bool


class CredentialCreateRequest(BaseModel):
    publicKey: str = Field(..., min_length=16)
    algorithm: Literal["ed25519"] = "ed25519"
    label: str | None = Field(default=None, max_length=128)
    deactivateExisting: bool = False
    expiresAt: datetime | None = None


class CredentialStandaloneCreateRequest(CredentialCreateRequest):
    agentId: str


class CredentialUpdateRequest(BaseModel):
    status: Literal["active", "inactive"]
    label: str | None = Field(default=None, max_length=128)


class CredentialRevokeRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=512)


class CredentialOut(BaseModel):
    id: str
    agentId: str
    algorithm: str
    publicKey: str
    publicKeyPem: str
    fingerprint: str
    publicKeyFingerprint: str
    label: str | None = None
    status: CredentialStatus
    createdAt: datetime
    expiresAt: datetime | None = None
    revokedAt: datetime | None = None
    revocationReason: str | None = None


class BytecriptCredentialClaim(BaseModel):
    id: str
    algorithm: str
    publicKeyFingerprint: str
    publicKey: str


class BytecriptOut(BaseModel):
    type: str = "Bytecript"
    version: int
    agentId: str
    agentName: str
    description: str | None = None
    byteNetwork: str
    residence: str
    status: AgentStatus
    credentials: list[BytecriptCredentialClaim]
    issuedAt: str
    controllerVerified: bool
    issuerPublicKey: str
    signature: str


class AgentCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=64)
    description: str | None = Field(default=None, max_length=512)
    byteNetwork: str = Field(default="kiroween", min_length=2, max_length=64)
    publicKey: str = Field(..., min_length=16)
    algorithm: Literal["ed25519"] = "ed25519"
    agentType: str | None = Field(default=None, max_length=64)
    framework: str | None = Field(default=None, max_length=64)
    capabilities: list[str] = Field(default_factory=list)
    publicMetadata: dict[str, Any] = Field(default_factory=dict)
    credentialLabel: str | None = Field(default="Primary Key", max_length=128)

    @field_validator("name")
    @classmethod
    def validate_agent_name(cls, v: str) -> str:
        import re

        cleaned = v.strip()
        if not re.fullmatch(r"[a-zA-Z0-9\s\-_]{3,64}", cleaned):
            raise ValueError(
                "Agent name must be 3-64 characters and contain only letters, numbers, spaces, hyphens, or underscores"
            )
        return cleaned


class AgentBulkItem(BaseModel):
    name: str
    description: str | None = None
    byteNetwork: str = "kiroween"
    publicKey: str
    agentType: str | None = None
    framework: str | None = None
    capabilities: list[str] = Field(default_factory=list)


class AgentBulkCreateRequest(BaseModel):
    agents: list[AgentBulkItem] = Field(..., min_length=1, max_length=50)


class AgentUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=64)
    description: str | None = Field(default=None, max_length=512)
    status: AgentStatus | None = None
    agentType: str | None = Field(default=None, max_length=64)
    framework: str | None = Field(default=None, max_length=64)
    capabilities: list[str] | None = None
    publicMetadata: dict[str, Any] | None = None
    reason: str | None = Field(default=None, max_length=512)

    @field_validator("name")
    @classmethod
    def validate_optional_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        import re

        cleaned = v.strip()
        if not re.fullmatch(r"[a-zA-Z0-9\s\-_]{3,64}", cleaned):
            raise ValueError(
                "Agent name must be 3-64 characters and contain only letters, numbers, spaces, hyphens, or underscores"
            )
        return cleaned


class AgentStatusUpdateRequest(BaseModel):
    status: AgentStatus
    reason: str | None = Field(default=None, max_length=512)


class AgentOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    byteNetwork: str
    residence: str
    status: AgentStatus
    agentType: str | None = None
    framework: str | None = None
    capabilities: list[str] = Field(default_factory=list)
    publicMetadata: dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime
    updatedAt: datetime
    credentials: list[CredentialOut] = Field(default_factory=list)
    bytecript: BytecriptOut | None = None


class PublicAgentOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    byteNetwork: str
    residence: str
    status: AgentStatus
    agentType: str | None = None
    framework: str | None = None
    capabilities: list[str] = Field(default_factory=list)
    publicMetadata: dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime
    updatedAt: datetime
    credentials: list[CredentialOut] = Field(default_factory=list)
    bytecript: BytecriptOut


class AuditEventOut(BaseModel):
    id: str
    agentId: str
    actorType: str
    actorId: str | None = None
    eventType: str
    summary: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime


class ChallengeCreateRequest(BaseModel):
    agentId: str
    audience: str | None = Field(default="external-service", max_length=128)


class ChallengeOut(BaseModel):
    challengeId: str
    agentId: str
    nonce: str
    audience: str | None = None
    expiresAt: datetime


class ChallengeVerifyRequest(BaseModel):
    challengeId: str | None = None
    agentId: str
    nonce: str | None = None
    signature: str


class MessageVerifyRequest(BaseModel):
    agentId: str
    message: str
    signature: str


class VerificationResultOut(BaseModel):
    verified: bool
    agentId: str
    agentName: str | None = None
    status: str | None = None
    credentialId: str | None = None
    fingerprint: str | None = None
    byteNetwork: str | None = None
    reason: str | None = None
    verifiedAt: datetime


class BytecriptVerifyRequest(BaseModel):
    bytecript: dict[str, Any]
    checkLiveStatus: bool = True


class BytecriptVerifyResultOut(BaseModel):
    verified: bool
    signatureValid: bool
    liveStatus: str | None = None
    agentId: str | None = None
    reason: str | None = None
    verifiedAt: datetime


class IssuerInfoOut(BaseModel):
    issuer: str
    algorithm: str = "ed25519"
    publicKey: str
    publicKeyPem: str
    fingerprint: str


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    scopes: list[str] = Field(default_factory=lambda: ["agents:read", "agents:write", "verify"])


class ApiKeyOut(BaseModel):
    id: str
    name: str
    keyPrefix: str
    scopes: list[str]
    createdAt: datetime
    lastUsedAt: datetime | None = None
    expiresAt: datetime | None = None
    revokedAt: datetime | None = None


class ApiKeyCreateResponse(ApiKeyOut):
    secret: str


class PlatformCodeRequest(BaseModel):
    platformName: str = Field(..., min_length=2, max_length=128)
    platformDomain: str = Field(..., min_length=3, max_length=128)
    requestedScopes: list[str] = Field(default_factory=list)
    agentId: str | None = None
    byteNetwork: str | None = None
    expiresInSeconds: int = Field(default=900, ge=60, le=3600)


class PlatformCodeResponse(BaseModel):
    authSessionId: str
    userCode: str
    platformName: str
    platformDomain: str
    requestedScopes: list[str]
    byteNetwork: str | None = None
    verificationUri: str
    expiresAt: datetime
    pollInterval: int = 2


class PlatformPendingSessionOut(BaseModel):
    authSessionId: str
    userCode: str
    platformName: str
    platformDomain: str
    requestedScopes: list[str]
    byteNetwork: str | None = None
    agentId: str | None = None
    status: str
    expiresAt: datetime
    createdAt: datetime



class AgentClaimCodeRequest(BaseModel):
    userCode: str = Field(..., min_length=4, max_length=32)
    agentId: str
    signature: str


class AgentClaimCodeResponse(BaseModel):
    claimed: bool
    authSessionId: str
    agentId: str
    agentName: str
    status: str
    message: str


class PlatformCodeExchangeRequest(BaseModel):
    authSessionId: str
    userCode: str


class AuthenticatedAgentOut(BaseModel):
    id: str
    name: str
    byteNetwork: str
    residence: str
    status: str
    fingerprint: str
    controllerOrg: str | None = None


class PlatformCodeExchangeResponse(BaseModel):
    status: str
    agent: AuthenticatedAgentOut | None = None
    grantedScopes: list[str] = Field(default_factory=list)
    accessToken: str | None = None
    expiresAt: datetime | None = None


# Netprints (Agent internet/platform activity footprints)
class NetprintCreateRequest(BaseModel):
    agentId: str
    platformName: str
    platformDomain: str
    action: str
    resource: str | None = None
    status: str = "success"
    securityLevel: str = "standard"
    ipAddress: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    signature: str | None = None


class NetprintOut(BaseModel):
    id: str
    agentId: str
    agentName: str | None = None
    platformName: str
    platformDomain: str
    action: str
    resource: str | None = None
    status: str
    securityLevel: str
    ipAddress: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime


# Agent-to-Agent Messaging
class AgentMessageSendRequest(BaseModel):
    senderAgentId: str
    recipientAgentId: str
    messageType: str = "text"
    subject: str | None = None
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    signature: str


class AgentMessageOut(BaseModel):
    id: str
    senderAgentId: str
    senderAgentName: str | None = None
    recipientAgentId: str
    recipientAgentName: str | None = None
    messageType: str
    subject: str | None = None
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    signature: str
    status: str
    readAt: datetime | None = None
    createdAt: datetime


# Platform direct agent signup & login credentials
class PlatformAgentSignupRequest(BaseModel):
    platformDomain: str
    platformName: str
    agentName: str
    publicKey: str
    byteNetwork: str = "kiroween"
    capabilities: list[str] = Field(default_factory=list)


class PlatformAgentLoginRequest(BaseModel):
    platformDomain: str
    agentId: str
    nonce: str
    timestamp: int
    signature: str


