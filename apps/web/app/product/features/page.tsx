import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-6">Product Features</h1>
        <div className="prose prose-lg text-secondary max-w-none">
          <p>Ladeway offers a suite of powerful features designed to supercharge your sales pipeline.</p>
          <ul>
            <li><strong>AI Voice Calls:</strong> Ultra-low latency voice qualification using state-of-the-art STT/TTS.</li>
            <li><strong>Smart Chatbots:</strong> Natural text conversations with dynamic lead scoring.</li>
            <li><strong>Custom Personas:</strong> Tailor the AI's tone, language, and behavior to match your brand.</li>
            <li><strong>Automated Handoff:</strong> Hot leads are instantly routed to your human sales representatives.</li>
          </ul>
          <p>More detailed feature breakdowns coming soon.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
