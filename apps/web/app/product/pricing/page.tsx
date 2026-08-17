import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-secondary">Pay only for the leads we successfully qualify for you.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-primary mb-2">Starter</h3>
            <p className="text-secondary mb-6 flex-1">Perfect for small businesses exploring AI qualification.</p>
            <div className="mb-6"><span className="text-4xl font-extrabold text-primary">$49</span><span className="text-secondary">/mo</span></div>
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white mb-6">Start Free Trial</Button>
            <ul className="space-y-3 text-sm text-secondary">
              <li>✓ 100 Qualified Leads</li>
              <li>✓ Basic Text AI Chatbot</li>
              <li>✓ Email Support</li>
            </ul>
          </div>
          <div className="bg-primary p-8 rounded-2xl border border-primary-dark shadow-xl flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
            <h3 className="text-xl font-bold text-white mb-2">Growth</h3>
            <p className="text-primary-light mb-6 flex-1">For growing teams that need real-time voice and integrations.</p>
            <div className="mb-6"><span className="text-4xl font-extrabold text-white">$199</span><span className="text-primary-light">/mo</span></div>
            <Button className="w-full bg-white text-primary hover:bg-gray-100 mb-6">Get Started</Button>
            <ul className="space-y-3 text-sm text-white">
              <li>✓ 1,000 Qualified Leads</li>
              <li>✓ Voice + Text AI Agents</li>
              <li>✓ CRM Integrations</li>
              <li>✓ Priority Support</li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-primary mb-2">Enterprise</h3>
            <p className="text-secondary mb-6 flex-1">Custom limits and dedicated infrastructure for high volume.</p>
            <div className="mb-6"><span className="text-4xl font-extrabold text-primary">Custom</span></div>
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white mb-6">Contact Sales</Button>
            <ul className="space-y-3 text-sm text-secondary">
              <li>✓ Unlimited Leads</li>
              <li>✓ Custom AI Models (Llama, GPT-4)</li>
              <li>✓ White-labeling</li>
              <li>✓ Dedicated Success Manager</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
