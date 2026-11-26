export type AgentStatus = 'pending' | 'active' | 'suspended' | 'revoked' | 'compromised';
export type CredentialStatus = 'active' | 'inactive' | 'revoked';

export interface ByteNetwork {
  slug: string;
  name: string;
  residenceDomain: string;
  description: string;
  issuer: string;
  policySummary: string;
  isPublic: boolean;
}

export interface Credential {
  id: string;
  agentId: string;
  algorithm: 'ed25519' | string;
  publicKey: string;
  publicKeyPem: string;
  fingerprint: string;
  publicKeyFingerprint: string;
  label?: string | null;
  status: CredentialStatus;
  createdAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
}

export interface BytecriptCredentialClaim {
  id: string;
  algorithm: string;
  publicKeyFingerprint: string;
  publicKey: string;
}

export interface Bytecript {
  type: string;
  version: number;
  agentId: string;
  agentName: string;
  description?: string | null;
  byteNetwork: string;
  residence: string;
  status: AgentStatus;
  credentials: BytecriptCredentialClaim[];
  issuedAt: string;
  controllerVerified: boolean;
  issuerPublicKey: string;
  signature: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string | null;
  byteNetwork: string;
  residence: string;
  status: AgentStatus;
  agentType?: string | null;
  framework?: string | null;
  capabilities: string[];
  publicMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  credentials: Credential[];
  bytecript?: Bytecript | null;
}

export interface AgentCreateDTO {
  name: string;
  description?: string;
  byteNetwork: string;
  publicKey: string;
  algorithm?: 'ed25519';
  agentType?: string;
  framework?: string;
  capabilities?: string[];
  publicMetadata?: Record<string, unknown>;
  credentialLabel?: string;
}

export interface AgentUpdateDTO {
  name?: string;
  description?: string;
  status?: AgentStatus;
  agentType?: string;
  framework?: string;
  capabilities?: string[];
  publicMetadata?: Record<string, unknown>;
  reason?: string;
}

export interface AuditEvent {
  id: string;
  agentId: string;
  actorType: string;
  actorId?: string | null;
  eventType: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ChallengeResponse {
  challengeId: string;
  agentId: string;
  nonce: string;
  audience?: string | null;
  expiresAt: string;
}

export interface VerificationResult {
  verified: boolean;
  agentId: string;
  agentName?: string | null;
  status?: string | null;
  credentialId?: string | null;
  fingerprint?: string | null;
  byteNetwork?: string | null;
  reason?: string | null;
  verifiedAt: string;
}

export interface BytecriptVerifyResult {
  verified: boolean;
  signatureValid: boolean;
  liveStatus?: string | null;
  agentId?: string | null;
  reason?: string | null;
  verifiedAt: string;
}

export interface IssuerInfo {
  issuer: string;
  algorithm: string;
  publicKey: string;
  publicKeyPem: string;
  fingerprint: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
}

export interface ApiKeyCreateResponse extends ApiKey {
  secret: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment?: string;
  database: 'postgres' | 'sqlite' | string;
  databaseConnected: boolean;
  latencyMs: number;
  timestamp: string;
  detail?: string | null;
}
