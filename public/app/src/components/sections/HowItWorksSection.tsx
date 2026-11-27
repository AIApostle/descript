import {
  ArrowRight,
  Database,
  FileCheck2,
  KeyRound,
  Layers,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Generate Local Keypair',
      description:
        'Create an Ed25519 public/private keypair client-side via Python SDK or in-browser WebCrypto. Private keys never leave your custody.',
      code: 'pair = KeyPair.generate()\n# Secret key remains in memory/HSM',
      icon: <KeyRound className="h-5 w-5" />,
      badge: 'Zero Custody',
    },
    {
      number: '02',
      title: 'Bind to Byte Network',
      description:
        'Register your agent public key inside a governed Byte Network namespace (e.g. kiroween) to receive an immutable UUIDv7 Agent ID.',
      code: 'agent = client.agents.create(\n    name="Trader",\n    public_key=pair.public_key_hex\n)',
      icon: <Database className="h-5 w-5" />,
      badge: 'Neon Database',
    },
    {
      number: '03',
      title: 'Receive Bytecript Passport',
      description:
        'Descript signs a portable Bytecript manifest with the controller key, embedding claims, status, and public key fingerprint.',
      code: 'bytecript = agent.bytecript\n# Includes cryptographic authority seal',
      icon: <FileCheck2 className="h-5 w-5" />,
      badge: 'Ed25519 Seal',
    },
    {
      number: '04',
      title: 'Mutual Zero-Trust Verification',
      description:
        'Services issue a cryptographic nonce challenge. The agent signs it with its private key, proving identity with zero shared secrets.',
      code: 'challenge = client.verify.create_challenge(agent_id)\nsig = pair.sign(challenge.nonce)\nvalid = client.verify.solve(challenge.id, sig)',
      icon: <Radio className="h-5 w-5" />,
      badge: 'Challenge-Response',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-base-50/70 dark:bg-base-900/30 relative overflow-hidden">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-trust-50 dark:bg-trust-950/80 text-trust-700 dark:text-trust-300 border border-trust-200/80 dark:border-trust-800/80 mb-4">
            <Layers className="h-3.5 w-3.5" />
            <span>Cryptographic Handshake Protocol</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-base-950 dark:text-white mb-5 leading-tight">
            How Descript issues and verifies identities
          </h2>
          <p className="text-base sm:text-lg text-base-600 dark:text-base-300 leading-relaxed">
            From local key generation to cross-platform challenge signing, every step is mathematically verifiable.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {steps.map((step, idx) => (
            <div key={idx} className="double-bezel card-lift flex flex-col justify-between">
              <div className="double-bezel-inner h-full flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="font-mono text-2xl font-black text-descript-600/60 dark:text-descript-400/60">
                      {step.number}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-base-100 dark:bg-base-900 text-base-500 border border-base-200 dark:border-base-800">
                      {step.badge}
                    </span>
                  </div>

                  <div className="h-10 w-10 rounded-xl bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center mb-4 border border-descript-100 dark:border-descript-900">
                    {step.icon}
                  </div>

                  <h3 className="text-lg font-bold text-base-950 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-base-600 dark:text-base-300 leading-relaxed mb-5">
                    {step.description}
                  </p>
                </div>

                {/* Code preview block */}
                <pre className="font-mono text-[10px] bg-base-950 text-base-200 p-3 rounded-xl border border-base-800/80 overflow-x-auto leading-relaxed">
                  <code>{step.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Bar */}
        <div className="text-center">
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-descript-600 dark:text-descript-400 hover:text-descript-700 dark:hover:text-descript-300 group"
          >
            <span>Read full cryptographic protocol specification</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
