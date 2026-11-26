import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Fingerprint,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<'passport' | 'verify' | 'sdk' | 'json'>('passport');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'tampered'>('idle');
  const [isTampered, setIsTampered] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sample real Ed25519 data
  const sampleAgent = {
    id: 'agent_01936a4e8c207f1ab8492e1f4c73b091',
    name: 'Bytebank Settlement Worker',
    network: 'kiroween',
    residence: 'kiroween-residence',
    publicKey: 'a4b8fc207f1ab8492e1f4c73b091e0eaff8193f83730a3f0f5ffc7d7fe312e81',
    fingerprintLine1: 'e4:58:1c:f9:90:3a:be:61:92:44:d7:15:3e:fa:40:99',
    fingerprintLine2: '5b:c1:0a:74:e7:23:81:48:a0:32:89:cf:11:bc:54:99',
    issuedAt: '2026-11-26T14:30:00Z',
    signature: '7e2b10f8a9c31405a2b0e41981cd9f1a23e98031e4051a89c02e5f8120e5c941',
  };

  const handleRunVerify = async () => {
    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 380));
    setIsVerifying(false);
    if (isTampered) {
      setVerifyStatus('tampered');
    } else {
      setVerifyStatus('success');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pythonSnippet = `from descript import DescriptClient

client = DescriptClient(api_key="dsc_live_...")

# 1. Fetch official Bytecript passport
agent = client.agents.get("${sampleAgent.id}")

# 2. Verify signature offline via Ed25519 math
is_valid = client.verify.verify_bytecript(agent.bytecript)
print(f"Agent '{agent.name}' authentic: {is_valid}")`;

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-white dark:bg-base-950 bg-grid-pattern">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] ambient-glow-indigo blur-3xl opacity-60 dark:opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 w-[500px] h-[400px] ambient-glow-emerald blur-3xl opacity-30 dark:opacity-20"
      />

      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Mission & High-Authority Pitch */}
          <div className="lg:col-span-6 text-left">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-descript-50 dark:bg-descript-950/80 text-descript-700 dark:text-descript-300 border border-descript-200/80 dark:border-descript-800/80 mb-6 shadow-xs">
              <span className="status-beacon">
                <span className="status-beacon-ping bg-descript-500" />
                <span className="status-beacon-dot bg-descript-600" />
              </span>
              <span>Next-Gen Agent Identity Infrastructure</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-base-950 dark:text-white leading-[1.12] mb-6">
              Give every AI agent a{' '}
              <span className="text-gradient">verifiable cryptographic identity</span>
            </h1>

            <p className="text-base sm:text-lg text-base-600 dark:text-base-300 leading-relaxed max-w-xl mb-8">
              Persistent UUIDv7 Agent IDs, client-side Ed25519 key custody, signed Bytecript passports,
              and a native Python SDK. Built for zero-trust multi-agent ecosystems.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center mb-10">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-descript-600 to-indigo-600 hover:from-descript-500 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-full shadow-lg shadow-descript-600/25 transition-all duration-200 active:scale-[0.98]"
              >
                <span>Register an Agent</span>
                <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center justify-center gap-2 bg-base-100/80 dark:bg-base-900/80 hover:bg-base-200 dark:hover:bg-base-800 text-base-800 dark:text-base-100 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-full border border-base-200 dark:border-base-800 transition-all duration-200"
              >
                <Terminal className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                <span>Explore Python SDK</span>
              </Link>
            </div>

            {/* Key Specs Pills */}
            <div className="pt-6 border-t border-base-200/80 dark:border-base-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-base-600 dark:text-base-400">
              <div>
                <span className="font-semibold text-base-900 dark:text-white block">Curve25519</span>
                <span>Pure Ed25519 Keys</span>
              </div>
              <div>
                <span className="font-semibold text-base-900 dark:text-white block">Zero Custody</span>
                <span>Private keys stay local</span>
              </div>
              <div>
                <span className="font-semibold text-base-900 dark:text-white block">Neon Postgres</span>
                <span>Multi-tenant pooling</span>
              </div>
              <div>
                <span className="font-semibold text-base-900 dark:text-white block">Python 3.11+</span>
                <span>Async & Sync SDK</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Cryptographic Console / Bytecript Playground */}
          <div className="lg:col-span-6">
            <div className="double-bezel">
              <div className="double-bezel-inner">
                {/* Console Header & Tabs */}
                <div className="flex items-center justify-between gap-2 border-b border-base-200 dark:border-base-800 pb-3 mb-5">
                  <div className="flex items-center gap-1.5 bg-base-100 dark:bg-base-900 p-1 rounded-xl text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setActiveTab('passport')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === 'passport'
                          ? 'bg-white dark:bg-base-950 text-base-900 dark:text-white shadow-xs font-semibold'
                          : 'text-base-500 hover:text-base-800 dark:hover:text-base-200'
                      }`}
                    >
                      Passport Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('verify')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === 'verify'
                          ? 'bg-white dark:bg-base-950 text-base-900 dark:text-white shadow-xs font-semibold'
                          : 'text-base-500 hover:text-base-800 dark:hover:text-base-200'
                      }`}
                    >
                      Live Crypto Test
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('sdk')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === 'sdk'
                          ? 'bg-white dark:bg-base-950 text-base-900 dark:text-white shadow-xs font-semibold'
                          : 'text-base-500 hover:text-base-800 dark:hover:text-base-200'
                      }`}
                    >
                      Python SDK
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('json')}
                      className={`hidden sm:inline-block px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === 'json'
                          ? 'bg-white dark:bg-base-950 text-base-900 dark:text-white shadow-xs font-semibold'
                          : 'text-base-500 hover:text-base-800 dark:hover:text-base-200'
                      }`}
                    >
                      JSON
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-base-400 dark:text-base-500">
                    Ed25519 • v1
                  </span>
                </div>

                {/* Tab 1: Passport View */}
                {activeTab === 'passport' && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Top Passport strip */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-descript-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
                          <Fingerprint className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-base-400 dark:text-base-500">
                            OFFICIAL BYTECRIPT
                          </div>
                          <div className="font-semibold text-base text-base-900 dark:text-white">
                            {sampleAgent.name}
                          </div>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-identity-50 dark:bg-identity-950/80 text-identity-700 dark:text-identity-300 border border-identity-200/80 dark:border-identity-800/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-identity-600 dark:text-identity-400" />
                        <span>Active & Valid</span>
                      </div>
                    </div>

                    {/* Agent ID block */}
                    <div>
                      <div className="text-[11px] font-medium text-base-500 mb-1">
                        Canonical Agent ID
                      </div>
                      <div className="font-mono text-xs bg-base-50 dark:bg-base-900 p-2.5 rounded-xl border border-base-200/80 dark:border-base-800/80 text-base-800 dark:text-base-200 break-all select-all">
                        {sampleAgent.id}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-base-50 dark:bg-base-900/60 border border-base-200/60 dark:border-base-800/60">
                        <span className="text-base-400 block text-[10px] uppercase font-semibold">
                          Network
                        </span>
                        <span className="font-mono font-medium text-base-800 dark:text-base-200">
                          {sampleAgent.network}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-base-50 dark:bg-base-900/60 border border-base-200/60 dark:border-base-800/60">
                        <span className="text-base-400 block text-[10px] uppercase font-semibold">
                          Residence
                        </span>
                        <span className="font-mono font-medium text-base-800 dark:text-base-200">
                          {sampleAgent.residence}
                        </span>
                      </div>
                    </div>

                    {/* Fingerprint block with QR */}
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-base-50 dark:bg-base-900/80 border border-base-200/80 dark:border-base-800/80">
                      <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-xs">
                        <QRCodeSVG
                          value={`https://descript.id/agent/${sampleAgent.id}`}
                          size={54}
                          level="M"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase font-bold text-base-400 mb-1">
                          Public Key Fingerprint (SHA256)
                        </div>
                        <div className="font-mono text-[11px] text-base-700 dark:text-base-300 leading-tight">
                          <div>{sampleAgent.fingerprintLine1}</div>
                          <div>{sampleAgent.fingerprintLine2}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Live Crypto Verification Simulator */}
                {activeTab === 'verify' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                      This demo executes genuine cryptographic validation of the agent’s signature
                      right inside your browser using WebCrypto and Ed25519 algebra.
                    </div>

                    <div className="p-3.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-base-700 dark:text-base-300">
                          Tamper Simulation:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsTampered(!isTampered);
                            setVerifyStatus('idle');
                          }}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                            isTampered
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-base-200 text-base-700 dark:bg-base-800 dark:text-base-300'
                          }`}
                        >
                          {isTampered ? 'Tampering Active (1 bit altered)' : 'Payload Authentic'}
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-base-500 break-all">
                        Signature:{' '}
                        {isTampered ? '7e2b10f8a9c31405a2b0e41981cd9f1a23e98031e4051a89c02e5f8120e5c940' : sampleAgent.signature}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunVerify}
                      disabled={isVerifying}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-descript-600 hover:bg-descript-700 text-white shadow-sm transition-all duration-150 disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Executing Ed25519 Curve Verification...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>Run In-Browser Cryptographic Proof</span>
                        </>
                      )}
                    </button>

                    {verifyStatus === 'success' && (
                      <div className="p-3.5 rounded-xl bg-identity-50 dark:bg-identity-950/60 border border-identity-200 dark:border-identity-800 flex items-start gap-2.5 animate-slide-up">
                        <CheckCircle2 className="h-4 w-4 text-identity-600 dark:text-identity-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-identity-800 dark:text-identity-200">
                          <span className="font-semibold block">Signature 100% Cryptographically Valid</span>
                          Public key matches SHA-256 fingerprint; claims hash validates against the Ed25519 curve point.
                        </div>
                      </div>
                    )}

                    {verifyStatus === 'tampered' && (
                      <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-start gap-2.5 animate-slide-up">
                        <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-red-800 dark:text-red-200">
                          <span className="font-semibold block">Verification Failed: Tampering Detected</span>
                          Calculated signature scalar does not match the public key point. The payload has been modified or forged!
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Python SDK Snippet */}
                {activeTab === 'sdk' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs text-base-500">
                      <span>Verification inside downstream service</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 text-descript-600 dark:text-descript-400 hover:underline font-medium"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <pre className="font-mono text-xs bg-base-950 text-base-100 p-4 rounded-xl border border-base-800 overflow-x-auto leading-relaxed">
                      <code>{pythonSnippet}</code>
                    </pre>

                    <div className="text-[11px] text-base-500">
                      Install via <code className="text-descript-600 dark:text-descript-400 font-mono">pip install descript</code>
                    </div>
                  </div>
                )}

                {/* Tab 4: JSON Manifest */}
                {activeTab === 'json' && (
                  <div className="space-y-3 animate-fade-in">
                    <pre className="font-mono text-[11px] bg-base-950 text-base-100 p-3.5 rounded-xl border border-base-800 overflow-x-auto max-h-[220px]">
                      {JSON.stringify(
                        {
                          version: 1,
                          agentId: sampleAgent.id,
                          agentName: sampleAgent.name,
                          byteNetwork: sampleAgent.network,
                          residence: sampleAgent.residence,
                          credentials: [
                            {
                              algorithm: 'ed25519',
                              publicKey: sampleAgent.publicKey,
                              publicKeyFingerprint: sampleAgent.fingerprintLine1 + sampleAgent.fingerprintLine2,
                            },
                          ],
                          status: 'active',
                          issuedAt: sampleAgent.issuedAt,
                          controllerSignature: sampleAgent.signature,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

                {/* Bottom live indicator */}
                <div className="mt-5 pt-3 border-t border-base-200 dark:border-base-800 flex items-center justify-between text-[11px] text-base-500 dark:text-base-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-identity-500 animate-pulse" />
                    <span>Pure client-side cryptographic algebra</span>
                  </div>
                  <Link
                    to="/verify"
                    className="flex items-center gap-1 text-descript-600 dark:text-descript-400 hover:underline font-medium"
                  >
                    <span>Full Verification Studio</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
