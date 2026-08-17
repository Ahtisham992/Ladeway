import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">Careers at Ladeway</h1>
          <p className="text-xl text-secondary">Join us in building the future of conversational AI.</p>
        </div>
        
        <div className="bg-white p-12 rounded-2xl border border-border text-center shadow-sm">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">No open positions right now</h2>
          <p className="text-secondary mb-8 max-w-lg mx-auto">We're currently heads-down building the core platform. However, we're always looking to connect with exceptional engineers and product designers.</p>
          <a href="mailto:careers@ladeway.com" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors">
            Send us your resume
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
