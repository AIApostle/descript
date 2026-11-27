import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Code2,
  Cpu,
  Fingerprint,
  Key,
  Layers,
  Lock,
  Plus,
  Radio,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CopyButton } from '../components/common/CopyButton';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import Footer from '../components/layout/Footer';
import Navigation from '../components/layout/Navigation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiKeyService, healthService, verifyService } from '../services/agentService';
import type { ApiKey, ApiKeyCreateResponse, HealthStatus, IssuerInfo } from '../types/agent';
import { formatRelativeTime } from '../utils/formatting';

type DocTab = 'quickstart' | 'sdk' | 'verifier' | 'api' | 'standards' | 'keys';

const PYTHON_QUICKSTART = `from descript import DescriptClient, KeyPair

# 1. Generate an Ed25519 keypair locally (private key never leaves your machine)
keypair = KeyPair.generate()
keypair.save_pem("agent_key.pem")

# 2. Register the agent with your Descript API key
with DescriptClient(base_url="https://api.descript.id", api_key="dsc_live_...") as client:
    agent = client.agents.create(
        name="Settlement Sentinel",
        description="Autonomous reconciliation agent",
        byte_network="kiroween",
        public_key=keypair.public_key_b64,
        capabilities=["reconcile", "sign"],
    )
    print("Assigned Canonical ID:", agent.id)
    print("Bytecript Version:", agent.bytecript.version)

    # 3. Authenticate with an external service (e.g. Bytebank) via challenge-response
    result = client.verify.authenticate_with_keypair(
        agent_id=agent.id,
        keypair=keypair,
        audience="bytebank",
    )
    assert result.verified is True
    print("Agent successfully authenticated with zero shared secrets!")`;

const PYTHON_SDK_FULL = `from descript import DescriptClient, AsyncDescriptClient, KeyPair

# --- Client Initialization ---
# Synchronous client (suitable for scripts, Celery workers, CLI tools):
client = DescriptClient(base_url="https://api.descript.id", api_key="dsc_live_...")

# Or asynchronous client (for FastAPI, asyncio, CrewAI, AutoGen daemons):
# async_client = AsyncDescriptClient(base_url="https://api.descript.id", api_key="dsc_live_...")

# --- Local Keypair Lifecycle (Zero Custody) ---
# Generate pure Curve25519 / Ed25519 keypair:
keypair = KeyPair.generate()
pem_str = keypair.to_pem()
keypair.save_pem("secure_agent.pem")

# Later reload from disk or environment variable:
loaded_keypair = KeyPair.from_pem_file("secure_agent.pem")

# --- Agent Management ---
agent = client.agents.create(
    name="Payment Settlement Bot",
    description="Processes automated settlement invoices",
    byte_network="kiroween",
    public_key=loaded_keypair.public_key_b64,
)

# Fetch Bytecript passport:
passport = client.bytecript.get(agent.id)
print(f"Controller Verified: {passport.controller_verified}")

# --- Key Rotation (Zero Downtime) ---
new_keypair = KeyPair.generate()
rotated_cred = client.credentials.rotate(
    agent_id=agent.id,
    new_public_key=new_keypair.public_key_b64,
)
print("Rotated credential active:", rotated_cred.status)`;

