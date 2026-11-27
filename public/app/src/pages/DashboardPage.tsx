import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Code2,
  KeyRound,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Terminal,
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
import type { Agent, AgentCreateDTO } from '../types/agent';
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

  // Quick SDK snippet modal
  const [sdkModalAgent, setSdkModalAgent] = useState<Agent | null>(null);

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

  const getPythonSnippet = (agentId: string) => `from descript import DescriptClient

client = DescriptClient(api_key="dsc_live_...")

# Fetch agent passport & check Ed25519 signature
agent = client.agents.get("${agentId}")
is_valid = client.verify.verify_bytecript(agent.bytecript)
print(f"Verified {agent.name}: {is_valid}")`;

  return (
    <DashboardLayout
      title="Agent Registry & Console"
      subtitle="Manage persistent identities, client-side Ed25519 key bindings, and Bytecript cards."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-descript-200 dark:border-descript-800 bg-descript-50 dark:bg-descript-950/60 text-xs font-semibold text-descript-700 dark:text-descript-300 hover:bg-descript-100 dark:hover:bg-descript-900 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-descript-600 dark:text-descript-400" />
            <span>Verify Agent</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            icon={<Upload className="h-3.5 w-3.5" />}
            onClick={() => setBulkOpen(true)}
          >
            Bulk Import
          </Button>
          <Link
            to="/docs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-base-200 dark:border-base-800 text-xs font-medium text-base-700 dark:text-base-300 hover:bg-base-100 dark:hover:bg-base-800"
          >
            <Terminal className="h-3.5 w-3.5 text-descript-600 dark:text-descript-400" />
            <span>Python SDK Docs</span>
          </Link>
        </div>
      }
    >
      {/* Metrics Bento Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="double-bezel">
          <div className="double-bezel-inner p-5">
            <div className="flex items-center justify-between text-base-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Total Fleet</span>
              <Bot className="h-4 w-4 text-descript-600 dark:text-descript-400" />
            </div>
            <div className="text-3xl font-extrabold text-base-950 dark:text-white">
              {stats.total}
            </div>
            <div className="text-[11px] text-base-500 mt-1">UUIDv7 canonical agents</div>
          </div>
        </div>

        <div className="double-bezel">
          <div className="double-bezel-inner p-5">
            <div className="flex items-center justify-between text-base-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active Identities</span>
              <ShieldCheck className="h-4 w-4 text-identity-600 dark:text-identity-400" />
            </div>
            <div className="text-3xl font-extrabold text-identity-600 dark:text-identity-400">
              {stats.active}
            </div>
            <div className="text-[11px] text-base-500 mt-1">Passing verification checks</div>
          </div>
        </div>

        <div className="double-bezel">
          <div className="double-bezel-inner p-5">
            <div className="flex items-center justify-between text-base-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Bound Keys</span>
              <KeyRound className="h-4 w-4 text-trust-600 dark:text-trust-400" />
            </div>
            <div className="text-3xl font-extrabold text-base-950 dark:text-white">
              {stats.activeKeys}
            </div>
            <div className="text-[11px] text-base-500 mt-1">Ed25519 active credentials</div>
          </div>
        </div>

        <div className="double-bezel">
          <div className="double-bezel-inner p-5">
            <div className="flex items-center justify-between text-base-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Byte Networks</span>
              <Network className="h-4 w-4 text-descript-600 dark:text-descript-400" />
            </div>
            <div className="text-3xl font-extrabold text-base-950 dark:text-white">
              {stats.activeNetworks}
            </div>
            <div className="text-[11px] text-base-500 mt-1">Governed namespaces</div>
          </div>
        </div>
      </div>

      {/* Filter Bar with Status Chips */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-base-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by agent name, ID, or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-sm text-base-900 dark:text-base-100 outline-none focus:ring-2 focus:ring-descript-500/50 shadow-2xs"
            />
          </div>

          <select
            aria-label="Filter by Byte Network"
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-sm text-base-800 dark:text-base-100 shadow-2xs font-medium"
          >
            <option value="all">All Byte Networks</option>
            {networks.map((net) => (
              <option key={net.slug} value={net.slug}>
                {net.name} ({net.slug})
              </option>
            ))}
          </select>
        </div>

        {/* Status quick tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
          {['all', 'active', 'suspended', 'revoked'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                statusFilter === status
                  ? 'bg-base-900 dark:bg-white text-white dark:text-base-950 font-semibold shadow-xs'
                  : 'bg-base-100/80 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-900 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="double-bezel animate-pulse">
              <div className="double-bezel-inner h-48 p-6" />
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="double-bezel">
          <div className="double-bezel-inner p-12 text-center">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-descript-50 dark:bg-descript-950/80 text-descript-600 dark:text-descript-400 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-base-950 dark:text-white mb-2">
              {agents.length === 0 ? 'No agents registered yet' : 'No matching agents found'}
            </h2>
            <p className="text-sm text-base-500 max-w-md mx-auto mb-6 leading-relaxed">
              {agents.length === 0
                ? 'Register your first autonomous agent to generate a canonical Agent ID, bind an Ed25519 keypair, and issue a signed Bytecript passport.'
                : 'Try adjusting your search query or status filter.'}
            </p>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/agents/new')}
              size="lg"
            >
              Register First Agent
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredAgents.map((agent) => {
            return (
              <div key={agent.id} className="double-bezel group">
                <div className="double-bezel-inner h-full flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/agents/${agent.id}`}
                          className="text-lg font-bold text-base-950 dark:text-white hover:text-descript-600 dark:hover:text-descript-400 transition-colors block truncate"
                        >
                          {agent.name}
                        </Link>
                        <p className="text-xs text-base-500 line-clamp-1 mt-0.5">
                          {agent.description || 'No description provided'}
                        </p>
                      </div>
                      <StatusBadge status={agent.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200/80 dark:border-base-800/80 mb-4">
                      <span className="font-mono text-xs text-base-800 dark:text-base-200 truncate">
                        {truncateMiddle(agent.id, 14, 10)}
                      </span>
                      <CopyButton text={agent.id} label="Copy ID" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs mb-4 p-3 rounded-xl bg-base-50/50 dark:bg-base-900/40 border border-base-200/50 dark:border-base-800/50">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-base-400">Network</div>
                        <div className="font-mono font-medium text-base-900 dark:text-base-100 mt-0.5">
                          {agent.byteNetwork}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-base-400">Keys</div>
                        <div className="font-medium text-base-900 dark:text-base-100 mt-0.5">
                          {agent.credentials.filter((c) => c.status === 'active').length} active
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-base-400">Updated</div>
                        <div className="font-medium text-base-900 dark:text-base-100 mt-0.5">
                          {formatRelativeTime(agent.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-base-200 dark:border-base-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSdkModalAgent(agent)}
                      className="inline-flex items-center gap-1.5 text-xs text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white font-medium"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>Python Code</span>
                    </button>

                    <Link
                      to={`/agents/${agent.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-descript-600 dark:text-descript-400 hover:underline"
                    >
                      <span>View Bytecript</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Import Modal */}
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

      {/* Quick Python SDK Code Modal */}
      {sdkModalAgent && (
        <Modal
          isOpen={Boolean(sdkModalAgent)}
          onClose={() => setSdkModalAgent(null)}
          title={`Python Integration: ${sdkModalAgent.name}`}
          footer={
            <Button variant="secondary" onClick={() => setSdkModalAgent(null)}>
              Done
            </Button>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-base-600 dark:text-base-400">
              Integrate this agent identity directly into your Python service or multi-agent swarm:
            </p>
            <pre className="p-4 rounded-xl bg-base-950 text-base-100 font-mono text-xs leading-relaxed overflow-x-auto">
              <code>{getPythonSnippet(sdkModalAgent.id)}</code>
            </pre>
            <div className="flex justify-end">
              <CopyButton text={getPythonSnippet(sdkModalAgent.id)} label="Copy Snippet" />
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
