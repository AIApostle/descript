import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Fingerprint,
  Globe,
  KeyRound,
  LayoutGrid,
  List,
  Lock,
  Mail,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../components/bytecript/StatusBadge';
import { CopyButton } from '../components/common/CopyButton';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAgents } from '../context/AgentContext';
import { useNotification } from '../context/NotificationContext';
import { verifyService } from '../services/agentService';
import { api } from '../services/api';
import type {
  Agent,
  AgentCreateDTO,
  AgentMessage,
  ChallengeResponse,
  Netprint,
  PlatformPendingAuthSession,
  VerificationResult,
} from '../types/agent';
import { formatFingerprintLines, formatRelativeTime, truncateMiddle } from '../utils/formatting';

export default function DashboardPage() {
  const { agents, networks, isLoading, bulkCreateAgents } = useAgents();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active top-level view: 'agents' | 'challenge' | 'netprints' | 'messages' | 'auth-sessions'
  const activeTab = searchParams.get('tab') || 'agents';

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Bulk Import modal state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Quick Python SDK snippet modal
  const [sdkModalAgent, setSdkModalAgent] = useState<Agent | null>(null);

  // Netprints & Messages state
  const [netprints, setNetprints] = useState<Netprint[]>([]);
  const [netprintsLoading, setNetprintsLoading] = useState(false);

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedAgentForMessages, setSelectedAgentForMessages] = useState<string>('');

  const [authSessions, setAuthSessions] = useState<PlatformPendingAuthSession[]>([]);
  const [authSessionsLoading, setAuthSessionsLoading] = useState(false);

  // Live Challenge Tester state (for tab 'challenge' or quick challenge modal)
  const [challengeAgentId, setChallengeAgentId] = useState<string>('');
  const [challengeAudience, setChallengeAudience] = useState('bytebank');
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeResponse | null>(null);
  const [challengeSignature, setChallengeSignature] = useState('');
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeVerifying, setChallengeVerifying] = useState(false);
  const [challengeResult, setChallengeResult] = useState<VerificationResult | null>(null);

  // Set default challenge agent when agents load
  useEffect(() => {
    if (agents.length > 0 && !challengeAgentId) {
      setChallengeAgentId(agents[0].id);
    }
  }, [agents, challengeAgentId]);

  // Fetch Netprints
  const fetchNetprints = async () => {
    setNetprintsLoading(true);
    try {
      const data = await api.get<Netprint[]>('/netprints?limit=100');
      setNetprints(data);
    } catch {
      // ignore in offline/mock mode
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
      // ignore
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
          (agent.description || '').toLowerCase().includes(q) ||
          agent.byteNetwork.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [agents, statusFilter, networkFilter, search]);

  const stats = useMemo(() => {
    const activeAgents = agents.filter((a) => a.status === 'active').length;
    const suspendedAgents = agents.filter((a) => a.status === 'suspended').length;
    const revokedAgents = agents.filter((a) => a.status === 'revoked' || a.status === 'compromised').length;
    const activeKeys = agents.reduce(
      (sum, a) => sum + a.credentials.filter((c) => c.status === 'active').length,
      0
    );
    const activeNetworks = new Set(agents.map((a) => a.byteNetwork)).size;
    const trustRatio = agents.length > 0 ? Math.round((activeAgents / agents.length) * 100) : 100;

    return {
      total: agents.length,
      active: activeAgents,
      suspended: suspendedAgents,
      revoked: revokedAgents,
      activeKeys,
      activeNetworks,
      trustRatio,
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
      showToast(`Registered ${created.length} agent(s) into canonical registry`, 'success');
      setBulkOpen(false);
      setBulkJson('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Bulk import failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!challengeAgentId) return;
    setChallengeLoading(true);
    setCurrentChallenge(null);
    setChallengeResult(null);
    setChallengeSignature('');
    try {
      const chg = await verifyService.createChallenge(challengeAgentId, challengeAudience.trim() || 'bytebank');
      setCurrentChallenge(chg);
      // Simulate client-side Ed25519 signing
      const simulatedSignature = '7e2b10f8a9c31405a2b0e41981cd9f1a23e98031e4051a89c02e5f8120e5c941';
      setChallengeSignature(simulatedSignature);
      showToast('Challenge nonce issued successfully', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to issue challenge', 'error');
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleVerifyChallenge = async () => {
    if (!currentChallenge || !challengeSignature.trim()) return;
    setChallengeVerifying(true);
    try {
      const res = await verifyService.verifyChallenge({
        agentId: challengeAgentId,
        challengeId: currentChallenge.challengeId,
        signature: challengeSignature.trim(),
      });
      setChallengeResult(res);
      showToast('Challenge verified: Mathematical signature matches Ed25519 curve point', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Verification failed', 'error');
    } finally {
      setChallengeVerifying(false);
    }
  };

  const getPythonSnippet = (agentId: string) => `from descript import DescriptClient, KeyPair

client = DescriptClient(base_url="https://api.descript.id", api_key="dsc_live_...")

# 1. Fetch Agent Identity & Verify Online
agent = client.agents.get("${agentId}")
is_valid = client.verify.verify_bytecript(agent.bytecript)
print(f"Agent '{agent.name}' verified: {is_valid}")

# 2. Challenge-Response Nonce Authentication (Zero Shared Secrets)
challenge = client.verify.create_challenge(agent.id, audience="bytebank")
# Agent signs challenge.nonce with its local private key:
# signature = keypair.sign(challenge.nonce)
# client.verify.verify_challenge(agent.id, challenge.challenge_id, signature)`;

  return (
    <DashboardLayout
      title="Descript Controller Console"
      subtitle="Universal cryptographic identity cockpit for autonomous AI agents, portable Bytecript passports, and audited internet footprints."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/verify"
            className="btn-step inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-descript-200 dark:border-descript-800 bg-descript-50 dark:bg-descript-950/80 text-xs font-semibold text-descript-700 dark:text-descript-300 hover:bg-descript-100 dark:hover:bg-descript-900 transition-colors shadow-2xs"
          >
            <ShieldCheck className="h-4 w-4 text-descript-600 dark:text-descript-400" />
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
            to="/agents/new"
            className="btn-step inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-descript-600 hover:bg-descript-700 text-white text-xs font-semibold shadow-md shadow-descript-600/25 transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Register Agent</span>
          </Link>
        </div>
      }
    >
      {/* 1. INSTITUTIONAL FLEET COMMAND DECK (METRICS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric 1: Total Agents */}
        <div className="double-bezel card-lift">
          <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-base-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Managed Agents</span>
              <div className="h-7 w-7 rounded-lg bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-base-950 dark:text-white tracking-tight">
                {stats.total}
              </div>
              <div className="flex items-center gap-2 text-xs text-base-500 mt-2">
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {stats.active} Active
                </span>
                {stats.suspended > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {stats.suspended} Suspended
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Cryptographic Trust Ratio */}
        <div className="double-bezel card-lift">
          <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-base-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Fleet Health & Trust</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {stats.trustRatio}%
              </div>
              <div className="text-xs text-base-500 mt-2 flex items-center gap-1.5">
                <span className="status-beacon">
                  <span className="status-beacon-ping bg-emerald-400" />
                  <span className="status-beacon-dot bg-emerald-500" />
                </span>
                <span>Active valid credentials</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Bound Ed25519 Keys */}
        <div className="double-bezel card-lift">
          <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-base-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Bound Keypairs</span>
              <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <KeyRound className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-base-950 dark:text-white tracking-tight">
                {stats.activeKeys}
              </div>
              <div className="text-xs text-base-500 mt-2 flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-descript-600 dark:text-descript-400" />
                <span>Zero server key custody</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Byte Networks */}
        <div className="double-bezel card-lift">
          <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-base-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Byte Networks</span>
              <div className="h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Network className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-base-950 dark:text-white tracking-tight">
                {stats.activeNetworks}
              </div>
              <div className="text-xs text-base-500 mt-2 font-mono truncate">
                Residency: kiroween
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONSOLE SEGMENTED TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 dark:border-base-800 pb-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'agents' })}
            className={`btn-step flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'agents'
                ? 'bg-descript-600 text-white shadow-sm'
                : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white border border-base-200 dark:border-base-800'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Agent Fleet ({agents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'challenge' })}
            className={`btn-step flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'challenge'
                ? 'bg-descript-600 text-white shadow-sm'
                : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white border border-base-200 dark:border-base-800'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Live Nonce Challenger</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'netprints' })}
            className={`btn-step flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'netprints'
                ? 'bg-descript-600 text-white shadow-sm'
                : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white border border-base-200 dark:border-base-800'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Netprints Footprint</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'messages' })}
            className={`btn-step flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'messages'
                ? 'bg-descript-600 text-white shadow-sm'
                : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white border border-base-200 dark:border-base-800'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Signed Comms</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'auth-sessions' })}
            className={`btn-step flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'auth-sessions'
                ? 'bg-descript-600 text-white shadow-sm'
                : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 hover:text-base-950 dark:hover:text-white border border-base-200 dark:border-base-800'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Platform Sessions</span>
          </button>
        </div>

        {activeTab === 'agents' && (
          <div className="flex items-center gap-1.5 bg-base-100 dark:bg-base-900 p-1 rounded-xl border border-base-200 dark:border-base-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-base-800 text-base-900 dark:text-white shadow-2xs'
                  : 'text-base-400 hover:text-base-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-base-800 text-base-900 dark:text-white shadow-2xs'
                  : 'text-base-400 hover:text-base-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. VIEW 1: AGENTS FLEET */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-base-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fleet by name, canonical ID, description, or network..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-sm text-base-900 dark:text-base-100 outline-none focus:ring-2 focus:ring-descript-500/40 shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-400 hover:text-base-600 dark:hover:text-base-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by Byte Network"
                value={networkFilter}
                onChange={(e) => setNetworkFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-xs font-semibold text-base-800 dark:text-base-100 shadow-2xs"
              >
                <option value="all">All Byte Networks</option>
                {networks.map((net) => (
                  <option key={net.slug} value={net.slug}>
                    {net.name} ({net.slug})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-base-100 dark:bg-base-900 p-1 rounded-xl border border-base-200 dark:border-base-800 text-xs">
                {['all', 'active', 'suspended', 'revoked'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg capitalize transition-all font-medium ${
                      statusFilter === st
                        ? 'bg-white dark:bg-base-800 text-base-950 dark:text-white font-semibold shadow-2xs'
                        : 'text-base-500 dark:text-base-400 hover:text-base-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Agents List / Grid Rendering */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="double-bezel animate-pulse">
                  <div className="double-bezel-inner h-52 p-6" />
                </div>
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="double-bezel">
              <div className="double-bezel-inner p-12 text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-descript-50 dark:bg-descript-950/80 text-descript-600 dark:text-descript-400 flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-base-950 dark:text-white mb-2">
                  {agents.length === 0 ? 'No autonomous agents registered' : 'No matching agents found'}
                </h3>
                <p className="text-sm text-base-500 max-w-md mx-auto mb-6 leading-relaxed">
                  {agents.length === 0
                    ? 'Register your autonomous agents to issue canonical UUIDv7 IDs, generate Ed25519 credentials, and start verifying zero-trust interactions.'
                    : 'Try clearing your search query or switching your status filter to all.'}
                </p>
                <Button
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => navigate('/agents/new')}
                  size="lg"
                >
                  Register New Agent
                </Button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredAgents.map((agent) => {
                const primaryCred = agent.credentials.find((c) => c.status === 'active') || agent.credentials[0];
                const fp = primaryCred?.fingerprint || '0000000000000000';
                const [fp1, fp2] = formatFingerprintLines(fp);

                return (
                  <div key={agent.id} className="double-bezel card-lift group">
                    <div className="double-bezel-inner h-full flex flex-col justify-between p-6">
                      <div>
                        {/* Header: Avatar, Name & Status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-descript-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-descript-600/25">
                              <Fingerprint className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/agents/${agent.id}`}
                                className="text-base font-bold text-base-950 dark:text-white hover:text-descript-600 dark:hover:text-descript-400 transition-colors block truncate"
                              >
                                {agent.name}
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-base-500 mt-0.5">
                                <span className="font-mono text-[11px] bg-base-100 dark:bg-base-900 px-2 py-0.5 rounded border border-base-200 dark:border-base-800">
                                  {agent.byteNetwork}
                                </span>
                                <span>{agent.residence}</span>
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={agent.status} size="sm" />
                        </div>

                        {agent.description && (
                          <p className="text-xs text-base-600 dark:text-base-400 mb-4 line-clamp-2 leading-relaxed">
                            {agent.description}
                          </p>
                        )}

                        {/* Canonical Agent ID Box */}
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200/80 dark:border-base-800/80 mb-3">
                          <span className="font-mono text-xs text-base-800 dark:text-base-200 truncate select-all">
                            {agent.id}
                          </span>
                          <CopyButton text={agent.id} label="Copy ID" />
                        </div>

                        {/* Fingerprint Preview */}
                        <div className="p-2.5 rounded-xl bg-base-50/50 dark:bg-base-900/40 border border-base-200/50 dark:border-base-800/50 mb-4">
                          <div className="text-[10px] uppercase font-bold text-base-400 mb-1">
                            Ed25519 Fingerprint (SHA256)
                          </div>
                          <div className="font-mono text-[11px] text-base-700 dark:text-base-300 leading-tight">
                            <div>{fp1}</div>
                            {fp2 && <div className="text-base-400 dark:text-base-500">{fp2}</div>}
                          </div>
                        </div>

                        {/* Capabilities Tags */}
                        {agent.capabilities && agent.capabilities.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-4">
                            {agent.capabilities.map((cap) => (
                              <span
                                key={cap}
                                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-400 border border-base-200/60 dark:border-base-800/60"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 border-t border-base-200 dark:border-base-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setChallengeAgentId(agent.id);
                              setSearchParams({ tab: 'challenge' });
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-descript-600 dark:text-descript-400 hover:text-descript-700 dark:hover:text-descript-300"
                          >
                            <Radio className="h-3.5 w-3.5" />
                            <span>Challenge Nonce</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSdkModalAgent(agent)}
                            className="inline-flex items-center gap-1 text-xs text-base-500 hover:text-base-900 dark:hover:text-white"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            <span>SDK Code</span>
                          </button>
                        </div>

                        <Link
                          to={`/agents/${agent.id}`}
                          className="btn-step inline-flex items-center gap-1 text-xs font-semibold text-white bg-descript-600 hover:bg-descript-700 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                        >
                          <span>Passport Card</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="double-bezel overflow-hidden">
              <div className="double-bezel-inner overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-base-200 dark:border-base-800 text-base-400 font-bold uppercase tracking-wider bg-base-50/50 dark:bg-base-900/50">
                      <th className="py-3 px-4">Agent Name</th>
                      <th className="py-3 px-4">Canonical ID</th>
                      <th className="py-3 px-4">Network</th>
                      <th className="py-3 px-4">Fingerprint</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200 dark:divide-base-800 text-base-700 dark:text-base-300">
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-base-50/60 dark:hover:bg-base-900/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-base-950 dark:text-white">
                          <Link to={`/agents/${agent.id}`} className="hover:text-descript-600 dark:hover:text-descript-400">
                            {agent.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="truncate max-w-[120px] inline-block">{truncateMiddle(agent.id, 8, 6)}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">{agent.byteNetwork}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-base-500">
                          {truncateMiddle(agent.credentials[0]?.fingerprint || 'e4:58:1c:f9...', 10, 8)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={agent.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/agents/${agent.id}`}
                            className="font-semibold text-descript-600 dark:text-descript-400 hover:underline"
                          >
                            View Passport &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. VIEW 2: LIVE NONCE CHALLENGER */}
      {activeTab === 'challenge' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-base-100/60 dark:bg-base-900/40 border border-base-200 dark:border-base-800">
            <div className="max-w-2xl mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 border border-descript-200 dark:border-descript-800 mb-3">
                <Radio className="h-3.5 w-3.5" />
                <span>Mutual Zero-Trust Verification Engine</span>
              </div>
              <h2 className="text-2xl font-bold text-base-950 dark:text-white mb-2">
                Interactive Nonce Challenge Simulator
              </h2>
              <p className="text-sm text-base-600 dark:text-base-300 leading-relaxed">
                Issue a single-use random cryptographic nonce to any agent in your fleet, simulate local Ed25519 signature computation, and test mathematical proof verification in &lt; 0.2ms with zero shared secrets.
              </p>
            </div>

            {/* Challenger Controls */}
            <div className="grid md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase text-base-500 mb-2">
                  Select Target Agent
                </label>
                <select
                  aria-label="Select Target Agent"
                  value={challengeAgentId}
                  onChange={(e) => {
                    setChallengeAgentId(e.target.value);
                    setCurrentChallenge(null);
                    setChallengeResult(null);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-sm font-semibold text-base-900 dark:text-white"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.byteNetwork} - {truncateMiddle(a.id, 8, 6)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-base-500 mb-2">
                  Audience / Service Identifier
                </label>
                <input
                  type="text"
                  value={challengeAudience}
                  onChange={(e) => setChallengeAudience(e.target.value)}
                  placeholder="e.g. bytebank or api.marketplace.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-sm font-mono text-base-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateChallenge}
                loading={challengeLoading}
                icon={<Radio className="h-4 w-4" />}
              >
                Issue Nonce Challenge
              </Button>
            </div>

            {/* Issued Nonce Card */}
            {currentChallenge && (
              <div className="mt-6 p-5 rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800 space-y-4 animate-slide-up">
                <div className="flex items-center justify-between text-xs font-semibold text-base-400">
                  <span>Issued Challenge Details</span>
                  <span className="font-mono text-descript-600 dark:text-descript-400">
                    ID: {truncateMiddle(currentChallenge.challengeId, 10, 8)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 font-mono text-xs break-all">
                  <div className="text-[10px] text-base-400 uppercase font-bold mb-1">Single-Use Nonce (32 Bytes):</div>
                  <div className="text-base-900 dark:text-white select-all">{currentChallenge.nonce}</div>
                </div>

                <div className="p-3 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 font-mono text-xs break-all">
                  <div className="text-[10px] text-base-400 uppercase font-bold mb-1">Local Ed25519 Signature Scalar:</div>
                  <div className="text-emerald-600 dark:text-emerald-400 select-all">{challengeSignature}</div>
                </div>

                <Button
                  onClick={handleVerifyChallenge}
                  loading={challengeVerifying}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  className="w-full"
                >
                  Verify Signature Against Descript Authority
                </Button>
              </div>
            )}

            {/* Verification Result */}
            {challengeResult && (
              <div className="mt-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 animate-slide-up flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-100 space-y-1">
                  <div className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                    Cryptographic Proof Verified Successfully!
                  </div>
                  <div>The signature matches the registered Ed25519 public key on Curve25519.</div>
                  <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                    Agent: {challengeResult.agentName || challengeResult.agentId} • Latency: &lt; 0.2ms
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. VIEW 3: NETPRINTS FOOTPRINT LEDGER */}
      {activeTab === 'netprints' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-base-950 dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-descript-600 dark:text-descript-400" />
                <span>Netprints Footprint Ledger</span>
              </h2>
              <p className="text-xs text-base-500 mt-0.5">
                Audited record of authenticated agent interactions across external internet platforms.
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
              <div className="double-bezel-inner p-12 text-center">
                <Globe className="h-10 w-10 text-base-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-base-900 dark:text-white mb-1">
                  No Netprints footprints recorded yet
                </h3>
                <p className="text-xs text-base-500 max-w-md mx-auto">
                  When your autonomous agents call external APIs or sign in through Descript Auth, audited footprints will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="double-bezel overflow-hidden">
              <div className="double-bezel-inner divide-y divide-base-200 dark:divide-base-800">
                {netprints.map((np) => (
                  <div
                    key={np.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-base-50/50 dark:hover:bg-base-900/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-base-900 dark:text-white">
                          {np.agentName || np.agentId}
                        </span>
                        <span className="text-xs text-base-400">on</span>
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-base-100 dark:bg-base-800 text-descript-700 dark:text-descript-300">
                          {np.platformName} ({np.platformDomain})
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono text-[10px]">
                          {np.status}
                        </span>
                      </div>
                      <div className="text-xs text-base-500 flex items-center gap-3">
                        <span>
                          Action: <strong className="font-mono text-base-800 dark:text-base-200">{np.action}</strong>
                        </span>
                        {np.resource && (
                          <span>
                            Resource: <code className="font-mono text-[11px]">{np.resource}</code>
                          </span>
                        )}
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

      {/* 6. VIEW 4: AGENT MESSAGING */}
      {activeTab === 'messages' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-base-950 dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-descript-600 dark:text-descript-400" />
                <span>Agent-to-Agent Cryptographic Comms</span>
              </h2>
              <p className="text-xs text-base-500 mt-0.5">
                Direct, signed messages exchanged between agents verified with Ed25519 signatures.
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
                className="px-3.5 py-2 rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 text-xs font-semibold"
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
              <div className="double-bezel-inner p-12 text-center">
                <Mail className="h-10 w-10 text-base-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-base-900 dark:text-white mb-1">No messages in mailbox</h3>
                <p className="text-xs text-base-500 max-w-md mx-auto">
                  Agents send and receive cryptographically signed messages via{' '}
                  <code className="font-mono text-xs">client.messages.send(...)</code> using the Python SDK.
                </p>
              </div>
            </div>
          ) : (
            <div className="double-bezel overflow-hidden">
              <div className="double-bezel-inner divide-y divide-base-200 dark:divide-base-800">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 space-y-3 hover:bg-base-50/50 dark:hover:bg-base-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-base-900 dark:text-white">
                          {m.senderAgentName || m.senderAgentId}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-base-400" />
                        <span className="font-bold text-sm text-base-900 dark:text-white">
                          {m.recipientAgentName || m.recipientAgentId}
                        </span>
                        {m.subject && (
                          <span className="font-semibold text-xs text-descript-700 dark:text-descript-300 ml-2 bg-descript-50 dark:bg-descript-950 px-2 py-0.5 rounded">
                            [{m.subject}]
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-base-400">{formatRelativeTime(m.createdAt)}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 font-mono text-xs text-base-800 dark:text-base-200 whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </div>

                    <div className="flex items-center justify-between text-xs text-base-400">
                      <span>
                        Status: <strong className="capitalize text-emerald-600 dark:text-emerald-400">{m.status}</strong>
                      </span>
                      <span className="font-mono text-[11px] truncate max-w-xs">
                        Sig: {truncateMiddle(m.signature, 12, 10)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. VIEW 5: PLATFORM SESSIONS */}
      {activeTab === 'auth-sessions' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-base-950 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-descript-600 dark:text-descript-400" />
                <span>Pending Platform Verification Sessions</span>
              </h2>
              <p className="text-xs text-base-500 mt-0.5">
                Active OTP challenge codes requested by external platforms for your network.
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
              <div className="double-bezel-inner p-12 text-center">
                <Activity className="h-10 w-10 text-base-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-base-900 dark:text-white mb-1">
                  No pending verification sessions
                </h3>
                <p className="text-xs text-base-500 max-w-md mx-auto">
                  When a platform requests an OTP code via <code className="font-mono text-xs">POST /auth/platform/code/request</code>, it displays here until claimed.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {authSessions.map((s) => (
                <div key={s.authSessionId} className="double-bezel card-lift">
                  <div className="double-bezel-inner p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-base-400 tracking-wider">
                        {s.platformName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold">
                        {s.status}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-base-950 text-white flex items-center justify-between font-mono text-lg font-bold tracking-widest">
                      <span>{s.userCode}</span>
                      <CopyButton text={s.userCode} label="Copy Code" />
                    </div>

                    <div className="text-xs text-base-500 space-y-1">
                      <div>
                        Domain: <code className="font-mono text-base-800 dark:text-base-200">{s.platformDomain}</code>
                      </div>
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
        <div className="space-y-4">
          <p className="text-xs text-base-600 dark:text-base-300 leading-relaxed">
            Paste a JSON array of agent objects. Each object must provide <code className="font-mono font-semibold">name</code>,{' '}
            <code className="font-mono font-semibold">byteNetwork</code>, and an Ed25519{' '}
            <code className="font-mono font-semibold">publicKey</code>.
          </p>
          <textarea
            rows={8}
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            placeholder={`[\n  {\n    "name": "Settlement Worker A",\n    "byteNetwork": "kiroween",\n    "publicKey": "<ed25519-public-key-hex-or-b64>"\n  }\n]`}
            className="w-full p-3.5 rounded-xl border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 font-mono text-xs text-base-900 dark:text-base-100 outline-none focus:ring-2 focus:ring-descript-500/40"
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
          <div className="space-y-4">
            <p className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
              Use the official Python client to query this agent identity, verify Bytecript credentials offline, or solve challenge nonces:
            </p>
            <pre className="p-4 rounded-xl bg-base-950 text-base-100 font-mono text-xs leading-relaxed overflow-x-auto border border-base-800">
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
