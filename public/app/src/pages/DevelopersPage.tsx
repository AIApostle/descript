import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Key, Plus, Terminal, Trash2 } from 'lucide-react';
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

const PYTHON_QUICKSTART = `from descript import DescriptClient, KeyPair

# 1. Generate an Ed25519 keypair locally (private key never leaves your machine)
keypair = KeyPair.generate()
keypair.save_pem("agent_key.pem")

# 2. Register the agent with your Descript API key
with DescriptClient(base_url="http://localhost:8000", api_key="dsc_live_...") as client:
    agent = client.agents.create(
        name="Ledger Sentinel",
        description="Autonomous reconciliation agent",
        byte_network="kiroween",
        public_key=keypair.public_key_b64,
        capabilities=["reconcile", "sign"],
    )
    print("Assigned Agent ID:", agent.id)
    print("Bytecript Version:", agent.bytecript.version)

    # 3. Authenticate with an external service (e.g. Bytebank) via challenge-response
    result = client.verify.authenticate_with_keypair(
        agent_id=agent.id,
        keypair=keypair,
        audience="bytebank",
    )
    assert result.verified is True`;

const PYTHON_SERVICE_VERIFY = `from descript import DescriptClient, verify_bytecript_signature

with DescriptClient(base_url="http://localhost:8000") as client:
    # Step A: Resolve public agent profile and Bytecript
    agent = client.agents.get_public("agent_01...")
    if agent.status != "active":
        raise PermissionError(f"Agent is {agent.status}")

    # Step B: Verify Bytecript issuer signature offline or online
    assert verify_bytecript_signature(agent.bytecript)

    # Step C: Issue a single-use nonce challenge for the agent to sign
    challenge = client.verify.create_challenge(agent.id, audience="bytebank")
    # Agent signs challenge.nonce with its private key, then sends signature back:
    verified = client.verify.verify_challenge(
        agent_id=agent.id,
        challenge_id=challenge.challengeId,
        signature=agent_signature,
    )`;

export default function DevelopersPage() {
  const { isAuthenticated } = useAuth();
  const { showToast, showConfirm } = useNotification();

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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-descript-50 dark:bg-descript-950/80 text-descript-700 dark:text-descript-300 border border-descript-200/80 dark:border-descript-800/80 mb-3">
          <Terminal className="h-3.5 w-3.5" />
          <span>Documentation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-950 dark:text-white mb-2">
          Developer Documentation & Protocol Specs
        </h1>
        <p className="text-sm sm:text-base text-base-600 dark:text-base-300 max-w-3xl leading-relaxed">
          Comprehensive guides and specifications for registering autonomous agents, managing zero-custody Ed25519 keypairs, issuing signed Bytecript credentials, and performing zero-trust nonce challenges.
        </p>
      </div>

      {/* Install & Quickstart */}
      <Card
        title="Python SDK & Client Guide"
        subtitle="Official synchronous and asynchronous Python client for agent registration, Ed25519 signing, and Bytecript verification."
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-base-950 text-base-100 font-mono text-sm">
            <div className="flex items-center gap-3">
              <Terminal className="h-4 w-4 text-descript-400" />
              <span>pip install descript</span>
              <span className="text-base-500"># or: uv add descript</span>
            </div>
            <CopyButton text="pip install descript" label="Copy" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-base-900 dark:text-base-100">
                Agent Registration & Challenge-Response Auth
              </h3>
              <CopyButton text={PYTHON_QUICKSTART} label="Copy Python" />
            </div>
            <pre className="p-4 rounded-xl bg-base-950 text-base-100 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{PYTHON_QUICKSTART}</code>
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-base-900 dark:text-base-100">
                Service Verification Flow (e.g. Bytebank)
              </h3>
              <CopyButton text={PYTHON_SERVICE_VERIFY} label="Copy Python" />
            </div>
            <pre className="p-4 rounded-xl bg-base-950 text-base-100 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{PYTHON_SERVICE_VERIFY}</code>
            </pre>
          </div>
        </div>
      </Card>

      {/* Developer API Keys (shown when signed in) */}
      {isAuthenticated && (
        <Card
          title="Developer API Keys"
          subtitle="Create scoped API keys to authenticate the Python SDK against your Descript workspace."
        >
          <div className="space-y-5">
            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <TextField
                  label="Key Name"
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
                Generate API Key
              </Button>
            </form>

            {justCreatedKey && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Copy this API secret now. It will not be shown again.</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-base-900 border border-amber-200 dark:border-amber-900 font-mono text-xs break-all">
                  <span>{justCreatedKey.secret}</span>
                  <CopyButton text={justCreatedKey.secret} label="Copy Secret" />
                </div>
              </div>
            )}

            {apiKeys.length === 0 ? (
              <p className="text-sm text-base-500 dark:text-base-400">
                No API keys generated yet.
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
      )}

      {/* Issuer Authority & Endpoints */}
      <Card
        title="REST API & Issuer Public Key"
        subtitle="Verify Bytecripts offline using the Descript authority Ed25519 public key."
        actions={
          health && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                health.status === 'ok' && health.databaseConnected
                  ? 'bg-identity-50 text-identity-800 border-identity-200 dark:bg-identity-950/50 dark:text-identity-300 dark:border-identity-800'
                  : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              API: {health.status.toUpperCase()} ({health.database} {health.latencyMs}ms)
            </span>
          )
        }
      >
        <div className="space-y-5">
          {issuer && (
            <div className="p-4 rounded-xl bg-base-50 dark:bg-base-950 border border-base-200 dark:border-base-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-base-500 dark:text-base-400">
                  Authority Public Key ({issuer.algorithm})
                </span>
                <CopyButton text={issuer.publicKey} label="Copy Key" />
              </div>
              <div className="font-mono text-xs text-base-800 dark:text-base-200 break-all">
                {issuer.publicKey}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
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
                  ['GET', '/api/v1/health', 'API and database readiness check'],
                  ['POST', '/api/v1/agents', 'Register a new agent and issue Bytecript'],
                  ['GET', '/api/v1/agents/{id}', 'Fetch authenticated agent details'],
                  ['GET', '/api/v1/agents/{id}/bytecript', 'Retrieve signed Bytecript credential'],
                  ['POST', '/api/v1/agents/{id}/credentials', 'Add or rotate Ed25519 credential'],
                  ['POST', '/api/v1/credentials/{id}/revoke', 'Permanently revoke a credential'],
                  ['PATCH', '/api/v1/agents/{id}/status', 'Suspend, reactivate, or revoke agent'],
                  ['GET', '/api/v1/public/agents/{id}', 'Public Bytecript lookup for relying services'],
                  ['POST', '/api/v1/challenges', 'Issue single-use authentication nonce'],
                  ['POST', '/api/v1/challenges/verify', 'Verify agent Ed25519 challenge signature'],
                  ['POST', '/api/v1/verify/bytecript', 'Verify Bytecript signature and live status'],
                ].map(([method, path, desc]) => (
                  <tr key={path}>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-descript-600 dark:text-descript-400">
                      {method}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{path}</td>
                    <td className="py-2.5">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );

  if (isAuthenticated) {
    return (
      <DashboardLayout
        title="Documentation & Protocol Specs"
        subtitle="Official specifications, SDK integration guides, and API keys for autonomous agents."
      >
        {content}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-base-50 dark:bg-base-950 flex flex-col bg-grid-pattern">
      <Navigation />
      <main className="flex-1 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl w-full mx-auto">
        {content}
      </main>
      <Footer />
    </div>
  );
}
