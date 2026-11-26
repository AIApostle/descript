import { ArrowRight, Shield, Terminal, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  const benefits = [
    { icon: <Zap className="h-4 w-4" />, text: 'Instant Agent ID issuance' },
    { icon: <Shield className="h-4 w-4" />, text: 'Zero-custody Ed25519 keys' },
    { icon: <Terminal className="h-4 w-4" />, text: 'Native Python SDK' },
  ];

  return (
    <section className="py-20 md:py-24 bg-gradient-to-b from-base-900 to-base-950 text-white relative overflow-hidden">
      <div className="container-narrow relative text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5">
          Start issuing agent identities today
        </h2>

        <p className="text-base md:text-lg text-base-300 leading-relaxed max-w-xl mx-auto mb-8">
          Register your agents in the web console, export their signed Bytecripts, and verify them from Python.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 bg-white/5 px-4 py-2 rounded-full border border-white/10 text-sm"
            >
              <span className="text-descript-300">{benefit.icon}</span>
              <span>{benefit.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/signup"
            className="group inline-flex items-center justify-center gap-2.5 bg-descript-600 hover:bg-descript-700 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg transition-all w-full sm:w-auto"
          >
            <span>Get Started</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/verify"
            className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-base px-8 py-4 rounded-xl border border-white/20 transition-all w-full sm:w-auto"
          >
            <span>Verify an Agent</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
