'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/login/actions';

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
    { name: 'Leads', href: '/dashboard', icon: Users },
    { name: 'Configurations', href: '/dashboard/configs', icon: Briefcase },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-primary text-white flex flex-col min-h-screen">
      <div className="px-6 py-8">
        <div className="w-full h-12 overflow-hidden flex items-center justify-center bg-white rounded-lg p-1 shadow-sm mb-2">
          <img src="/logo.png" alt="Ladeway" className="w-[120%] h-auto object-cover" />
        </div>
        <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-widest mt-3">Admin Console</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
