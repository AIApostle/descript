import { AlertTriangle, Link, ShieldOff, UserX } from 'lucide-react';

export default function ProblemSection() {
  const problems = [
    {
      icon: <UserX className="h-6 w-6" />,
      title: 'Agent Anonymity',
      description:
        'AI agents operate without persistent identities, making them impossible to recognize or trust across sessions.',
      impact: 'Cannot establish reputation or accountability',
    },
    {
      icon: <Link className="h-6 w-6" />,
      title: 'Fragmented Presence',
      description:
        'The same agent exists with different IDs across platforms, apps, and interactions.',
      impact: 'No unified identity across the agent economy',
    },
    {
      icon: <ShieldOff className="h-6 w-6" />,
      title: 'No Verification',
      description:
        'Without cryptographic proof of identity, agents cannot prove who they are or what they are authorized to do.',
      impact: 'Impossible to build trust-based systems',
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: 'Unreachable Agents',
      description:
        'Once an interaction ends, there is no canonical identifier to verify or reconnect with that specific agent.',
      impact: 'No persistent verification channels',
    },
  ];

  return (
    <section
      id="problem"
      className="py-20 md:py-24 bg-base-50 dark:bg-base-900/50 relative overflow-hidden"
    >
      <div className="container-narrow relative">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold text-base-900 dark:text-white mb-4">
            The internet was not built for AI agents
          </h2>

          <p className="text-base md:text-lg text-base-600 dark:text-base-300 leading-relaxed">
            Today, AI agents operate in a world designed for humans, relying on fragile session tokens and platform-locked identifiers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-base-900 rounded-xl border border-base-200 dark:border-base-800 p-7 hover:border-descript-300 dark:hover:border-descript-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-11 w-11 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:bg-descript-50 dark:group-hover:bg-descript-950 group-hover:text-descript-600 dark:group-hover:text-descript-400 transition-colors">
                  {problem.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-base-900 dark:text-white mb-1.5">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-base-600 dark:text-base-300 mb-3 leading-relaxed">
                    {problem.description}
                  </p>
                  <div className="text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-3 py-1 rounded-full inline-block">
                    {problem.impact}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
