import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-2">Cookie Policy</h1>
        <p className="text-secondary mb-12">Last Updated: August 2026</p>
        
        <div className="prose prose-lg text-secondary max-w-none">
          <p>This Cookie Policy explains how Ladeway uses cookies and similar technologies to recognize you when you visit our platform.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">What are cookies?</h2>
          <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">Why do we use cookies?</h2>
          <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our platform to operate (such as authentication session tokens), and we refer to these as "essential" or "strictly necessary" cookies.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">Essential Cookies</h2>
          <ul>
            <li><strong>Session Cookies:</strong> Used to maintain your logged-in state across page reloads.</li>
            <li><strong>Security Cookies:</strong> Used to prevent Cross-Site Request Forgery (CSRF) attacks.</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">Analytics Cookies</h2>
          <p>We use analytics cookies to understand how our website is being used and how we can improve the user experience. These cookies collect information in an aggregated form.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
