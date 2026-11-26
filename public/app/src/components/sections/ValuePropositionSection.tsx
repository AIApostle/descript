import {
  CheckCircle,
  Cpu,
  Fingerprint,
  KeyRound,
  Shield,
} from 'lucide-react';

export default function ValuePropositionSection() {
  const pillars = [
    {
      icon: <Fingerprint className="h-6 w-6" />,
      badge: 'Persistence',
      title: 'Canonical Identity Registry',
      description:
        'Issue immutable UUIDv7 Agent IDs persisted in a resilient Neon PostgreSQL cluster. Identities survive model updates and host migrations.',
      features: [
        'Deterministic Agent IDs with embedded timestamp ordering',
        'Scoped Byte Network residency (e.g. kiroween)',
        'Full lifecycle state machine (active, suspended, revoked)',
      ],
      glow: 'from-descript-500/20 to-indigo-500/0',
    },
    {
      icon: <KeyRound className="h-6 w-6" />,
      badge: 'Zero-Custody',
      title: 'Ed25519 Cryptographic Trust',
      description:
        'Private keys are generated and held exclusively by the agent host. Descript acts as an identity issuer and verification authority.',
      features: [
        'Zero server-side private key custody',
        'SHA-256 public key fingerprinting',
        'Tamper-evident signed Bytecript passport issuance',
      ],
      glow: 'from-trust-500/20 to-blue-500/0',
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      badge: 'Interoperable',
      title: 'Native Python SDK Ecosystem',
      description:
        'Plug verifiable identity directly into CrewAI, LangChain, AutoGen, or custom asyncio daemons with zero friction.',
      features: [
        'Full sync & async high-throughput clients',
        'Offline & online Bytecript verification methods',
        'Interactive CLI for keygen, lookup, and health checks',
      ],
      glow: 'from-identity-500/20 to-emerald-500/0',
    },
  ];

  return (
    <section id="value" className="py-24 sm:py-32 bg-white dark:bg-base-950 relative overflow-hidden">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-descript-50 dark:bg-descript-950/80 text-descript-700 dark:text-descript-300 border border-descript-200/80 dark:border-descript-800/80 mb-4">
            <Shield className="h-3.5 w-3.5" />
            <span>Core Architecture Pillars</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-base-950 dark:text-white mb-5 leading-tight">
            Cryptographic trust designed for autonomous workflows
          </h2>
          <p className="text-base sm:text-lg text-base-600 dark:text-base-300 leading-relaxed">
            Eliminate session vulnerability with decentralized verification primitives, portable passports,
            and complete cryptographic provenance.
          </p>
        </div>

        {/* 3 Pillars Bento */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16">
          {pillars.map((pillar, index) => (
            <div key={index} className="double-bezel group hover:-translate-y-1 transition-transform duration-300">
              <div className="double-bezel-inner h-full flex flex-col justify-between relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${pillar.glow} rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500`}
                />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-base-100 dark:bg-base-900 text-descript-600 dark:text-descript-400 flex items-center justify-center border border-base-200 dark:border-base-800 shadow-sm">
                      {pillar.icon}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-300 border border-base-200 dark:border-base-800">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-base-950 dark:text-white mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-base-600 dark:text-base-300 leading-relaxed mb-6">
                    {pillar.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-base-200/80 dark:border-base-800/80">
                  {pillar.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-base-700 dark:text-base-200">
                      <CheckCircle className="h-4 w-4 text-identity-600 dark:text-identity-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Matrix Callout */}
        <div className="max-w-6xl mx-auto double-bezel">
          <div className="double-bezel-inner p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center lg:text-left">
              <span className="text-xs font-mono uppercase tracking-widest text-descript-600 dark:text-descript-400 font-bold">
                Verification Matrix
              </span>
              <h3 className="text-2xl font-bold text-base-950 dark:text-white">
                Offline or Online. You choose the trust model.
              </h3>
              <p className="text-sm text-base-600 dark:text-base-300 max-w-2xl leading-relaxed">
                Relying services can verify Bytecript signatures offline using public keys and math alone,
                or query Descript’s live API to check real-time suspension and revocation states.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 text-center">
                <div className="text-xs text-base-400 font-medium">Offline Latency</div>
                <div className="text-base font-bold font-mono text-identity-600 dark:text-identity-400">
                  &lt; 0.2ms
                </div>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-base-50 dark:bg-base-900 border border-base-200 dark:border-base-800 text-center">
                <div className="text-xs text-base-400 font-medium">Database Backend</div>
                <div className="text-base font-bold font-mono text-base-900 dark:text-white">
                  Neon Postgres
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
