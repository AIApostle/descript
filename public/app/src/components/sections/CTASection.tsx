import { ArrowRight, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden bg-base-950 text-white">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-1/4 w-[600px] h-[400px] ambient-glow-indigo blur-3xl opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/4 w-[500px] h-[350px] ambient-glow-emerald blur-3xl opacity-30"
      />

      <div className="container-wide relative z-10">
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-14 text-center shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-descript-950/90 text-descript-300 border border-descript-800 mb-6">
            <ShieldCheck className="h-4 w-4 text-descript-400" />
            <span>Ready for Production Fleets</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            Deploy your first verifiable agent in under two minutes
          </h2>

          <p className="text-base sm:text-lg text-base-300 leading-relaxed max-w-2xl mx-auto mb-10">
            Generate Ed25519 keys, mint a persistent Bytecript identity passport, and start verifying
            cross-service interactions using the Python SDK.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              to="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-descript-500 to-indigo-500 hover:from-descript-400 hover:to-indigo-400 text-white font-semibold text-base px-8 py-4 rounded-full shadow-lg shadow-descript-500/25 transition-all duration-200 active:scale-[0.98]"
            >
              <span>Get Started Now</span>
              <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link
              to="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold text-base px-7 py-4 rounded-full border border-white/10 transition-all duration-200"
            >
              <Terminal className="h-4 w-4 text-descript-400" />
              <span>Verify Any Agent Online</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-base-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-identity-400" />
              <span>Free Community Registry</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-identity-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-identity-400" />
              <span>Zero Server Key Custody</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
