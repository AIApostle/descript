import { Database, Globe, Key, ShieldCheck, Users, Zap } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      icon: <Key className="h-5 w-5" />,
      title: 'Generate Keypair',
      description:
        'Create an Ed25519 keypair in Python or in your browser. Private keys remain strictly in your control.',
      detail: 'Zero server custody',
      badgeClass: 'bg-descript-50 text-descript-600 dark:bg-descript-950 dark:text-descript-400',
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: 'Register on Network',
      description:
        'Bind your public key inside a Byte Network and receive a permanent canonical Agent ID.',
      detail: 'Backed by Neon Postgres',
      badgeClass: 'bg-trust-50 text-trust-600 dark:bg-trust-950 dark:text-trust-400',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Issue Bytecript',
      description:
        'Descript signs a portable Bytecript digital card capturing your agent claims and SHA256 fingerprint.',
      detail: 'Ed25519 authority seal',
      badgeClass: 'bg-identity-50 text-identity-600 dark:bg-identity-950 dark:text-identity-400',
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Verify Anywhere',
      description:
        'Services like Bytebank verify challenge signatures and live status in real time.',
      detail: 'Challenge-response API',
      badgeClass: 'bg-descript-50 text-descript-600 dark:bg-descript-950 dark:text-descript-400',
    },
  ];

  const technicalFeatures = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Fast Verification',
      description: 'Low-latency public resolution and Ed25519 signature checks',
      metric: 'Ed25519',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: '256-bit Fingerprints',
      description: 'Deterministic SHA-256 fingerprints across UI, API, and Python SDK',
      metric: 'SHA-256',
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Python-First SDK',
      description: 'Synchronous and async clients tailored for Python agent frameworks',
      metric: 'Python 3.11+',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-24 bg-base-50 dark:bg-base-900/50 relative overflow-hidden"
    >
      <div className="container-narrow relative">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-descript-50 dark:bg-descript-950/60 text-descript-700 dark:text-descript-300 rounded-full text-xs font-medium uppercase tracking-wider mb-4">
            How Descript Works
          </div>

          <h2 className="text-3xl md:text-4xl font-semibold text-base-900 dark:text-white mb-4">
            Identity infrastructure from keygen to verification
          </h2>

          <p className="text-base md:text-lg text-base-600 dark:text-base-300 leading-relaxed">
            Four clear steps to give any Python agent a verifiable, revocable identity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white dark:bg-base-900 rounded-xl border border-base-200 dark:border-base-800 p-6 shadow-xs hover:shadow-md hover:border-descript-300 dark:hover:border-descript-700 transition-all"
            >
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center mb-4 ${step.badgeClass}`}>
                {step.icon}
              </div>

              <h3 className="text-lg font-semibold text-base-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-base-600 dark:text-base-300 mb-4 leading-relaxed">
                {step.description}
              </p>

              <div className="text-xs font-medium text-base-600 dark:text-base-300 bg-base-50 dark:bg-base-950 px-3 py-1 rounded-full inline-block border border-base-200 dark:border-base-800">
                {step.detail}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-base-900 rounded-2xl border border-base-200 dark:border-base-800 p-8 shadow-xs">
          <div className="grid md:grid-cols-3 gap-6">
            {technicalFeatures.map((feature, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-xl bg-base-50/70 dark:bg-base-950/60"
              >
                <div className="inline-flex h-11 w-11 rounded-xl bg-descript-50 dark:bg-descript-950 text-descript-600 dark:text-descript-400 items-center justify-center mb-4">
                  {feature.icon}
                </div>

                <div className="text-xl font-bold font-mono text-base-900 dark:text-white mb-1.5">
                  {feature.metric}
                </div>
                <h4 className="font-semibold text-sm text-base-900 dark:text-white mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-base-600 dark:text-base-400">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-base-200 dark:border-base-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-base-500 dark:text-base-400 mb-1">
                  PYTHON SDK QUICKSTART
                </div>
                <h4 className="font-semibold text-base text-base-900 dark:text-white">
                  Register an agent and sign challenges in Python
                </h4>
              </div>
              <div className="text-xs font-mono font-medium text-descript-700 dark:text-descript-300 bg-descript-50 dark:bg-descript-950 px-3 py-1.5 rounded-full">
                pip install descript
              </div>
            </div>

            <div className="bg-base-950 rounded-xl p-5 overflow-x-auto">
              <pre className="text-xs sm:text-sm font-mono text-base-100 leading-relaxed">
                <code>{`from descript import DescriptClient

with DescriptClient(api_key="dsc_live_...") as client:
    agent, keypair = client.agents.create_with_generated_key(
        name="API Integration Agent",
        byte_network="kiroween",
        capabilities=["api_integration", "data_processing"],
    )

    print(agent.id)  # agent_01936a4e...
    signature = keypair.sign("Hello, I am API Integration Agent")`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
