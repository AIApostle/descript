import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  Code2,
  Globe,
  KeyRound,
  Mail,
  Network,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Upload,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../components/bytecript/StatusBadge';
import { CopyButton } from '../components/common/CopyButton';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAgents } from '../context/AgentContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { Agent, AgentCreateDTO, AgentMessage, Netprint, PlatformPendingAuthSession } from '../types/agent';
import { formatRelativeTime, truncateMiddle } from '../utils/formatting';

export default function DashboardPage() {
  const { agents, networks, isLoading, bulkCreateAgents } = useAgents();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active top-level view: 'agents' | 'netprints' | 'messages' | 'auth-sessions'
  const activeTab = searchParams.get('tab') || 'agents';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Quick SDK snippet modal
  const [sdkModalAgent, setSdkModalAgent] = useState<Agent | null>(null);

  // Netprints & Messages state
  const [netprints, setNetprints] = useState<Netprint[]>([]);
  const [netprintsLoading, setNetprintsLoading] = useState(false);

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedAgentForMessages, setSelectedAgentForMessages] = useState<string>('');

  const [authSessions, setAuthSessions] = useState<PlatformPendingAuthSession[]>([]);
  const [authSessionsLoading, setAuthSessionsLoading] = useState(false);

  // Fetch Netprints
  const fetchNetprints = async () => {
    setNetprintsLoading(true);
    try {
      const data = await api.get<Netprint[]>('/netprints?limit=100');
      setNetprints(data);
    } catch {
      // ignore in offline mode
    } finally {
      setNetprintsLoading(false);
    }
  };

  // Fetch Messages for active agent
  const fetchMessages = async (agentId?: string) => {
    const target = agentId || selectedAgentForMessages || (agents[0]?.id ?? '');
    if (!target) return;
    setMessagesLoading(true);
    try {
      const data = await api.get<AgentMessage[]>(`/messages?agentId=${target}&box=all`);
      setMessages(data);
    } catch {
      // ignore in offline mode
    } finally {
      setMessagesLoading(false);
    }
  };

  // Fetch Pending Platform Auth Sessions
  const fetchAuthSessions = async () => {
    setAuthSessionsLoading(true);
    try {
      const data = await api.get<PlatformPendingAuthSession[]>('/auth/platform/pending');
      setAuthSessions(data);
    } catch {
      // ignore
    } finally {
      setAuthSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'netprints') {
      fetchNetprints();
    } else if (activeTab === 'messages') {
      if (agents.length > 0 && !selectedAgentForMessages) {
        setSelectedAgentForMessages(agents[0].id);
      }
      fetchMessages(selectedAgentForMessages || agents[0]?.id);
    } else if (activeTab === 'auth-sessions') {
      fetchAuthSessions();
    }
  }, [activeTab, agents.length]);

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

  const getPythonSnippet = (agentId: string) => `from descript import DescriptClient, DescriptAgentAuth, KeyPair

client = DescriptClient(api_key="dsc_live_...")

# 1. Fetch Agent Identity & Verify Online
agent = client.agents.get("${agentId}")
is_valid = client.verify.verify_bytecript(agent.bytecript)

# 2. Record Internet Activity / Netprint Footprint
footprint = client.netprints.record(
    agent_id="${agentId}",
    platform_name="HuggingFace",
    platform_domain="huggingface.co",
    action="model.download",
)

# 3. Send Signed Agent-to-Agent Message
# client.messages.send(
#     sender_agent_id="${agentId}",
#     recipient_agent_id="agent_...",
#     content="Hello peer agent!",
#     keypair=keypair,
# )`;

  return (
    <DashboardLayout
      title="Descript Controller Console"
      subtitle="Universal cryptographic identity, internet footprint tracking (Netprints), and agent messaging hub."
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
            <span>Python SDK</span>
          </Link>
        </div>
      }
    >
      {/* Metrics Bento Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="double-bezel">
          <div className="double-bezel-inner p-5">
            <div className="flex items-center justify-between text-base-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Managed Agents</span>
              <Bot className="h-4 w-4 text-descript-600 dark:text-descript-400" />
            </div>
            <div className="text-3xl font-extrabold text-base-950 dark:text-white">
              {stats.total}
            </div>
            <div className="text-[11px] text-base-500 mt-1">Multi-agent fleet registry</div>
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
            <div className="text-[11px] text-base-500 mt-1">Passing online verification</div>
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
            <div className="text-[11px] text-base-500 mt-1">Ed25519 credentials on Neon</div>
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
            <div className="text-[11px] text-base-500 mt-1">Namespaces (kiroween)</div>
          </div>
        </div>
      </div>

      {/* Main Console Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-base-200 dark:border-base-800 pb-3 mb-6">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'agents' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'agents'
              ? 'bg-descript-600 text-white shadow-xs'
              : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Agent Fleet ({agents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'netprints' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'netprints'
              ? 'bg-descript-600 text-white shadow-xs'
              : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Netprints (Internet Footprints)</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'messages' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'messages'
              ? 'bg-descript-600 text-white shadow-xs'
              : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Agent Comms & Messages</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'auth-sessions' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'auth-sessions'
              ? 'bg-descript-600 text-white shadow-xs'
              : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Platform OTP Sessions</span>
        </button>
      </div>

      {/* VIEW 1: AGENTS FLEET */}
      {activeTab === 'agents' && (
        <>
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
                    ? 'Register your autonomous agents to issue persistent canonical Agent IDs, generate Ed25519 credentials, and start tracking their footprints across platforms.'
                    : 'Try adjusting your search query or status filter.'}
                </p>
                <Button
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => navigate('/agents/new')}
                  size="lg"
                >
                  Register Agent
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
                          <span>Integration Code</span>
                        </button>

                        <Link
                          to={`/agents/${agent.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-descript-600 dark:text-descript-400 hover:underline"
                        >
                          <span>View Passport</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: NETPRINTS (INTERNET FOOTPRINTS TRACKING) */}
      {activeTab === 'netprints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-base-950 dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-descript-600 dark:text-descript-400" />
                <span>Netprints Footprint Ledger</span>
              </h2>
              <p className="text-xs text-base-500">
                Audited record of everywhere your agents have authenticated or performed actions across external platforms.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`h-3.5 w-3.5 ${netprintsLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchNetprints}
            >
              Refresh
            </Button>
          </div>

          {netprintsLoading ? (
            <div className="double-bezel animate-pulse">
              <div className="double-bezel-inner h-64 p-6" />
            </div>
          ) : netprints.length === 0 ? (
            <div className="double-bezel">
              <div className="double-bezel-inner p-10 text-center">
                <Globe className="h-10 w-10 text-base-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-base-900 dark:text-white mb-1">No Netprints recorded yet</h3>
                <p className="text-xs text-base-500 max-w-md mx-auto">
                  When your agents call platforms using the Descript SDK or sign in via Descript Auth, their footprints will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="double-bezel overflow-hidden">
              <div className="double-bezel-inner divide-y divide-base-200 dark:divide-base-800">
                {netprints.map((np) => (
                  <div key={np.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-base-50/50 dark:hover:bg-base-900/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-base-900 dark:text-white">
                          {np.agentName || np.agentId}
                        </span>
                        <span className="text-xs text-base-400">on</span>
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium px-2 py-0.5 rounded bg-base-100 dark:bg-base-800 text-descript-700 dark:text-descript-300">
                          {np.platformName} ({np.platformDomain})
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono text-[10px]">
                          {np.status}
                        </span>
                      </div>
                      <div className="text-xs text-base-500 flex items-center gap-3">
                        <span>Action: <strong className="font-mono text-base-800 dark:text-base-200">{np.action}</strong></span>
                        {np.resource && <span>Resource: <code className="font-mono text-[11px]">{np.resource}</code></span>}
                        {np.ipAddress && <span>IP: {np.ipAddress}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-base-400 block">{formatRelativeTime(np.createdAt)}</span>
                      <span className="text-[10px] font-mono text-base-500">{truncateMiddle(np.id, 8, 6)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: AGENT MESSAGING */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-base-950 dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-descript-600 dark:text-descript-400" />
                <span>Agent-to-Agent Communications</span>
              </h2>
              <p className="text-xs text-base-500">
                Direct, cryptographically signed messages exchanged between agents in your network.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Select Agent Mailbox"
                value={selectedAgentForMessages}
                onChange={(e) => {
                  setSelectedAgentForMessages(e.target.value);
                  fetchMessages(e.target.value);
                }}
                className="px-3 py-1.5 rounded-lg border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-xs font-medium"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.byteNetwork})
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className={`h-3.5 w-3.5 ${messagesLoading ? 'animate-spin' : ''}`} />}
                onClick={() => fetchMessages(selectedAgentForMessages)}
              >
                Refresh
              </Button>
            </div>
          </div>

          {messagesLoading ? (
            <div className="double-bezel animate-pulse">
              <div className="double-bezel-inner h-64 p-6" />
            </div>
          ) : messages.length === 0 ? (
            <div className="double-bezel">
              <div className="double-bezel-inner p-10 text-center">
                <Mail className="h-10 w-10 text-base-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-base-900 dark:text-white mb-1">No messages in mailbox</h3>
                <p className="text-xs text-base-500 max-w-md mx-auto">
                  Agents send and receive messages programmatically through <code className="font-mono text-xs">client.messages.send(...)</code> using the Python SDK.
                </p>
              </div>
            </div>
          ) : (
            <div className="double-bezel overflow-hidden">
              <div className="double-bezel-inner divide-y divide-base-200 dark:divide-base-800">
                {messages.map((m) => (
                  <div key={m.id} className="p-4 space-y-2 hover:bg-base-50/50 dark:hover:bg-base-900/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-base-900 dark:text-white">
                          {m.senderAgentName || m.senderAgentId}
                        </span>
                        <ArrowRight className="h-3 w-3 text-base-400" />
                        <span className="font-semibold text-sm text-base-900 dark:text-white">
                          {m.recipientAgentName || m.recipientAgentId}
                        </span>
                        {m.subject && (
                          <span className="font-medium text-xs text-descript-700 dark:text-descript-300 ml-2">
                            [{m.subject}]
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-base-400">{formatRelativeTime(m.createdAt)}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 font-mono text-xs text-base-800 dark:text-base-200 whitespace-pre-wrap">
                      {m.content}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-base-400">
                      <span>Status: <strong className="capitalize">{m.status}</strong></span>
                      <span className="font-mono truncate max-w-xs">Sig: {m.signature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: PLATFORM OTP SESSIONS */}
      {activeTab === 'auth-sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-base-950 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-descript-600 dark:text-descript-400" />
                <span>Pending Platform Verification Sessions</span>
              </h2>
              <p className="text-xs text-base-500">
                Live OTP codes requested by third-party platforms for your network and agents.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`h-3.5 w-3.5 ${authSessionsLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchAuthSessions}
            >
              Refresh
            </Button>
          </div>

          {authSessionsLoading ? (
            <div className="double-bezel animate-pulse">
              <div className="double-bezel-inner h-64 p-6" />
            </div>
          ) : authSessions.length === 0 ? (
            <div className="double-bezel">
              <div className="double-bezel-inner p-10 text-center">
                <Activity className="h-10 w-10 text-base-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-base-900 dark:text-white mb-1">No pending verification sessions</h3>
                <p className="text-xs text-base-500 max-w-md mx-auto">
                  When a platform requests an OTP code via <code className="font-mono text-xs">POST /auth/platform/code/request</code>, it streams and shows here until claimed.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {authSessions.map((s) => (
                <div key={s.authSessionId} className="double-bezel">
                  <div className="double-bezel-inner p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-base-400 tracking-wider">
                        {s.platformName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        {s.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-base-950 text-white flex items-center justify-between font-mono text-base font-bold">
                      <span>{s.userCode}</span>
                      <CopyButton text={s.userCode} label="Copy Code" />
                    </div>

                    <div className="text-xs text-base-500 space-y-1">
                      <div>Domain: <code className="font-mono text-base-800 dark:text-base-200">{s.platformDomain}</code></div>
                      <div>Scopes: {s.requestedScopes.join(', ') || 'all'}</div>
                      <div>Expires: {formatRelativeTime(s.expiresAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
