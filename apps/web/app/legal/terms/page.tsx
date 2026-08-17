import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-2">Terms of Service</h1>
        <p className="text-secondary mb-12">Last Updated: August 2026</p>
        
        <div className="prose prose-lg text-secondary max-w-none">
          <p>Welcome to Ladeway. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By creating an account, you agree to these terms. If you do not agree to these terms, you may not use our services.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">2. Usage Restrictions</h2>
          <p>You agree not to use Ladeway's AI agents to:</p>
          <ul>
            <li>Conduct illegal or fraudulent activities.</li>
            <li>Harass, abuse, or harm another person.</li>
            <li>Collect sensitive information (such as SSNs or credit card numbers) without proper authorization and security measures.</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">3. API Fair Use</h2>
          <p>Our "Unlimited" plans are subject to a fair use policy to prevent automated abuse. We reserve the right to throttle or suspend accounts that generate anomalous or malicious traffic spikes.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">4. Limitation of Liability</h2>
          <p>Ladeway provides AI qualification services "as is". We are not liable for lost revenue or damages resulting from conversational hallucinations, API downtime, or missed leads.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
