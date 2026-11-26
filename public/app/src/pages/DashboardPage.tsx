import { useMemo, useState } from 'react';
import {
  Bot,
  KeyRound,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/bytecript/StatusBadge';
import { CopyButton } from '../components/common/CopyButton';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAgents } from '../context/AgentContext';
import { useNotification } from '../context/NotificationContext';
import type { AgentCreateDTO } from '../types/agent';
import { formatRelativeTime, truncateMiddle } from '../utils/formatting';

export default function DashboardPage() {
  const { agents, networks, isLoading, bulkCreateAgents } = useAgents();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (statusFilter !== 'all' && agent.status !== statusFilter) return false;
      if (networkFilter !== 'all' && agent.byteNetwork !== networkFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hit =
          agent.name.toLowerCase().includes(q) ||
          agent.id.toLowerCase().includes(q) ||
          (agent.description || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [agents, statusFilter, networkFilter, search]);

  const stats = useMemo(() => {
    const activeAgents = agents.filter((a) => a.status === 'active').length;
    const activeKeys = agents.reduce(
      (sum, a) => sum + a.credentials.filter((c) => c.status === 'active').length,
      0
    );
    const activeNetworks = new Set(agents.map((a) => a.byteNetwork)).size;
    return {
      total: agents.length,
      active: activeAgents,
      activeKeys,
      activeNetworks,
    };
  }, [agents]);

  const handleBulkSubmit = async () => {
    setBulkLoading(true);
    try {
      const parsed = JSON.parse(bulkJson) as AgentCreateDTO[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Provide a non-empty JSON array of agent registration objects');
      }
      const created = await bulkCreateAgents(parsed);
      showToast(`Registered ${created.length} agent(s)`, 'success');
      setBulkOpen(false);
      setBulkJson('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Bulk import failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Agent Registry"
      subtitle="Manage persistent agent identities, Ed25519 credentials, and Bytecript cards."
      actions={
        <Button
          variant="outline"
          size="sm"
          icon={<Upload className="h-4 w-4" />}
          onClick={() => setBulkOpen(true)}
        >
          Bulk Import
        </Button>
      }
    >
      {/* Metrics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 p-5">
          <div className="flex items-center justify-between text-base-500 dark:text-base-400 text-xs font-medium mb-2">
            <span>Total Agents</span>
            <Bot className="h-4 w-4 text-descript-600 dark:text-descript-400" />
          </div>
          <div className="text-2xl font-bold text-base-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 p-5">
          <div className="flex items-center justify-between text-base-500 dark:text-base-400 text-xs font-medium mb-2">
            <span>Active Identities</span>
            <ShieldCheck className="h-4 w-4 text-identity-600 dark:text-identity-400" />
          </div>
          <div className="text-2xl font-bold text-base-900 dark:text-white">{stats.active}</div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 p-5">
          <div className="flex items-center justify-between text-base-500 dark:text-base-400 text-xs font-medium mb-2">
            <span>Active Keys</span>
            <KeyRound className="h-4 w-4 text-trust-600 dark:text-trust-400" />
          </div>
          <div className="text-2xl font-bold text-base-900 dark:text-white">{stats.activeKeys}</div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 p-5">
          <div className="flex items-center justify-between text-base-500 dark:text-base-400 text-xs font-medium mb-2">
            <span>Byte Networks</span>
            <Network className="h-4 w-4 text-descript-600 dark:text-descript-400" />
          </div>
          <div className="text-2xl font-bold text-base-900 dark:text-white">
            {stats.activeNetworks}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-base-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by agent name or agent_ ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-sm text-base-900 dark:text-base-100 outline-none focus:border-descript-500"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-sm text-base-800 dark:text-base-100"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
          <option value="compromised">Compromised</option>
          <option value="revoked">Revoked</option>
        </select>

        <select
          aria-label="Filter by Byte Network"
          value={networkFilter}
          onChange={(e) => setNetworkFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-sm text-base-800 dark:text-base-100"
        >
          <option value="all">All Networks</option>
          {networks.map((net) => (
            <option key={net.slug} value={net.slug}>
              {net.name} ({net.slug})
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 p-6 animate-pulse"
            >
              <div className="h-5 w-40 bg-base-200 dark:bg-base-800 rounded mb-3" />
              <div className="h-4 w-64 bg-base-100 dark:bg-base-800 rounded mb-6" />
              <div className="h-10 w-full bg-base-100 dark:bg-base-800 rounded" />
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 p-12 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-descript-50 dark:bg-descript-950/60 text-descript-600 dark:text-descript-400 flex items-center justify-center mb-4">
            <Bot className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-base-900 dark:text-white mb-2">
            {agents.length === 0 ? 'No agents registered yet' : 'No matching agents found'}
          </h2>
          <p className="text-sm text-base-600 dark:text-base-400 max-w-md mx-auto mb-6">
            {agents.length === 0
              ? 'Register your first AI agent to generate a canonical Agent ID, bind an Ed25519 keypair, and issue its Bytecript digital card.'
              : 'Try adjusting your search query or status filter.'}
          </p>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/agents/new')}>
            Register First Agent
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredAgents.map((agent) => {
            const activeCred =
              agent.credentials.find((c) => c.status === 'active') || agent.credentials[0];
            return (
              <div
                key={agent.id}
                className="group rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 p-6 hover:border-descript-300 dark:hover:border-descript-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link
                      to={`/agents/${agent.id}`}
                      className="text-lg font-semibold text-base-900 dark:text-white hover:text-descript-600 dark:hover:text-descript-400 transition-colors block truncate"
                    >
                      {agent.name}
                    </Link>
                    <p className="text-xs text-base-500 dark:text-base-400 line-clamp-2 mt-0.5">
                      {agent.description || 'No description provided'}
                    </p>
                  </div>
                  <StatusBadge status={agent.status} size="sm" />
                </div>

                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 mb-4">
                  <span className="font-mono text-xs text-base-700 dark:text-base-300 truncate">
                    {truncateMiddle(agent.id, 14, 10)}
                  </span>
                  <CopyButton text={agent.id} label="Copy ID" />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                  <div>
                    <div className="text-base-500 dark:text-base-400">Network</div>
                    <div className="font-mono font-medium text-base-900 dark:text-base-100 mt-0.5">
                      {agent.byteNetwork}
                    </div>
                  </div>
                  <div>
                    <div className="text-base-500 dark:text-base-400">Active Keys</div>
                    <div className="font-medium text-base-900 dark:text-base-100 mt-0.5">
                      {agent.credentials.filter((c) => c.status === 'active').length}
                    </div>
                  </div>
                  <div>
                    <div className="text-base-500 dark:text-base-400">Updated</div>
                    <div className="font-medium text-base-900 dark:text-base-100 mt-0.5">
                      {formatRelativeTime(agent.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-base-200 dark:border-base-800 flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-base-500 dark:text-base-400 truncate">
                    {activeCred ? `FP: ${activeCred.fingerprint.slice(0, 16)}...` : 'No credential'}
                  </span>
                  <Link
                    to={`/agents/${agent.id}`}
                    className="text-xs font-semibold text-descript-600 dark:text-descript-400 hover:underline shrink-0"
                  >
                    View Bytecript
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Register Agents (JSON)"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button loading={bulkLoading} disabled={!bulkJson.trim()} onClick={handleBulkSubmit}>
              Import Agents
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-base-600 dark:text-base-300">
            Paste a JSON array of agents with <code className="font-mono">name</code>,{' '}
            <code className="font-mono">byteNetwork</code>, and{' '}
            <code className="font-mono">publicKey</code>.
          </p>
          <textarea
            rows={8}
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            placeholder={`[\n  {\n    "name": "Worker Alpha",\n    "byteNetwork": "kiroween",\n    "publicKey": "<base64-ed25519-public-key>"\n  }\n]`}
            className="w-full p-3 rounded-lg border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 font-mono text-xs text-base-900 dark:text-base-100"
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
