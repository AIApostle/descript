import Footer from '../components/layout/Footer';
import Navigation from '../components/layout/Navigation';
import CTASection from '../components/sections/CTASection';
import HeroSection from '../components/sections/HeroSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import ProblemSection from '../components/sections/ProblemSection';
import UseCasesSection from '../components/sections/UseCasesSection';
import ValuePropositionSection from '../components/sections/ValuePropositionSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-base-950">
      <Navigation />
      <main>
        <HeroSection />
        <ProblemSection />
        <ValuePropositionSection />
        <HowItWorksSection />
        <UseCasesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
