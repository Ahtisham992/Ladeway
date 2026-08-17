import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export function Header() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/product/features" className="text-sm font-medium text-secondary-700 hover:text-primary transition-colors">Features</Link>
            <Link href="/product/integrations" className="text-sm font-medium text-secondary-700 hover:text-primary transition-colors">Integrations</Link>
            <Link href="/product/pricing" className="text-sm font-medium text-secondary-700 hover:text-primary transition-colors">Pricing</Link>
            <Link href="/company/about" className="text-sm font-medium text-secondary-700 hover:text-primary transition-colors">Company</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
            Log in
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-primary text-white hover:bg-primary-dark">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
