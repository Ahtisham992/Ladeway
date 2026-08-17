import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-12">The Ladeway Blog</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <article className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-primary/30">
            <div className="h-48 bg-primary/5 border-b border-border flex items-center justify-center p-6 text-center">
              <h2 className="text-xl font-bold text-primary">Why Voice AI is the Next Big Leap in Sales Automation</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Engineering</div>
              <p className="text-secondary text-sm flex-1 mb-6">How we dropped latency to under 800ms to make our AI sound indistinguishable from a human sales representative.</p>
              <div className="text-primary font-medium text-sm flex items-center">
                Read Article
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          </article>

          <article className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-primary/30">
            <div className="h-48 bg-primary/5 border-b border-border flex items-center justify-center p-6 text-center">
              <h2 className="text-xl font-bold text-primary">Dynamic Lead Scoring using LLMs</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Product</div>
              <p className="text-secondary text-sm flex-1 mb-6">Moving away from rigid form conditions and letting the AI understand context, budget, and sentiment organically.</p>
              <div className="text-primary font-medium text-sm flex items-center">
                Read Article
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
