import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-4 text-center">Contact Us</h1>
        <p className="text-lg text-secondary mb-12 text-center">Have a question or want a custom demo? Drop us a line.</p>
        
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-secondary mb-1">First name</label>
                <input type="text" id="first-name" className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" />
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-secondary mb-1">Last name</label>
                <input type="text" id="last-name" className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">Work email</label>
              <input type="email" id="email" className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-secondary mb-1">Message</label>
              <textarea id="message" rows={4} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"></textarea>
            </div>
            <Button type="button" className="w-full bg-primary text-white hover:bg-primary-dark">Send Message</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
