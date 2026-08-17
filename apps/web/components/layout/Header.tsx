import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export function Header() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
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
