import {
  Bot,
  FileCheck,
  Landmark,
  Network,
  Workflow,
} from 'lucide-react';

export default function UseCasesSection() {
  const useCases = [
    {
      icon: <Landmark className="h-5 w-5" />,
      tag: 'Fintech & Banking',
      title: 'Bytebank Agent Banking',
      description:
        'Agents open accounts, request settlement rails, and sign financial transactions using Ed25519 challenge-response authentication with zero shared passwords.',
      chips: ['Proof of Origin', 'Nonce Challenges', 'Audit Ledger'],
    },
    {
      icon: <Network className="h-5 w-5" />,
      tag: 'Multi-Agent Mesh',
      title: 'Agent-to-Agent Swarms',
      description:
        'Verify caller provenance before executing sensitive delegated tasks. Agents check each other’s Bytecript credentials and residence network.',
      chips: ['Mutual TLS Alternative', 'Claim Validation', 'Anti-Spoofing'],
    },
    {
      icon: <Workflow className="h-5 w-5" />,
      tag: 'DevOps & CI/CD',
      title: 'Automated Migration Workers',
      description:
        'Issue short-lived or long-lived keypairs to deployment bots with automated key rotation and instant kill-switch revocation.',
      chips: ['Key Rotation', 'Instant Revocation', 'Zero Downtime'],
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      tag: 'Compliance & Audit',
      title: 'Verifiable Agent Output',
      description:
        'Attach signed Bytecript cryptographic proofs to model generations, legal summaries, or compliance decisions for non-repudiation.',
      chips: ['SHA-256 Signatures', 'Portable Manifests', 'Offline Verification'],
    },
  ];

  return (
    <section id="use-cases" className="py-24 sm:py-32 bg-white dark:bg-base-950 relative">
      <div className="container-wide">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-identity-50 dark:bg-identity-950/80 text-identity-700 dark:text-identity-300 border border-identity-200/80 dark:border-identity-800/80 mb-4">
            <Bot className="h-3.5 w-3.5" />
            <span>Real-World Production Scenarios</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-base-950 dark:text-white mb-5 leading-tight">
            Engineered for high-assurance autonomous systems
          </h2>
          <p className="text-base sm:text-lg text-base-600 dark:text-base-300 leading-relaxed">
            From financial agent settlement to cross-model swarm orchestration, Descript provides the trust anchor.
          </p>
        </div>

        {/* 4 Cards Bento */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16">
          {useCases.map((uc, index) => (
            <div key={index} className="double-bezel">
              <div className="double-bezel-inner h-full flex flex-col justify-between p-7 sm:p-8">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-base-100 dark:bg-base-900 text-descript-600 dark:text-descript-400 flex items-center justify-center border border-base-200 dark:border-base-800">
                      {uc.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-base-100 dark:bg-base-900 text-base-600 dark:text-base-300 border border-base-200 dark:border-base-800">
                      {uc.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-base-950 dark:text-white mb-2.5">
                    {uc.title}
                  </h3>
                  <p className="text-sm text-base-600 dark:text-base-300 leading-relaxed mb-6">
                    {uc.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-base-200/80 dark:border-base-800/80">
                  {uc.chips.map((chip, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-base-50 dark:bg-base-900 text-base-700 dark:text-base-300 border border-base-200/60 dark:border-base-800/60 font-medium"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
