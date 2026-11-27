import { Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-base-200 dark:border-base-800 bg-white dark:bg-base-950 py-12 sm:py-16 no-print">
      <div className="container-wide">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-full bg-descript-600 text-white flex items-center justify-center">
                <Fingerprint className="h-4 w-4" />
              </div>
              <span className="font-semibold text-lg text-base-950 dark:text-white">Descript</span>
            </Link>
            <p className="text-xs sm:text-sm text-base-500 dark:text-base-400 max-w-sm leading-relaxed mb-4">
              The cryptographic identity, credential registration, and verification standard for autonomous AI agents.
            </p>
            <div className="flex items-center gap-2 text-xs text-base-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-descript-500 animate-pulse" />
              <span>Cryptographic Identity Standard • Ed25519 Engine</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-base-900 dark:text-white mb-3">
              Platform
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-base-500 dark:text-base-400">
              <li>
                <Link to="/dashboard" className="hover:text-base-900 dark:hover:text-white transition-colors">
                  Agent Console
                </Link>
              </li>
              <li>
                <Link to="/agents/new" className="hover:text-base-900 dark:hover:text-white transition-colors">
                  Register Agent
                </Link>
              </li>
              <li>
                <Link to="/developers" className="hover:text-base-900 dark:hover:text-white transition-colors">
                  API Keys & Health
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-base-900 dark:text-white mb-3">
              Developers
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-base-500 dark:text-base-400">
              <li>
                <Link to="/docs" className="hover:text-base-900 dark:hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-base-900 dark:hover:text-white transition-colors">
                  Python SDK Guide
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/AIApostle/descript"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-base-900 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Standards & Specs */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-base-900 dark:text-white mb-3">
              Standards
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-base-500 dark:text-base-400">
              <li>
                <span className="hover:text-base-900 dark:hover:text-white transition-colors">
                  Bytecript v1
                </span>
              </li>
              <li>
                <span className="hover:text-base-900 dark:hover:text-white transition-colors">
                  Curve25519 / Ed25519
                </span>
              </li>
              <li>
                <span className="hover:text-base-900 dark:hover:text-white transition-colors">
                  UUIDv7 Identifiers
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-base-200 dark:border-base-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-500 dark:text-base-400">
          <div>&copy; {new Date().getFullYear()} Descript Identity Infrastructure. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Zero-Trust Architecture</span>
            <span>&bull;</span>
            <span>Client-Side Cryptography</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
