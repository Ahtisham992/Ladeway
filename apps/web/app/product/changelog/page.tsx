import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-12">Changelog</h1>
        
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-primary text-lg">Epic 2: Voice AI Rollout</h3>
                <time className="text-xs font-medium text-primary/60">August 2026</time>
              </div>
              <p className="text-sm text-secondary mt-3">Launched fully conversational AI Voice agents. Added dynamic UI modals for PII data entry and switched STT provider to Deepgram Nova-2.</p>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary/20 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-primary text-lg">Epic 1: Real-time Text Chat</h3>
                <time className="text-xs font-medium text-secondary-light">July 2026</time>
              </div>
              <p className="text-sm text-secondary mt-3">Initial launch of Ladeway platform. Introduced WebSockets, dynamic AI schemas, scoring logic, and the core Dashboard.</p>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
