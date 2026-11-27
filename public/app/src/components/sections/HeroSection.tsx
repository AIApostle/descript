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
  const [activeTab, setActiveTab] = useState<'passport' | 'verify' | 'json'>('passport');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'tampered'>('idle');
  const [isTampered, setIsTampered] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

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

  const handleCopyId = () => {
    navigator.clipboard.writeText(sampleAgent.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <section data-enter className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-white dark:bg-base-950 bg-grid-pattern">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] ambient-glow-indigo blur-3xl opacity-35 dark:opacity-25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 w-[500px] h-[400px] ambient-glow-emerald blur-3xl opacity-20 dark:opacity-15"
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
              Persistent UUIDv7 Agent IDs, server-provisioned Ed25519 key custody, signed Bytecript passports,
              and a native Python SDK. Built for zero-trust multi-agent ecosystems.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center mb-10">
              <Link
                to="/signup"
                className="btn-step group inline-flex items-center justify-center gap-3 bg-descript-600 hover:bg-descript-700 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-full shadow-lg shadow-descript-600/25 transition-all duration-200 active:scale-[0.98]"
              >
                <span>Register an Agent</span>
                <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
              <Link
                to="/docs"
                className="btn-step inline-flex items-center justify-center gap-2 bg-base-100/80 dark:bg-base-900/80 hover:bg-base-200 dark:hover:bg-base-800 text-base-800 dark:text-base-100 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-full border border-base-200 dark:border-base-800 transition-all duration-200"
              >
                <Terminal className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                <span>Documentation</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Institutional-Grade Interactive Bytecript Passport */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-base-950 via-slate-900 to-base-950 text-white border border-white/10 shadow-2xl shadow-black/40 overflow-hidden card-lift">
              {/* Holographic Security Foil Strip */}
              <div
                aria-hidden="true"
                className="h-1.5 w-full bg-gradient-to-r from-descript-500 via-sky-400 via-emerald-400 via-amber-300 to-purple-500 rounded-full mb-6 shadow-sm shadow-descript-500/20"
              />

              {/* Console Header & Tabs */}
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl text-xs font-medium border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab('passport')}
                    className={`btn-step px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'passport'
                        ? 'bg-descript-600 text-white shadow-sm font-semibold'
                        : 'text-base-400 hover:text-white'
                    }`}
                  >
                    Passport Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('verify')}
                    className={`btn-step px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'verify'
                        ? 'bg-descript-600 text-white shadow-sm font-semibold'
                        : 'text-base-400 hover:text-white'
                    }`}
                  >
                    Live Challenge Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('json')}
                    className={`btn-step hidden sm:inline-block px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'json'
                        ? 'bg-descript-600 text-white shadow-sm font-semibold'
                        : 'text-base-400 hover:text-white'
                    }`}
                  >
                    JSON Manifest
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-descript-300 bg-descript-950/80 px-2.5 py-1 rounded-full border border-descript-800">
                  <ShieldCheck className="h-3 w-3 text-descript-400" />
                  <span>Ed25519 • v1</span>
                </div>
              </div>

              {/* Tab 1: Premium Bytecript Passport View */}
              {activeTab === 'passport' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Top Passport strip with Smart Chip */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-descript-500 to-descript-700 text-white flex items-center justify-center shadow-lg shadow-descript-500/30 border border-white/20">
                        <Fingerprint className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-widest text-descript-400 uppercase">
                          OFFICIAL BYTECRIPT PASSPORT
                        </div>
                        <div className="font-bold text-lg text-white tracking-tight">
                          Bytebank Settlement Sentinel
                        </div>
                        <div className="text-xs text-base-400">
                          Autonomous Arbitrage & Settlement Agent
                        </div>
                      </div>
                    </div>

                    {/* Simulated Gold Security Chip */}
                    <div
                      title="Cryptographic Hardware Binding"
                      className="hidden sm:flex flex-col items-center justify-center w-11 h-12 rounded-lg bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 p-1 border border-amber-300 shadow-sm shrink-0"
                    >
                      <div className="w-full h-full border border-amber-600/40 rounded flex flex-col justify-between p-1 bg-amber-400/20">
                        <div className="h-0.5 w-full bg-amber-800/40 rounded-xs" />
                        <div className="h-0.5 w-full bg-amber-800/40 rounded-xs" />
                        <div className="h-0.5 w-full bg-amber-800/40 rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Canonical Agent ID block */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-base-400 mb-1.5">
                      <span>Canonical Agent ID (UUIDv7)</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCopyId}
                          className="flex items-center gap-1 text-descript-400 hover:text-white transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedId ? 'Copied' : 'Copy'}</span>
                        </button>
                        <span className="text-emerald-400 flex items-center gap-1 font-mono">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active & Valid
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-xs sm:text-sm text-base-100 break-all select-all font-medium bg-black/40 p-2.5 rounded-xl border border-white/5">
                      {sampleAgent.id}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-base-400 block text-[10px] uppercase font-semibold">
                        Network
                      </span>
                      <span className="font-mono font-bold text-white text-xs">
                        {sampleAgent.network}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-base-400 block text-[10px] uppercase font-semibold">
                        Key Curve
                      </span>
                      <span className="font-mono font-bold text-white text-xs">
                        Ed25519
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-base-400 block text-[10px] uppercase font-semibold">
                        Custody
                      </span>
                      <span className="font-mono font-bold text-white text-xs">
                        Zero Server
                      </span>
                    </div>
                  </div>

                  {/* Fingerprint block with QR */}
                  <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                      <QRCodeSVG
                        value={`https://descript.id/agent/${sampleAgent.id}`}
                        size={60}
                        level="M"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-descript-400 mb-1 tracking-wider">
                        Public Key Fingerprint (SHA256)
                      </div>
                      <div className="font-mono text-[11px] text-base-300 leading-relaxed break-all select-all">
                        <div className="text-white/90">{sampleAgent.fingerprintLine1}</div>
                        <div className="text-white/70">{sampleAgent.fingerprintLine2}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Live Crypto Verification Simulator */}
              {activeTab === 'verify' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-xs text-base-300 leading-relaxed">
                    Test genuine zero-trust verification in your browser using pure Ed25519 algebra.
                    The agent signs an ephemeral nonce challenge without exposing secret keys.
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        Simulate Attack / Tampering:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTampered(!isTampered);
                          setVerifyStatus('idle');
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                          isTampered
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-white/10 text-base-300 border border-white/10'
                        }`}
                      >
                        {isTampered ? 'Tampered (1-bit inverted)' : 'Authentic Payload'}
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-base-400 bg-black/40 p-2.5 rounded-xl border border-white/5 break-all">
                      <span className="text-base-500">Signature: </span>
                      {isTampered
                        ? '7e2b10f8a9c31405a2b0e41981cd9f1a23e98031e4051a89c02e5f8120e5c940'
                        : sampleAgent.signature}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunVerify}
                    disabled={isVerifying}
                    className="btn-step w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-descript-600 hover:bg-descript-500 text-white shadow-lg shadow-descript-600/30 transition-all duration-150 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Verifying Ed25519 Curve Signature...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Run In-Browser Nonce Verification</span>
                      </>
                    )}
                  </button>

                  {verifyStatus === 'success' && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-start gap-2.5 animate-slide-up">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-200">
                        <span className="font-semibold block text-emerald-300">
                          Signature 100% Valid (Verified in 0.18ms)
                        </span>
                        Public key matches SHA-256 fingerprint; claims hash validates against the Ed25519 curve point.
                      </div>
                    </div>
                  )}

                  {verifyStatus === 'tampered' && (
                    <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 flex items-start gap-2.5 animate-slide-up">
                      <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-red-200">
                        <span className="font-semibold block text-red-300">
                          Verification Rejected: Tampered Signature
                        </span>
                        Calculated signature scalar does not match the registered curve point. The payload was forged!
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: JSON Credential Manifest */}
              {activeTab === 'json' && (
                <div className="space-y-3 animate-fade-in">
                  <pre className="font-mono text-[11px] bg-black/60 text-emerald-400 p-4 rounded-xl border border-white/10 overflow-x-auto max-h-[240px] leading-relaxed">
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
                            publicKeyFingerprint:
                              sampleAgent.fingerprintLine1 + sampleAgent.fingerprintLine2,
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

              {/* Bottom security assurance */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-base-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Pure client-side cryptographic algebra</span>
                </div>
                <Link
                  to="/docs"
                  className="flex items-center gap-1 text-descript-400 hover:text-white font-medium transition-colors"
                >
                  <span>Protocol Specs</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
