from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

AgentStatus = Literal["pending", "active", "suspended", "revoked", "compromised"]
CredentialStatus = Literal["active", "inactive", "revoked"]


class User(BaseModel):
    id: str
    email: str
    name: str | None = None
    organization: str | None = None
    role: str
    emailVerified: bool
    createdAt: datetime
    lastLoginAt: datetime | None = None


class AuthSession(BaseModel):
    user: User
    token: str
    refreshToken: str
    expiresAt: int


class ByteNetwork(BaseModel):
    slug: str
    name: str
    residenceDomain: str
    description: str
    issuer: str
    policySummary: str
    isPublic: bool


class Credential(BaseModel):
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

    @property
    def formatted_fingerprint(self) -> str:
        return " ".join(self.fingerprint[i : i + 8] for i in range(0, len(self.fingerprint), 8))


class BytecriptCredentialClaim(BaseModel):
    id: str
    algorithm: str
    publicKeyFingerprint: str
    publicKey: str


class Bytecript(BaseModel):
    type: str = "Bytecript"
    version: int
    agentId: str
    agentName: str
    description: str | None = None
    byteNetwork: str
    residence: str
    status: AgentStatus
    credentials: list[BytecriptCredentialClaim] = Field(default_factory=list)
    issuedAt: str
    controllerVerified: bool
    issuerPublicKey: str
    signature: str


class Agent(BaseModel):
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
    credentials: list[Credential] = Field(default_factory=list)
    bytecript: Bytecript | None = None


class AuditEvent(BaseModel):
    id: str
    agentId: str
    actorType: str
    actorId: str | None = None
    eventType: str
    summary: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime


class Challenge(BaseModel):
    challengeId: str
    agentId: str
    nonce: str
    audience: str | None = None
    expiresAt: datetime


class VerificationResult(BaseModel):
    verified: bool
    agentId: str
    agentName: str | None = None
    status: str | None = None
    credentialId: str | None = None
    fingerprint: str | None = None
    byteNetwork: str | None = None
    reason: str | None = None
    verifiedAt: datetime


class BytecriptVerifyResult(BaseModel):
    verified: bool
    signatureValid: bool
    liveStatus: str | None = None
    agentId: str | None = None
    reason: str | None = None
    verifiedAt: datetime


class IssuerInfo(BaseModel):
    issuer: str
    algorithm: str
    publicKey: str
    publicKeyPem: str
    fingerprint: str


class ApiKey(BaseModel):
    id: str
    name: str
    keyPrefix: str
    scopes: list[str]
    createdAt: datetime
    lastUsedAt: datetime | None = None
    expiresAt: datetime | None = None
    revokedAt: datetime | None = None
    secret: str | None = None


class HealthStatus(BaseModel):
    status: Literal["ok", "degraded"]
    service: str
    version: str
    environment: str | None = None
    database: str
    databaseConnected: bool
    latencyMs: float
    timestamp: datetime
    detail: str | None = None


class PlatformCodeSession(BaseModel):
    authSessionId: str
    userCode: str
    platformName: str
    platformDomain: str
    requestedScopes: list[str] = Field(default_factory=list)
    verificationUri: str
    expiresAt: datetime
    pollInterval: int = 2


class AgentClaimResult(BaseModel):
    claimed: bool
    authSessionId: str
    agentId: str
    agentName: str
    status: str
    message: str


class AuthenticatedAgent(BaseModel):
    id: str
    name: str
    byteNetwork: str
    residence: str
    status: str
    fingerprint: str
    controllerOrg: str | None = None


class PlatformTokenExchange(BaseModel):
    status: str
    agent: AuthenticatedAgent | None = None
    grantedScopes: list[str] = Field(default_factory=list)
    accessToken: str | None = None
    expiresAt: datetime | None = None