const PYTHON_SERVICE_VERIFY = `from descript import DescriptClient, verify_bytecript_signature, KeyPair

# --- Approach A: Sub-Millisecond Offline Verification ---
# Relying services can verify agent signatures using public cryptography alone:
def verify_agent_request_offline(public_key_b64: str, nonce: str, signature_b64: str) -> bool:
    # Uses pure Ed25519 algebra (no HTTP requests, < 0.2ms latency)
    return KeyPair.verify_signature(
        public_key_b64=public_key_b64,
        message=nonce.encode("utf-8"),
        signature_b64=signature_b64
    )

# --- Approach B: Online Registry Verification ---
# Verifies Bytecript passport validity & checks live suspension / revocation:
with DescriptClient(base_url="https://api.descript.id") as client:
    # 1. Resolve agent profile from public registry
    agent = client.agents.get_public("agent_01936a4e8c207f1ab8492e1f4c73b091")
    if agent.status != "active":
        raise PermissionError(f"Agent identity status is {agent.status}")

    # 2. Verify Bytecript controller signature
    assert verify_bytecript_signature(agent.bytecript), "Bytecript passport tampered!"

    # 3. Issue a single-use random nonce challenge
    challenge = client.verify.create_challenge(agent.id, audience="bytebank")
    
    # 4. Agent signs challenge.nonce with its private key and returns signature.
    # Service verifies the response:
    verified = client.verify.verify_challenge(
        agent_id=agent.id,
        challenge_id=challenge.challenge_id,
        signature=agent_response_signature,
    )
    print("Authentication confirmed:", verified)`;

const CURL_REGISTER = `curl -X POST https://api.descript.id/api/v1/agents \\
  -H "Authorization: Bearer dsc_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Settlement Worker",
    "description": "Cross-network settlement daemon",
    "byteNetwork": "kiroween",
    "publicKey": "a4b8fc207f1ab8492e1f4c73b091e0eaff8193f83730a3f0f5ffc7d7fe312e81"
  }'`;

const CURL_CHALLENGE = `curl -X POST https://api.descript.id/api/v1/challenges \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "agent_01936a4e8c207f1ab8492e1f4c73b091",
    "audience": "bytebank"
  }'`;

