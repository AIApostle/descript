import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  FileCheck2,
  FileJson,
  Radio,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChallengeTester } from '../components/agent/ChallengeTester';
import { BytecriptActions } from '../components/bytecript/BytecriptActions';
import { BytecriptCard } from '../components/bytecript/BytecriptCard';
import Footer from '../components/layout/Footer';
import Navigation from '../components/layout/Navigation';
import { Button } from '../components/ui/Button';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { agentService, verifyService } from '../services/agentService';
import type { Agent, BytecriptVerifyResult } from '../types/agent';

export default function PublicAgentPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'resolve' | 'json' | 'challenge'>('resolve');
  const [lookupId, setLookupId] = useState(id || '');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const [jsonInput, setJsonInput] = useState('');
  const [jsonVerifying, setJsonVerifying] = useState(false);
  const [jsonResult, setJsonResult] = useState<BytecriptVerifyResult | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const sampleJson = {
    type: 'Bytecript',
    version: 1,
    agentId: 'agent_01936a4e8c207f1ab8492e1f4c73b091',
    agentName: 'Bytebank Settlement Worker',
    byteNetwork: 'kiroween',
    residence: 'kiroween-residence',
    credentials: [
      {
        algorithm: 'ed25519',
        publicKey: 'a4b8fc207f1ab8492e1f4c73b091e0eaff8193f83730a3f0f5ffc7d7fe312e81',
        publicKeyFingerprint:
          'e4581cf9903abe619244d7153efa40995bc10a74e7238148a03289cf11bc5499',
      },
    ],
    status: 'active',
    issuedAt: '2026-11-26T14:30:00Z',
    controllerVerified: true,
    signature: '7e2b10f8a9c31405a2b0e41981cd9f1a23e98031e4051a89c02e5f8120e5c941',
  };

  const fetchPublicAgent = useCallback(async (agentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await agentService.getPublic(agentId);
      setAgent(data);
    } catch (err) {
      setAgent(null);
      setError(err instanceof Error ? err.message : 'Agent not found in Descript registry');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      setLookupId(id);
      fetchPublicAgent(id);
      setActiveTab('resolve');
    }
  }, [id, fetchPublicAgent]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupId.trim();
    if (!trimmed) return;
    navigate(`/agent/${trimmed}`);
  };

  const handleVerifyJson = async () => {
    setJsonError(null);
    setJsonResult(null);
    setJsonVerifying(true);
    try {
      const parsed = JSON.parse(jsonInput) as Record<string, unknown>;
      const res = await verifyService.verifyBytecript(parsed, true);
      setJsonResult(res);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid Bytecript JSON payload');
    } finally {
      setJsonVerifying(false);
    }
  };

  const content = (
    <div className="space-y-10">
        {/* Studio Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-descript-50 dark:bg-descript-950/80 text-descript-700 dark:text-descript-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-descript-200/80 dark:border-descript-800/80">
            <ShieldCheck className="h-4 w-4 text-descript-600 dark:text-descript-400" />
            <span>Cryptographic Verification Studio</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-base-950 dark:text-white mb-4 tracking-tight leading-tight">
            Universal Agent Identity Verifier
          </h1>

          <p className="text-sm sm:text-base text-base-600 dark:text-base-300 max-w-2xl mx-auto leading-relaxed">
            Verify AI agent authenticity, inspect signed Bytecript passports, or validate Ed25519
            signatures offline with zero server dependencies.
          </p>

          {/* Studio Mode Tabs */}
          <div className="mt-8 inline-flex items-center gap-1.5 p-1 rounded-2xl bg-base-100 dark:bg-base-900 border border-base-200/80 dark:border-base-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('resolve')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'resolve'
                  ? 'bg-white dark:bg-base-950 text-base-900 dark:text-white shadow-xs'
                  : 'text-base-500 hover:text-base-900 dark:hover:text-white'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Lookup by Agent ID</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'json'
                  ? 'bg-white dark:bg-base-950 text-base-900 dark:text-white shadow-xs'
                  : 'text-base-500 hover:text-base-900 dark:hover:text-white'
              }`}
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>Validate Bytecript JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('challenge')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'challenge'
                  ? 'bg-white dark:bg-base-950 text-base-900 dark:text-white shadow-xs'
                  : 'text-base-500 hover:text-base-900 dark:hover:text-white'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Challenge-Response Tester</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Lookup by Agent ID */}
        {activeTab === 'resolve' && (
          <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
            <div className="double-bezel">
              <div className="double-bezel-inner p-6 sm:p-8">
                <form onSubmit={handleLookupSubmit} className="space-y-4">
                  <label htmlFor="agent-lookup-input" className="block text-xs font-semibold uppercase tracking-wider text-base-500">
                    Enter Canonical Agent ID
                  </label>
                  <div className="relative">
                    <Search className="h-4 w-4 text-base-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="agent-lookup-input"
                      type="text"
                      value={lookupId}
                      onChange={(e) => setLookupId(e.target.value)}
                      placeholder="agent_01936a4e8c207f1ab8492e1f4c73b091..."
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-base-200 dark:border-base-800 bg-base-50 dark:bg-base-900 text-sm font-mono text-base-900 dark:text-base-100 outline-none focus:ring-2 focus:ring-descript-500/50"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 text-xs text-base-500">
                      <span>Quick Test:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const testId = 'agent_01936a4e8c207f1ab8492e1f4c73b091';
                          setLookupId(testId);
                          navigate(`/agent/${testId}`);
                        }}
                        className="px-2 py-0.5 rounded-md bg-base-100 dark:bg-base-800 text-base-700 dark:text-base-300 font-mono hover:bg-base-200 transition-colors"
                      >
                        Sample Worker
                      </button>
                    </div>

                    <Button type="submit" size="md">
                      Resolve & Verify
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Resolved Agent Card */}
            {(id || isLoading) && (
              <div className="space-y-6 animate-slide-up">
                <BytecriptCard
                  agent={agent}
                  bytecript={agent?.bytecript}
                  isLoading={isLoading}
                  error={error}
                  onRetry={() => id && fetchPublicAgent(id)}
                />

                {agent && (
                  <div className="max-w-[660px] mx-auto space-y-6">
                    <BytecriptActions
                      agentId={agent.id}
                      agentName={agent.name}
                      bytecript={agent.bytecript}
                      isPublicView
                    />
                    <ChallengeTester agentId={agent.id} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Validate Bytecript JSON */}
        {activeTab === 'json' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="double-bezel">
              <div className="double-bezel-inner p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-base-950 dark:text-white">
                      Paste Bytecript Document
                    </h3>
                    <p className="text-xs text-base-500">
                      Validate claims against Ed25519 signature and live database registry.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJsonInput(JSON.stringify(sampleJson, null, 2))}
                    className="text-xs font-semibold text-descript-600 dark:text-descript-400 hover:underline"
                  >
                    Load Sample JSON
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"type": "Bytecript", "agentId": "agent_...", "signature": "..."}'
                  className="w-full p-4 rounded-xl border border-base-200 dark:border-base-800 bg-base-950 text-base-100 font-mono text-xs outline-none focus:ring-2 focus:ring-descript-500/50 leading-relaxed"
                />

                <div className="flex justify-end">
                  <Button
                    loading={jsonVerifying}
                    disabled={!jsonInput.trim()}
                    icon={<FileCheck2 className="h-4 w-4" />}
                    onClick={handleVerifyJson}
                  >
                    Run Verification Audit
                  </Button>
                </div>

                {jsonError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
                    {jsonError}
                  </div>
                )}

                {jsonResult && (
                  <div
                    className={`p-4 rounded-2xl border flex items-start gap-3.5 animate-slide-up ${
                      jsonResult.verified
                        ? 'bg-identity-50 dark:bg-identity-950/50 border-identity-200 dark:border-identity-800'
                        : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
                    }`}
                  >
                    {jsonResult.verified ? (
                      <CheckCircle2 className="h-5 w-5 text-identity-600 dark:text-identity-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs space-y-1.5 flex-1">
                      <div className="font-bold text-sm text-base-900 dark:text-white">
                        {jsonResult.verified
                          ? 'Bytecript Document Cryptographically Authentic'
                          : 'Cryptographic Validation Failed'}
                      </div>
                      <div className="text-base-600 dark:text-base-300 space-y-1">
                        <div>
                          &bull; Ed25519 Signature:{' '}
                          <span className="font-semibold font-mono">
                            {jsonResult.signatureValid ? 'VALID' : 'INVALID'}
                          </span>
                        </div>
                        <div>
                          &bull; Live Registry State:{' '}
                          <span className="font-semibold uppercase font-mono">
                            {jsonResult.liveStatus || 'N/A'}
                          </span>
                        </div>
                        {jsonResult.reason && (
                          <div className="text-red-600 dark:text-red-400">&bull; {jsonResult.reason}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Challenge Tester */}
        {activeTab === 'challenge' && (
          <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
            <div className="double-bezel">
              <div className="double-bezel-inner p-6 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-base-950 dark:text-white">
                    Simulate Nonce Challenge-Response
                  </h3>
                  <p className="text-xs text-base-500 mt-1 leading-relaxed">
                    Test the live challenge API. A verifier sends a 32-byte cryptographic random
                    nonce; the agent signs it with its Ed25519 private key; the verifier proves
                    authenticity without any shared passwords.
                  </p>
                </div>

                <ChallengeTester agentId={id || 'agent_01936a4e8c207f1ab8492e1f4c73b091'} />
              </div>
            </div>
          </div>
        )}
      </div>
    );

  if (isAuthenticated) {
    return (
      <DashboardLayout
        title="Verify Agent"
        subtitle="Universal verification studio: resolve identities, inspect signed Bytecript passports, and run offline Ed25519 proofs."
      >
        <div className="py-2">{content}</div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-base-950 flex flex-col bg-grid-pattern">
      <Navigation />
      <main className="flex-1 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl w-full mx-auto">
        {content}
      </main>
      <Footer />
    </div>
  );
}
