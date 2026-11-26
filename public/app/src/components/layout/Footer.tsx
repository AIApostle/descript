import { Code, Cpu, Fingerprint, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const productLinks = [
    { label: 'Agent Dashboard', to: '/dashboard' },
    { label: 'Register Agent', to: '/agents/new' },
    { label: 'Verify Bytecript', to: '/verify' },
  ];

  const developerLinks = [
    { label: 'Python SDK Guide', to: '/docs' },
    { label: 'Developer API Keys', to: '/developers' },
    { label: 'Public Resolver', to: '/verify' },
  ];

  const platformLinks = [
    { label: 'Sign In', to: '/login' },
    { label: 'Create Account', to: '/signup' },
    { label: 'Settings', to: '/settings' },
  ];

  return (
    <footer className="bg-base-900 text-white no-print">
      <div className="container-wide">
        <div className="py-14 border-b border-base-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-descript-600 text-white">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div className="font-semibold text-xl">Descript</div>
              </div>
              <p className="text-base-400 text-sm leading-relaxed max-w-xs">
                Cryptographic identity infrastructure and Bytecript credentials for AI agents.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-descript-400" />
                Platform
              </h3>
              <ul className="space-y-2.5">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-base-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Code className="h-4 w-4 text-descript-400" />
                Developers
              </h3>
              <ul className="space-y-2.5">
                {developerLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-base-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-descript-400" />
                Account
              </h3>
              <ul className="space-y-2.5">
                {platformLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-base-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-base-400 text-xs">
          <div>Descript Identity Platform</div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>Ed25519 Agent Identity & Python SDK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