export default function DevelopersPage() {
  const { isAuthenticated } = useAuth();
  const { showToast, showConfirm } = useNotification();

  const [activeTab, setActiveTab] = useState<DocTab>('quickstart');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState<ApiKeyCreateResponse | null>(null);
  const [issuer, setIssuer] = useState<IssuerInfo | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const loadKeys = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const list = await apiKeyService.list();
      setApiKeys(list);
    } catch {
      // Non-fatal
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadKeys();
    verifyService.getIssuer().then(setIssuer).catch(() => {});
    healthService.check().then(setHealth).catch(() => {});
  }, [loadKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const created = await apiKeyService.create(newKeyName.trim());
      setJustCreatedKey(created);
      setNewKeyName('');
      await loadKeys();
      showToast('API key created', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create API key', 'error');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (key: ApiKey) => {
    const ok = await showConfirm({
      title: 'Revoke API Key?',
      message: `Any Python SDK scripts or services using "${key.name}" (${key.keyPrefix}...) will immediately fail authentication.`,
      confirmLabel: 'Revoke Key',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await apiKeyService.revoke(key.id);
      await loadKeys();
      showToast('API key revoked', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to revoke key', 'error');
    }
  };

  const content = (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-base-200 dark:border-base-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-descript-50 dark:bg-descript-950/80 text-descript-700 dark:text-descript-300 border border-descript-200/80 dark:border-descript-800/80 mb-4">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Documentation & Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-base-950 dark:text-white mb-3">
          Descript Developer Documentation
        </h1>
        <p className="text-base sm:text-lg text-base-600 dark:text-base-300 max-w-3xl leading-relaxed">
          The comprehensive guide to integrating autonomous agent cryptographic identity, zero-custody Ed25519 signing, portable Bytecript credentials, and mutual zero-trust verification.
        </p>

        {/* Global Nav Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-base-200/60 dark:border-base-800/60">
          {[
            { id: 'quickstart', label: 'Quickstart (3-Min)', icon: <Terminal className="h-4 w-4" /> },
            { id: 'sdk', label: 'Python SDK Guide', icon: <Code2 className="h-4 w-4" /> },
            { id: 'verifier', label: 'Verifier Integration', icon: <ShieldCheck className="h-4 w-4" /> },
            { id: 'api', label: 'REST API Specs', icon: <Server className="h-4 w-4" /> },
            { id: 'standards', label: 'Cryptography & Standards', icon: <Layers className="h-4 w-4" /> },
            { id: 'keys', label: 'API Keys & Access', icon: <Key className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DocTab)}
              className={`btn-step flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-descript-600 text-white shadow-md shadow-descript-600/25'
                  : 'bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-300 hover:text-base-900 dark:hover:text-white border border-base-200 dark:border-base-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: QUICKSTART */}
      {activeTab === 'quickstart' && (
        <div className="space-y-8 animate-fade-in">
          {/* Conceptual 4-Step Diagram */}
          <div className="p-6 sm:p-8 rounded-3xl bg-base-100/60 dark:bg-base-900/40 border border-base-200 dark:border-base-800">
            <h2 className="text-xl font-bold text-base-950 dark:text-white mb-2">
              The 4-Step Zero-Trust Lifecycle
            </h2>
            <p className="text-sm text-base-600 dark:text-base-300 mb-6 max-w-2xl">
              Descript replaces static API tokens and passwords with mathematical asymmetric cryptography:
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800">
                <div className="h-7 w-7 rounded-lg bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center font-bold text-xs mb-3">
                  01
                </div>
                <div className="font-bold text-sm text-base-950 dark:text-white mb-1">
                  Register ID
                </div>
                <div className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                  Descript assigns an immutable, timestamp-ordered UUIDv7 Agent ID inside a governed Byte Network.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800">
                <div className="h-7 w-7 rounded-lg bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center font-bold text-xs mb-3">
                  02
                </div>
                <div className="font-bold text-sm text-base-950 dark:text-white mb-1">
                  Local Keypair
                </div>
                <div className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                  Ed25519 private key stays client-side in RAM or HSM. Only the public key binds to Descript.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800">
                <div className="h-7 w-7 rounded-lg bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center font-bold text-xs mb-3">
                  03
                </div>
                <div className="font-bold text-sm text-base-950 dark:text-white mb-1">
                  Bytecript Issued
                </div>
                <div className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                  Descript issues a digitally signed Bytecript passport credential embedding verifiable claims.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-base-900 border border-base-200 dark:border-base-800">
                <div className="h-7 w-7 rounded-lg bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center font-bold text-xs mb-3">
                  04
                </div>
                <div className="font-bold text-sm text-base-950 dark:text-white mb-1">
                  Mutual Verification
                </div>
                <div className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                  External services challenge the agent with a random nonce. The agent signs it to prove identity instantly.
                </div>
              </div>
            </div>
          </div>

          {/* Quickstart Code */}
          <Card
            title="Step-by-Step Python Quickstart"
            subtitle="Get an autonomous agent registered and verified in under 3 minutes."
          >
            <div className="space-y-6">
              {/* Step 1: Install */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-base-500 mb-2">
                  Step 1: Install the SDK
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-base-950 text-base-100 font-mono text-sm">
                  <div className="flex items-center gap-3">
                    <Terminal className="h-4 w-4 text-descript-400" />
                    <span>pip install descript</span>
                    <span className="text-base-500 hidden sm:inline"># or: uv add descript</span>
                  </div>
                  <CopyButton text="pip install descript" label="Copy" />
                </div>
              </div>

              {/* Step 2: Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-base-500">
                    Step 2: Generate Keys, Register & Authenticate
                  </div>
                  <CopyButton text={PYTHON_QUICKSTART} label="Copy Script" />
                </div>
                <pre className="p-4 rounded-2xl bg-base-950 text-base-100 font-mono text-xs overflow-x-auto leading-relaxed border border-base-800">
                  <code>{PYTHON_QUICKSTART}</code>
                </pre>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: PYTHON SDK FULL GUIDE */}
      {activeTab === 'sdk' && (
        <div className="space-y-8 animate-fade-in">
          <Card
            title="Complete Python SDK Reference"
            subtitle="Production-grade client supporting synchronous and asynchronous runtimes with full key lifecycle management."
          >
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-descript-50 dark:bg-descript-950/40 border border-descript-200/80 dark:border-descript-800/80 text-xs text-descript-800 dark:text-descript-200 flex items-start gap-3">
                <Shield className="h-4 w-4 shrink-0 mt-0.5 text-descript-600 dark:text-descript-400" />
                <div>
                  <span className="font-bold block">Zero-Custody Guarantee:</span>
                  Private keys are generated directly via pure Curve25519 algebra on the client machine. Secret keys are never sent to Descript servers or stored in any database.
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-base-900 dark:text-base-100">
                    SDK Client, Key Management & Key Rotation
                  </h3>
                  <CopyButton text={PYTHON_SDK_FULL} label="Copy Code" />
                </div>
                <pre className="p-4 rounded-2xl bg-base-950 text-base-100 font-mono text-xs overflow-x-auto leading-relaxed border border-base-800">
                  <code>{PYTHON_SDK_FULL}</code>
                </pre>
              </div>

              {/* Class & Methods Breakdown */}
              <div className="space-y-3 pt-4 border-t border-base-200 dark:border-base-800">
                <h4 className="text-sm font-bold text-base-950 dark:text-white">
                  Key SDK Primitives
                </h4>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800">
                    <span className="font-mono font-bold text-descript-600 dark:text-descript-400 block mb-1">
                      KeyPair.generate()
                    </span>
                    <span className="text-base-600 dark:text-base-400">
                      Creates a fresh Ed25519 keypair. Exports to PEM, Base64 public key, and SHA-256 fingerprint.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800">
                    <span className="font-mono font-bold text-descript-600 dark:text-descript-400 block mb-1">
                      client.agents.create(...)
                    </span>
                    <span className="text-base-600 dark:text-base-400">
                      Registers agent metadata, binds the public key, and receives an issued Bytecript credential.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800">
                    <span className="font-mono font-bold text-descript-600 dark:text-descript-400 block mb-1">
                      client.verify.authenticate_with_keypair(...)
                    </span>
                    <span className="text-base-600 dark:text-base-400">
                      Fetches a random challenge from the audience service, signs it in memory, and submits proof.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800">
                    <span className="font-mono font-bold text-descript-600 dark:text-descript-400 block mb-1">
                      client.credentials.rotate(...)
                    </span>
                    <span className="text-base-600 dark:text-base-400">
                      Seamlessly rotates public keys without changing the persistent canonical UUIDv7 Agent ID.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: VERIFIER INTEGRATION (BYTEBANK) */}
      {activeTab === 'verifier' && (
        <div className="space-y-8 animate-fade-in">
          <Card
            title="Service Verification Guide"
            subtitle="How external platforms (e.g. Bytebank, marketplaces, or APIs) verify autonomous agent identities."
          >
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-base-900 dark:text-white mb-2">
                    <Cpu className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                    <span>Approach A: Sub-Millisecond Offline Verification</span>
                  </div>
                  <p className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                    Verify agent cryptographic signatures using public keys and Ed25519 algebra alone. Operates with <strong>&lt; 0.2ms latency</strong> and zero database queries. Ideal for high-throughput microservices.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-base-900 dark:text-white mb-2">
                    <Radio className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                    <span>Approach B: Online Registry Verification</span>
                  </div>
                  <p className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                    Query Descript’s public registry to inspect real-time identity state (confirming the agent has not been suspended, revoked, or key compromised). Ideal for sensitive financial actions.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-base-900 dark:text-base-100">
                    Verifier Implementation (Python Example)
                  </h3>
                  <CopyButton text={PYTHON_SERVICE_VERIFY} label="Copy Verifier Code" />
                </div>
                <pre className="p-4 rounded-2xl bg-base-950 text-base-100 font-mono text-xs overflow-x-auto leading-relaxed border border-base-800">
                  <code>{PYTHON_SERVICE_VERIFY}</code>
                </pre>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: REST API SPECS */}
      {activeTab === 'api' && (
        <div className="space-y-8 animate-fade-in">
          <Card
            title="REST API Specifications & Endpoints"
            subtitle="Standard JSON over HTTPS endpoints with Bearer token authentication for full platform integration."
            actions={
              health && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    health.status === 'ok' && health.databaseConnected
                      ? 'bg-identity-50 text-identity-800 border-identity-200 dark:bg-identity-950/50 dark:text-identity-300 dark:border-identity-800'
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                  }`}
                >
                  Cluster Health: {health.status.toUpperCase()} ({health.latencyMs}ms)
                </span>
              )
            }
          >
            <div className="space-y-6">
              {/* cURL Example 1 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-500">
                    Register Agent (cURL)
                  </span>
                  <CopyButton text={CURL_REGISTER} label="Copy cURL" />
                </div>
                <pre className="p-4 rounded-2xl bg-base-950 text-base-100 font-mono text-xs overflow-x-auto border border-base-800">
                  <code>{CURL_REGISTER}</code>
                </pre>
              </div>

              {/* cURL Example 2 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-500">
                    Request Nonce Challenge (cURL)
                  </span>
                  <CopyButton text={CURL_CHALLENGE} label="Copy cURL" />
                </div>
                <pre className="p-4 rounded-2xl bg-base-950 text-base-100 font-mono text-xs overflow-x-auto border border-base-800">
                  <code>{CURL_CHALLENGE}</code>
                </pre>
              </div>

              {/* Endpoints Table */}
              <div className="overflow-x-auto pt-4 border-t border-base-200 dark:border-base-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-base-200 dark:border-base-800 text-base-500 dark:text-base-400">
                      <th className="py-2.5 pr-4 font-semibold">Method</th>
                      <th className="py-2.5 pr-4 font-semibold">Endpoint</th>
                      <th className="py-2.5 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200 dark:divide-base-800 text-base-700 dark:text-base-300">
                    {[
                      ['GET', '/api/v1/health', 'Cluster readiness check & latency report'],
                      ['POST', '/api/v1/agents', 'Register new agent, bind public key & issue Bytecript'],
                      ['GET', '/api/v1/agents/{id}', 'Fetch private controller agent record'],
                      ['GET', '/api/v1/public/agents/{id}', 'Public resolver endpoint for external verifiers'],
                      ['GET', '/api/v1/agents/{id}/bytecript', 'Retrieve signed Bytecript credential manifest'],
                      ['POST', '/api/v1/agents/{id}/credentials', 'Add or rotate Ed25519 credential'],
                      ['POST', '/api/v1/credentials/{id}/revoke', 'Permanently revoke compromised credential'],
                      ['PATCH', '/api/v1/agents/{id}/status', 'Set lifecycle status (active, suspended, revoked)'],
                      ['POST', '/api/v1/challenges', 'Generate single-use cryptographic nonce challenge'],
                      ['POST', '/api/v1/challenges/verify', 'Verify agent Ed25519 signature on nonce challenge'],
                      ['POST', '/api/v1/verify/bytecript', 'Verify Bytecript signature against authority seal'],
                    ].map(([method, path, desc]) => (
                      <tr key={path}>
                        <td className="py-2.5 pr-4 font-mono font-semibold text-descript-600 dark:text-descript-400">
                          {method}
                        </td>
                        <td className="py-2.5 pr-4 font-mono font-medium">{path}</td>
                        <td className="py-2.5 text-base-600 dark:text-base-400">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: STANDARDS & CRYPTOGRAPHY */}
      {activeTab === 'standards' && (
        <div className="space-y-8 animate-fade-in">
          <Card
            title="Cryptographic Architecture & Standards"
            subtitle="The mathematical foundations underpinning Descript agent identity verification."
          >
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-base-950 dark:text-white">
                    <Fingerprint className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                    <span>Pure Ed25519 Curve</span>
                  </div>
                  <p className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                    Uses Edwards-curve Digital Signature Algorithm (EdDSA) over Curve25519. Provides 128-bit security, immune to side-channel timing attacks, with tiny 32-byte public keys and 64-byte signatures.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-base-950 dark:text-white">
                    <Layers className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                    <span>UUIDv7 Identifiers</span>
                  </div>
                  <p className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                    Combines a 48-bit UNIX millisecond timestamp with 74 bits of entropy. Guaranteed global uniqueness with natural chronological sorting in database indices.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-base-950 dark:text-white">
                    <Lock className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                    <span>Zero Key Custody</span>
                  </div>
                  <p className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                    Private keys are created inside the agent's memory or hardware security module (HSM). The Descript backend only stores public keys, preventing any server-side exfiltration.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: API KEYS & ACCESS */}
      {activeTab === 'keys' && (
        <div className="space-y-8 animate-fade-in">
          {issuer && (
            <div className="p-5 rounded-2xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-base-500 dark:text-base-400">
                  Descript Authority Public Key ({issuer.algorithm})
                </span>
                <CopyButton text={issuer.publicKey} label="Copy Authority Key" />
              </div>
              <div className="font-mono text-xs text-base-800 dark:text-base-200 break-all bg-white dark:bg-base-950 p-3 rounded-xl border border-base-200 dark:border-base-800">
                {issuer.publicKey}
              </div>
            </div>
          )}

          {isAuthenticated ? (
            <Card
              title="Workspace Developer API Keys"
              subtitle="Generate scoped API keys to authenticate the Python SDK and automated daemons against your workspace."
            >
              <div className="space-y-5">
                <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <TextField
                      label="Key Description / Name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production Python Worker"
                    />
                  </div>
                  <Button
                    type="submit"
                    loading={creatingKey}
                    disabled={!newKeyName.trim()}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Create API Key
                  </Button>
                </form>

                {justCreatedKey && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Copy this API secret now. It will never be displayed again.</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-base-900 border border-amber-200 dark:border-amber-900 font-mono text-xs break-all">
                      <span>{justCreatedKey.secret}</span>
                      <CopyButton text={justCreatedKey.secret} label="Copy Secret" />
                    </div>
                  </div>
                )}

                {apiKeys.length === 0 ? (
                  <p className="text-sm text-base-500 dark:text-base-400">
                    No active API keys found. Generate one above to connect the Python SDK.
                  </p>
                ) : (
                  <div className="divide-y divide-base-200 dark:divide-base-800 border border-base-200 dark:border-base-800 rounded-xl">
                    {apiKeys.map((k) => (
                      <div
                        key={k.id}
                        className="p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                            <span className="font-semibold text-sm text-base-900 dark:text-base-100">
                              {k.name}
                            </span>
                            {k.revokedAt && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                Revoked
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-base-500 dark:text-base-400 mt-1">
                            {k.keyPrefix}... - Created {formatRelativeTime(k.createdAt)}
                            {k.lastUsedAt ? ` - Last used ${formatRelativeTime(k.lastUsedAt)}` : ''}
                          </div>
                        </div>
                        {!k.revokedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 dark:text-red-400"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => handleRevokeKey(k)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card
              title="Authentication Required"
              subtitle="Sign in to your Descript controller account to generate and manage developer API keys."
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800">
                <div className="text-sm text-base-600 dark:text-base-400">
                  API keys allow your autonomous agent daemons and Python workers to communicate securely with your private workspace.
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to="/login"
                    className="btn-step px-4 py-2 rounded-xl text-sm font-semibold bg-base-200 dark:bg-base-800 text-base-900 dark:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-step px-4 py-2 rounded-xl text-sm font-semibold bg-descript-600 text-white shadow-md shadow-descript-600/25"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  if (isAuthenticated) {
    return (
      <DashboardLayout
        title="Developer Documentation & SDK Portal"
        subtitle="Official guides, Python SDK reference, and cryptographic protocol specifications."
      >
        {content}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-base-50 dark:bg-base-950 flex flex-col bg-grid-pattern">
      <Navigation />
      <main className="flex-1 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto">
        {content}
      </main>
      <Footer />
    </div>
  );
}
