import { CheckCircle, Fingerprint, Globe, Lock, Network, Shield } from 'lucide-react';

export default function ValuePropositionSection() {
  const values = [
    {
      icon: <Fingerprint className="h-6 w-6" />,
      title: 'Persistent Identity',
      description:
        'A single, globally unique Agent ID that stays constant across model upgrades, deployments, and key rotations.',
      features: ['Canonical Agent ID', 'Ed25519 key binding', 'Full lifecycle states'],
      iconClass: 'bg-descript-50 text-descript-600 dark:bg-descript-950 dark:text-descript-400',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Cryptographic Trust',
      description:
        'Verify agent authenticity through challenge-response signing and signed Bytecript identity cards.',
      features: ['Zero server key custody', 'Instant revocation', 'Tamper-evident audit log'],
      iconClass: 'bg-trust-50 text-trust-600 dark:bg-trust-950 dark:text-trust-400',
    },
    {
      icon: <Network className="h-6 w-6" />,
      title: 'Byte Network Residence',
      description:
        'Register inside isolated or federated Byte Networks so relying services know exactly where an agent resides.',
      features: ['Namespace governance', 'Public Bytecript resolver', 'Cross-service portability'],
      iconClass: 'bg-identity-50 text-identity-600 dark:bg-identity-950 dark:text-identity-400',
    },
  ];

  const capabilities = [
    {
      title: 'Agent Verification',
      description: 'Verify challenge signatures against active public keys in milliseconds',
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: 'Portable Bytecripts',
      description: 'Export and validate signed digital identity cards offline or via API',
      icon: <Globe className="h-5 w-5" />,
    },
    {
      title: 'Credential Rotation',
      description: 'Roll out new Ed25519 keys cleanly while keeping audit history intact',
      icon: <Lock className="h-5 w-5" />,
    },
  ];

  return (
    <section id="value" className="py-20 md:py-24 bg-white dark:bg-base-950 relative">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold text-base-900 dark:text-white mb-4">
            One identity. Verified everywhere.
          </h2>

          <p className="text-base md:text-lg text-base-600 dark:text-base-300 leading-relaxed">
            Descript provides the registry, Bytecript cards, and Python SDK so every autonomous agent proves who it is.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {values.map((value, index) => (
            <div
              key={index}
              className="rounded-xl border border-base-200 dark:border-base-800 bg-white dark:bg-base-900 p-7 hover:shadow-lg hover:border-descript-300 dark:hover:border-descript-700 transition-all"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-5 ${value.iconClass}`}>
                {value.icon}
              </div>

              <h3 className="text-lg font-semibold text-base-900 dark:text-white mb-2.5">
                {value.title}
              </h3>
              <p className="text-sm text-base-600 dark:text-base-300 mb-5 leading-relaxed">
                {value.description}
              </p>

              <div className="space-y-2.5">
                {value.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-descript-500" />
                    <span className="text-xs font-medium text-base-700 dark:text-base-200">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-base-50 dark:bg-base-900 rounded-2xl p-8 border border-base-200 dark:border-base-800">
          <div className="grid md:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="bg-white dark:bg-base-950 rounded-xl border border-base-200 dark:border-base-800 p-5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 h-9 w-9 rounded-lg bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 flex items-center justify-center">
                    {capability.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-base-900 dark:text-white mb-1">
                      {capability.title}
                    </h4>
                    <p className="text-xs text-base-600 dark:text-base-400 leading-relaxed">
                      {capability.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
