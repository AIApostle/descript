import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FileJson, Search, ShieldCheck, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChallengeTester } from '../components/agent/ChallengeTester';
import { BytecriptActions } from '../components/bytecript/BytecriptActions';
import { BytecriptCard } from '../components/bytecript/BytecriptCard';
import Footer from '../components/layout/Footer';
import Navigation from '../components/layout/Navigation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { agentService, verifyService } from '../services/agentService';
import type { Agent, BytecriptVerifyResult } from '../types/agent';

export default function PublicAgentPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [lookupId, setLookupId] = useState(id || '');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const [jsonInput, setJsonInput] = useState('');
  const [jsonVerifying, setJsonVerifying] = useState(false);
  const [jsonResult, setJsonResult] = useState<BytecriptVerifyResult | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

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
    } else {
      setAgent(null);
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-base-50 dark:bg-base-950 flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-descript-50 dark:bg-descript-950/60 text-descript-700 dark:text-descript-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            Public Identity Resolver
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-base-900 dark:text-white mb-3">
            Verify an AI Agent Identity
          </h1>
          <p className="text-sm sm:text-base text-base-600 dark:text-base-300">
            Look up any canonical Agent ID to inspect its signed Bytecript card or run a live challenge-response check.
          </p>

          <form onSubmit={handleLookupSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-base-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter Agent ID (e.g. agent_019...)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-base-300 dark:border-base-700 bg-white dark:bg-base-900 text-sm font-mono text-base-900 dark:text-base-100 outline-none focus:border-descript-500"
              />
            </div>
            <Button type="submit" size="lg">
              Resolve Agent
            </Button>
          </form>
        </div>

        {(id || isLoading) && (
          <div className="space-y-8">
            <BytecriptCard
              agent={agent}
              bytecript={agent?.bytecript}
              isLoading={isLoading}
              error={error}
              onRetry={() => id && fetchPublicAgent(id)}
            />
            {agent && (
              <>
                <BytecriptActions
                  agentId={agent.id}
                  agentName={agent.name}
                  bytecript={agent.bytecript}
                  isPublicView
                />
                <ChallengeTester agentId={agent.id} />
              </>
            )}
          </div>
        )}

        <Card
          title="Verify Exported Bytecript JSON"
          subtitle="Paste any exported Bytecript credential JSON to validate its Ed25519 issuer signature and live directory status."
        >
          <div className="space-y-4">
            <textarea
              rows={6}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"type": "Bytecript", "agentId": "agent_...", "signature": "..."}'
              className="w-full p-3.5 rounded-xl border border-base-300 dark:border-base-700 bg-white dark:bg-base-950 font-mono text-xs text-base-900 dark:text-base-100 outline-none focus:border-descript-500"
            />
            <Button
              loading={jsonVerifying}
              disabled={!jsonInput.trim()}
              icon={<FileJson className="h-4 w-4" />}
              onClick={handleVerifyJson}
            >
              Verify Bytecript Document
            </Button>

            {jsonError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{jsonError}</p>}

            {jsonResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
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
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-sm text-base-900 dark:text-white">
                    {jsonResult.verified ? 'Bytecript Authentic & Active' : 'Verification Failed'}
                  </div>
                  <div className="text-base-600 dark:text-base-300">
                    Issuer signature: {jsonResult.signatureValid ? 'Valid' : 'Invalid'} | Live status:{' '}
                    {jsonResult.liveStatus || 'Unknown'}
                    {jsonResult.reason ? ` (${jsonResult.reason})` : ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
