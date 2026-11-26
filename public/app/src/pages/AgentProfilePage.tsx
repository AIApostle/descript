import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ActivityLog } from '../components/agent/ActivityLog';
import { AgentSettings } from '../components/agent/AgentSettings';
import { ChallengeTester } from '../components/agent/ChallengeTester';
import { CredentialList } from '../components/agent/CredentialList';
import { BytecriptActions } from '../components/bytecript/BytecriptActions';
import { BytecriptCard } from '../components/bytecript/BytecriptCard';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAgents } from '../context/AgentContext';
import { agentService } from '../services/agentService';
import type { Agent, AuditEvent } from '../types/agent';

type ProfileTab = 'overview' | 'credentials' | 'verify' | 'settings' | 'audit';

export default function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { upsertAgentInState } = useAgents();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const loadAgentData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAgent, fetchedAudit] = await Promise.all([
        agentService.get(id),
        agentService.getAudit(id),
      ]);
      setAgent(fetchedAgent);
      setAuditEvents(fetchedAudit);
      upsertAgentInState(fetchedAgent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load agent profile');
    } finally {
      setIsLoading(false);
    }
  }, [id, upsertAgentInState]);

  useEffect(() => {
    loadAgentData();
  }, [loadAgentData]);

  const handleUpdated = (updated: Agent) => {
    setAgent(updated);
    upsertAgentInState(updated);
    if (id) {
      agentService.getAudit(id).then(setAuditEvents).catch(() => {});
    }
  };

  const tabs: Array<{ key: ProfileTab; label: string }> = [
    { key: 'overview', label: 'Bytecript & Overview' },
    { key: 'credentials', label: `Credentials (${agent?.credentials.length ?? 0})` },
    { key: 'verify', label: 'Challenge Lab' },
    { key: 'settings', label: 'Identity Settings' },
    { key: 'audit', label: `Audit Log (${auditEvents.length})` },
  ];

  return (
    <DashboardLayout
      title={agent?.name || 'Agent Profile'}
      subtitle={agent ? `${agent.byteNetwork} (${agent.residence})` : 'Loading agent identity...'}
    >
      <div className="mb-6 no-print">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-base-600 dark:text-base-400 hover:text-base-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agent Registry
        </Link>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-base-200 dark:border-base-800 pb-3 mb-8 no-print">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-descript-600 text-white'
                : 'text-base-600 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-10">
          <div>
            <BytecriptCard
              agent={agent}
              bytecript={agent?.bytecript}
              isLoading={isLoading}
              error={error}
              onRetry={loadAgentData}
            />
            {agent && (
              <BytecriptActions
                agentId={agent.id}
                agentName={agent.name}
                bytecript={agent.bytecript}
              />
            )}
          </div>

          {agent && (
            <div className="no-print space-y-8">
              <CredentialList
                agentId={agent.id}
                agentStatus={agent.status}
                credentials={agent.credentials}
                onRefresh={loadAgentData}
              />
              <ActivityLog events={auditEvents.slice(0, 6)} isLoading={isLoading} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'credentials' && agent && (
        <CredentialList
          agentId={agent.id}
          agentStatus={agent.status}
          credentials={agent.credentials}
          onRefresh={loadAgentData}
        />
      )}

      {activeTab === 'verify' && agent && (
        <ChallengeTester agentId={agent.id} onVerified={loadAgentData} />
      )}

      {activeTab === 'settings' && agent && (
        <AgentSettings agent={agent} onUpdated={handleUpdated} />
      )}

      {activeTab === 'audit' && <ActivityLog events={auditEvents} isLoading={isLoading} />}
    </DashboardLayout>
  );
}
