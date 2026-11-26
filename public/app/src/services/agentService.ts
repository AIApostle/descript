import { api } from './api';
import type {
  Agent,
  AgentCreateDTO,
  AgentStatus,
  AgentUpdateDTO,
  ApiKey,
  ApiKeyCreateResponse,
  AuditEvent,
  Bytecript,
  BytecriptVerifyResult,
  ByteNetwork,
  ChallengeResponse,
  Credential,
  HealthStatus,
  IssuerInfo,
  VerificationResult,
} from '../types/agent';

export const healthService = {
  check(): Promise<HealthStatus> {
    return api.get<HealthStatus>('/health', { skipAuth: true });
  },
};

export const networkService = {
  list(): Promise<ByteNetwork[]> {
    return api.get<ByteNetwork[]>('/networks', { skipAuth: true });
  },
  get(slug: string): Promise<ByteNetwork> {
    return api.get<ByteNetwork>(`/networks/${slug}`, { skipAuth: true });
  },
};

export const agentService = {
  list(params?: { status?: string; byteNetwork?: string; search?: string }): Promise<Agent[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.byteNetwork) query.set('byteNetwork', params.byteNetwork);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<Agent[]>(`/agents${qs ? `?${qs}` : ''}`);
  },

  get(agentId: string): Promise<Agent> {
    return api.get<Agent>(`/agents/${agentId}`);
  },

  getPublic(agentId: string): Promise<Agent> {
    return api.get<Agent>(`/public/agents/${agentId}`, { skipAuth: true });
  },

  create(payload: AgentCreateDTO): Promise<Agent> {
    return api.post<Agent>('/agents', payload);
  },

  bulkCreate(agents: AgentCreateDTO[]): Promise<Agent[]> {
    return api.post<Agent[]>('/agents/bulk', { agents });
  },

  update(agentId: string, payload: AgentUpdateDTO): Promise<Agent> {
    return api.patch<Agent>(`/agents/${agentId}`, payload);
  },

  setStatus(agentId: string, status: AgentStatus, reason?: string): Promise<Agent> {
    return api.patch<Agent>(`/agents/${agentId}/status`, { status, reason });
  },

  delete(agentId: string): Promise<void> {
    return api.delete<void>(`/agents/${agentId}`);
  },

  getBytecript(agentId: string): Promise<Bytecript> {
    return api.get<Bytecript>(`/agents/${agentId}/bytecript`);
  },

  getAudit(agentId: string): Promise<AuditEvent[]> {
    return api.get<AuditEvent[]>(`/agents/${agentId}/audit`);
  },

  getCredentials(agentId: string): Promise<Credential[]> {
    return api.get<Credential[]>(`/agents/${agentId}/credentials`);
  },

  addCredential(
    agentId: string,
    payload: { publicKey: string; label?: string; deactivateExisting?: boolean }
  ): Promise<Credential> {
    return api.post<Credential>(`/agents/${agentId}/credentials`, {
      ...payload,
      algorithm: 'ed25519',
    });
  },

  updateCredential(
    agentId: string,
    credentialId: string,
    payload: { status: 'active' | 'inactive'; label?: string }
  ): Promise<Credential> {
    return api.patch<Credential>(`/agents/${agentId}/credentials/${credentialId}`, payload);
  },

  revokeCredential(agentId: string, credentialId: string, reason?: string): Promise<Credential> {
    return api.post<Credential>(`/agents/${agentId}/credentials/${credentialId}/revoke`, { reason });
  },
};

export const verifyService = {
  getIssuer(): Promise<IssuerInfo> {
    return api.get<IssuerInfo>('/issuer', { skipAuth: true });
  },

  createChallenge(agentId: string, audience = 'descript-verify'): Promise<ChallengeResponse> {
    return api.post<ChallengeResponse>('/challenges', { agentId, audience }, { skipAuth: true });
  },

  verifyChallenge(payload: {
    agentId: string;
    challengeId?: string;
    nonce?: string;
    signature: string;
  }): Promise<VerificationResult> {
    return api.post<VerificationResult>('/challenges/verify', payload, { skipAuth: true });
  },

  verifyMessage(payload: { agentId: string; message: string; signature: string }): Promise<VerificationResult> {
    return api.post<VerificationResult>('/verify', payload, { skipAuth: true });
  },

  verifyBytecript(bytecript: Record<string, unknown>, checkLiveStatus = true): Promise<BytecriptVerifyResult> {
    return api.post<BytecriptVerifyResult>(
      '/verify/bytecript',
      { bytecript, checkLiveStatus },
      { skipAuth: true }
    );
  },
};

export const apiKeyService = {
  list(): Promise<ApiKey[]> {
    return api.get<ApiKey[]>('/api-keys');
  },

  create(name: string, scopes?: string[]): Promise<ApiKeyCreateResponse> {
    return api.post<ApiKeyCreateResponse>('/api-keys', { name, ...(scopes ? { scopes } : {}) });
  },

  revoke(keyId: string): Promise<void> {
    return api.delete<void>(`/api-keys/${keyId}`);
  },
};
