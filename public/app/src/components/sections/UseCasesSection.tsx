import { Bot, Cpu, FileText, MessageSquare, Server, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UseCasesSection() {
  const useCases = [
    {
      icon: <Bot className="h-5 w-5" />,
      title: 'Service Authentication',
      description:
        'Let agents open accounts and authenticate with external APIs like Bytebank using signed challenges.',
      benefits: ['Zero shared secrets', 'Status enforcement', 'Challenge nonces'],
      iconClass: 'bg-descript-50 text-descript-600 dark:bg-descript-950 dark:text-descript-400',
    },
    {
      icon: <Server className="h-5 w-5" />,
      title: 'Enterprise AI Fleets',
      description:
        'Manage dozens of production agents with centralized suspension, key rotation, and immutable audit trails.',
      benefits: ['Instant suspension', 'Credential rotation', 'Audit timeline'],
      iconClass: 'bg-trust-50 text-trust-600 dark:bg-trust-950 dark:text-trust-400',
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Agent-to-Agent Trust',
      description:
        'Verify the sender identity and Byte Network residence before executing delegated agent tasks.',
      benefits: ['Signed payloads', 'Public resolver', 'Verified claims'],
      iconClass: 'bg-identity-50 text-identity-600 dark:bg-identity-950 dark:text-identity-400',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Portable Bytecripts',
      description:
        'Export JSON identity cards with Ed25519 issuer signatures for offline or air-gapped verification.',
      benefits: ['JSON export', 'QR verification', 'Offline checks'],
      iconClass: 'bg-descript-50 text-descript-600 dark:bg-descript-950 dark:text-descript-400',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Zero-Trust Access',
      description:
        'Bind unique asymmetric keys per agent runtime so compromised keys can be revoked without downtime.',
      benefits: ['Multi-key transition', 'Granular revocation', 'Reason tracking'],
      iconClass: 'bg-trust-50 text-trust-600 dark:bg-trust-950 dark:text-trust-400',
    },
    {
      icon: <Cpu className="h-5 w-5" />,
      title: 'Python Agent Frameworks',
      description:
        'Drop the Python SDK into LangGraph, CrewAI, Google ADK, or custom asyncio workers.',
      benefits: ['Sync & Async clients', 'Pydantic models', 'CLI keygen'],
      iconClass: 'bg-identity-50 text-identity-600 dark:bg-identity-950 dark:text-identity-400',
    },
  ];

  return (
    <section id="use-cases" className="py-20 md:py-24 bg-white dark:bg-base-950">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold text-base-900 dark:text-white mb-4">
            Built for autonomous Python workflows
          </h2>

          <p className="text-base md:text-lg text-base-600 dark:text-base-300 leading-relaxed">
            Pair the Descript web console with the Python SDK to register, verify, and govern agents across platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-white dark:bg-base-900 rounded-xl border border-base-200 dark:border-base-800 p-6 hover:shadow-lg hover:border-descript-300 dark:hover:border-descript-700 transition-all"
            >
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center mb-4 ${useCase.iconClass}`}>
                {useCase.icon}
              </div>

              <h3 className="text-lg font-semibold text-base-900 dark:text-white mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-base-600 dark:text-base-300 mb-4 leading-relaxed">
                {useCase.description}
              </p>

              <div className="space-y-2">
                {useCase.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-descript-500" />
                    <span className="text-xs font-medium text-base-700 dark:text-base-200">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          id="developers"
          className="bg-base-50 dark:bg-base-900 rounded-2xl border border-base-200 dark:border-base-800 p-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="lg:w-5/12">
              <div className="text-xs uppercase tracking-widest text-base-500 dark:text-base-400 mb-2">
                PYTHON SDK & REST API
              </div>
              <h3 className="text-2xl font-semibold text-base-900 dark:text-white mb-3">
                Verify agents in two calls
              </h3>
              <p className="text-sm text-base-600 dark:text-base-300 mb-5 leading-relaxed">
                Relying services inspect Bytecripts offline or verify live challenge signatures over HTTPS.
              </p>

              <Link
                to="/docs"
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-descript-600 text-white text-sm font-semibold hover:bg-descript-700 transition-colors"
              >
                Explore Python SDK Docs
              </Link>
            </div>

            <div className="lg:w-7/12 w-full">
              <div className="bg-base-950 rounded-xl p-5 overflow-x-auto">
                <pre className="text-xs font-mono text-base-100 leading-relaxed">
                  <code>{`from descript import AsyncDescriptClient, verify_bytecript_signature

async with AsyncDescriptClient(base_url="http://localhost:8000") as client:
    agent = await client.agents.get_public("agent_01936a4e...")
    assert verify_bytecript_signature(agent.bytecript)

    result = await client.verify.verify_message(
        agent.id,
        message="Authorize Bytebank account creation",
        signature=agent_signature,
    )
    print("Verified:", result.verified)`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
