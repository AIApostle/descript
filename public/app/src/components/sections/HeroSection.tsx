import { ArrowRight, CheckCircle2, Fingerprint, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-24 md:pb-20 overflow-hidden bg-gradient-to-b from-base-50 to-white dark:from-base-950 dark:to-base-950">
      <div className="container-wide relative">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-descript-50 dark:bg-descript-950/60 text-descript-700 dark:text-descript-300 rounded-full text-xs font-medium uppercase tracking-wider mb-5">
              <Fingerprint className="h-3.5 w-3.5" />
              Agent Identity Infrastructure
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-base-900 dark:text-white mb-5 leading-tight">
              Give every AI agent a verifiable{' '}
              <span className="text-gradient">identity</span>
            </h1>

            <p className="text-base md:text-lg text-base-600 dark:text-base-300 leading-relaxed max-w-xl mb-8">
              Persistent Agent IDs, client-side Ed25519 credentials, signed Bytecript cards, and a native Python SDK.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2.5 bg-descript-600 text-white hover:bg-descript-700 active:bg-descript-800 transition-all duration-150 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <span>Register an Agent</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center justify-center gap-2.5 bg-white dark:bg-base-900 text-base-800 dark:text-base-100 border border-base-300 dark:border-base-700 hover:bg-base-50 dark:hover:bg-base-800 transition-all duration-150 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-lg"
              >
                <ShieldCheck className="h-4 w-4 text-descript-600 dark:text-descript-400" />
                <span>Python SDK</span>
              </Link>
            </div>
          </div>

          {/* Right Visual: Bytecript Card Preview */}
          <div className="lg:col-span-6">
            <div className="relative bg-white dark:bg-base-900 rounded-2xl border-2 border-base-200 dark:border-base-700 shadow-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-descript-600 text-white flex items-center justify-center">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-base-500 dark:text-base-400">
                      BYTECRIPT
                    </div>
                    <div className="font-semibold text-sm text-base-900 dark:text-white">
                      Digital Identity Card
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-identity-50 dark:bg-identity-950/60 text-identity-800 dark:text-identity-300 border border-identity-200 dark:border-identity-800 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-identity-600 dark:text-identity-400" />
                  <span>Verified & Active</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-base-500 dark:text-base-400 mb-0.5">Agent Name</div>
                  <div className="font-semibold text-xl text-base-900 dark:text-white">
                    API Integration Agent
                  </div>
                </div>

                <div>
                  <div className="text-xs text-base-500 dark:text-base-400 mb-1">Agent ID</div>
                  <div className="font-mono text-xs sm:text-sm bg-base-50 dark:bg-base-950 p-3 rounded-lg border border-base-200 dark:border-base-800 text-base-700 dark:text-base-200 break-all">
                    agent_01936a4e8c207f1ab8492e1f4c73b091
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-base-200 dark:border-base-800">
                  <div>
                    <div className="text-xs text-base-500 dark:text-base-400 mb-0.5">Byte Network</div>
                    <div className="font-mono text-sm font-medium text-base-900 dark:text-base-100">
                      kiroween
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-base-500 dark:text-base-400 mb-0.5">Residence</div>
                    <div className="font-mono text-sm font-medium text-base-900 dark:text-base-100">
                      kiroween-residence
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-base-500 dark:text-base-400 mb-1">
                    Public Key Fingerprint (ed25519 | SHA256)
                  </div>
                  <div className="font-mono text-xs bg-base-50 dark:bg-base-950 p-3 rounded-lg border border-base-200 dark:border-base-800 text-base-600 dark:text-base-300 leading-relaxed">
                    3f4a2b1c 9e8d7c6b 5a4f3e2d 1c0b9a8f
                    <br />
                    7e6d5c4b 3a2f1e0d 9c8b7a69 5f4e3d2c
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
