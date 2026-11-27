import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  UserX,
  XCircle,
} from 'lucide-react';

export default function ProblemSection() {
  const failureModes = [
    {
      title: 'Shared Static Secrets',
      traditional: 'Hardcoded API tokens in prompts or config files vulnerable to exfiltration.',
      descript: 'Asymmetric Ed25519 keypairs. Private keys never leave the agent runtime.',
    },
    {
      title: 'Ephemeral Session Amnesia',
      traditional: 'Agents lose identity between container reboots or provider migrations.',
      descript: 'Permanent UUIDv7 Agent IDs persisted canonically in Neon PostgreSQL.',
    },
    {
      title: 'Forged Payloads & Impersonation',
      traditional: 'No mathematical proof that output originated from a specific agent model.',
      descript: 'Challenge-response signatures and signed Bytecript identity cards.',
    },
    {
      title: 'Cross-Network Isolation',
      traditional: 'Identities are platform-locked silos unable to interact with external services.',
      descript: 'Byte Networks provide namespace governance and public verification APIs.',
    },
  ];

  return (
    <section id="problem" className="py-24 sm:py-32 bg-base-50/70 dark:bg-base-900/40 relative">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800/80 mb-4">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>The Identity Crisis in Autonomous AI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-base-950 dark:text-white mb-5 leading-tight">
            The internet was built for humans. Not autonomous agents.
          </h2>
          <p className="text-base sm:text-lg text-base-600 dark:text-base-300 leading-relaxed">
            When autonomous agents communicate with APIs, financial systems, or peer agents,
            relying on bearer tokens is an existential security flaw.
          </p>
        </div>

        {/* Comparison Bento Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Card 1: Traditional Fragile State */}
          <div className="double-bezel card-lift">
            <div className="double-bezel-inner h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <UserX className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                      Vulnerable Pattern
                    </span>
                    <h3 className="text-xl font-bold text-base-900 dark:text-white">
                      Bearer Tokens & Ephemeral State
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {failureModes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-base-50/80 dark:bg-base-900/40 border border-base-200/60 dark:border-base-800/60">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-base-900 dark:text-base-200 mb-0.5">
                          {item.title}
                        </div>
                        <div className="text-xs text-base-500 dark:text-base-400 leading-relaxed">
                          {item.traditional}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 font-medium">
                Result: Zero audit accountability, unverified agent impersonation, and prompt extraction risks.
              </div>
            </div>
          </div>

          {/* Card 2: Descript Architecture */}
          <div className="double-bezel card-lift">
            <div className="double-bezel-inner h-full flex flex-col justify-between border-descript-200/80 dark:border-descript-800/80">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-identity-100 dark:bg-identity-950/80 text-identity-600 dark:text-identity-400 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-identity-600 dark:text-identity-400">
                      Descript Architecture
                    </span>
                    <h3 className="text-xl font-bold text-base-900 dark:text-white">
                      Zero-Trust Cryptographic Identity
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {failureModes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-identity-50/30 dark:bg-identity-950/20 border border-identity-200/40 dark:border-identity-800/40">
                      <CheckCircle2 className="h-4 w-4 text-identity-600 dark:text-identity-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-base-900 dark:text-base-200 mb-0.5">
                          {item.title}
                        </div>
                        <div className="text-xs text-base-600 dark:text-base-300 leading-relaxed">
                          {item.descript}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-identity-50 dark:bg-identity-950/50 border border-identity-200/80 dark:border-identity-800/80 text-xs text-identity-800 dark:text-identity-200 font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-identity-500 animate-pulse" />
                <span>Mathematical trust verifiable offline or via real-time challenge nonces.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
