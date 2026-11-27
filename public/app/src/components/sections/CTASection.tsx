import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden bg-base-950 text-white">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-1/4 w-[600px] h-[400px] ambient-glow-indigo blur-3xl opacity-35"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/4 w-[500px] h-[350px] ambient-glow-emerald blur-3xl opacity-20"
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
            cross-service interactions.
          </p>

          <div className="flex items-center justify-center">
            <Link
              to="/signup"
              className="btn-step group inline-flex items-center justify-center gap-3 bg-descript-600 hover:bg-descript-700 text-white font-semibold text-base px-8 py-4 rounded-full shadow-lg shadow-descript-600/25 transition-all duration-200 active:scale-[0.98]"
            >
              <span>Get Started</span>
              <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
