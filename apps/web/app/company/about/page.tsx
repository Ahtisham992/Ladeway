import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-6">About Us</h1>
        <div className="prose prose-lg text-secondary max-w-none">
          <p className="text-xl font-medium text-primary mb-8">We believe that no lead should ever go cold.</p>
          <p>Founded in 2026, Ladeway was born out of a simple frustration: sales teams spend too much time chasing unqualified leads, while highly qualified leads slip through the cracks due to slow response times.</p>
          <p>Our mission is to bridge the gap between instant customer gratification and rigorous B2B qualification. By leveraging ultra-fast Large Language Models and state-of-the-art voice synthesis, we provide an AI that doesn't just chat—it closes the gap.</p>
          <h2 className="text-2xl font-bold text-primary mt-12 mb-4">Our Core Values</h2>
          <ul>
            <li><strong>Speed is a Feature:</strong> The faster you reply to a lead, the higher the close rate. We measure latency in milliseconds.</li>
            <li><strong>Customizability:</strong> Every business is unique. Your AI agent should talk like your best sales rep.</li>
            <li><strong>Transparency:</strong> AI shouldn't be a black box. You control exactly what data points are extracted.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
