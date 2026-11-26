import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { agentService, networkService } from '../services/agentService';
import type {
  Agent,
  AgentCreateDTO,
  AgentStatus,
  AgentUpdateDTO,
  ByteNetwork,
} from '../types/agent';
import type { RegistrationData } from '../types/registration';
import { useAuth } from './AuthContext';

interface AgentContextValue {
  agents: Agent[];
  networks: ByteNetwork[];
  isLoading: boolean;
  error: string | null;
  registrationData: RegistrationData;
  loadAgents: () => Promise<void>;
  loadNetworks: () => Promise<void>;
  createAgent: (payload: AgentCreateDTO) => Promise<Agent>;
  bulkCreateAgents: (payload: AgentCreateDTO[]) => Promise<Agent[]>;
  updateAgent: (agentId: string, updates: AgentUpdateDTO) => Promise<Agent>;
  setAgentStatus: (agentId: string, status: AgentStatus, reason?: string) => Promise<Agent>;
  deleteAgent: (agentId: string) => Promise<void>;
  upsertAgentInState: (agent: Agent) => void;
  setRegistrationData: (patch: Partial<RegistrationData>) => void;
  resetRegistration: () => void;
}

const DEFAULT_REGISTRATION: RegistrationData = {
  agentName: '',
  description: '',
  byteNetwork: 'kiroween',
  agentType: 'autonomous',
  framework: 'custom',
  capabilities: [],
  credentialLabel: 'Primary Key',
};

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [networks, setNetworks] = useState<ByteNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationData, setRegistrationDataState] = useState<RegistrationData>(DEFAULT_REGISTRATION);

  const loadNetworks = useCallback(async () => {
    try {
      const list = await networkService.list();
      setNetworks(list);
    } catch {
      // Networks fallback if API temporarily unreachable
      setNetworks([
        {
          slug: 'kiroween',
          name: 'Kiroween Network',
          residenceDomain: 'kiroween-residence',
          description: 'Primary identity namespace for autonomous AI agents.',
          issuer: 'Descript Root Authority',
          policySummary: 'Ed25519 asymmetric credentials required.',
          isPublic: true,
        },
      ]);
    }
  }, []);

  const loadAgents = useCallback(async () => {
    if (!isAuthenticated) {
      setAgents([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await agentService.list();
      setAgents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNetworks();
  }, [loadNetworks]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAgents();
    } else {
      setAgents([]);
    }
  }, [isAuthenticated, loadAgents]);

  const upsertAgentInState = useCallback((agent: Agent) => {
    setAgents((prev) => {
      const idx = prev.findIndex((a) => a.id === agent.id);
      if (idx === -1) return [agent, ...prev];
      const next = [...prev];
      next[idx] = agent;
      return next;
    });
  }, []);

  const createAgent = useCallback(
    async (payload: AgentCreateDTO): Promise<Agent> => {
      const created = await agentService.create(payload);
      upsertAgentInState(created);
      return created;
    },
    [upsertAgentInState]
  );

  const bulkCreateAgents = useCallback(async (payload: AgentCreateDTO[]): Promise<Agent[]> => {
    const created = await agentService.bulkCreate(payload);
    setAgents((prev) => [...created, ...prev]);
    return created;
  }, []);

  const updateAgent = useCallback(
    async (agentId: string, updates: AgentUpdateDTO): Promise<Agent> => {
      const updated = await agentService.update(agentId, updates);
      upsertAgentInState(updated);
      return updated;
    },
    [upsertAgentInState]
  );

  const setAgentStatus = useCallback(
    async (agentId: string, status: AgentStatus, reason?: string): Promise<Agent> => {
      const updated = await agentService.setStatus(agentId, status, reason);
      upsertAgentInState(updated);
      return updated;
    },
    [upsertAgentInState]
  );

  const deleteAgent = useCallback(async (agentId: string): Promise<void> => {
    await agentService.delete(agentId);
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  }, []);

  const setRegistrationData = useCallback((patch: Partial<RegistrationData>) => {
    setRegistrationDataState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetRegistration = useCallback(() => {
    setRegistrationDataState(DEFAULT_REGISTRATION);
  }, []);

  return (
    <AgentContext.Provider
      value={{
        agents,
        networks,
        isLoading,
        error,
        registrationData,
        loadAgents,
        loadNetworks,
        createAgent,
        bulkCreateAgents,
        updateAgent,
        setAgentStatus,
        deleteAgent,
        upsertAgentInState,
        setRegistrationData,
        resetRegistration,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export function useAgents(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgents must be used within AgentProvider');
  return ctx;
}
