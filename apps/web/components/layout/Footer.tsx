import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer className="bg-white border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center mb-4 opacity-70">
              <Logo />
            </div>
            <p className="text-sm text-secondary">
              Intelligent conversational qualification for modern sales teams.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/product/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/product/integrations" className="hover:text-primary transition-colors">Integrations</Link></li>
              <li><Link href="/product/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/product/changelog" className="hover:text-primary transition-colors">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/company/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/company/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/company/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/company/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-secondary">
          <p>&copy; {new Date().getFullYear()} Ladeway Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
