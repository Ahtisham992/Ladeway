export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users, BarChart2, Settings, Briefcase, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function OverviewPage() {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const quickLinks = [
    {
      title: 'View Analytics',
      description: 'Check your AI agent performance and conversion rates.',
      href: '/dashboard/analytics',
      icon: BarChart2,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      title: 'Manage Leads',
      description: 'Review your latest qualified leads in the pipeline.',
      href: '/dashboard',
      icon: Users,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    {
      title: 'Configure Agents',
      description: 'Create or update your AI Agent personas and rules.',
      href: '/dashboard/configs',
      icon: Briefcase,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10'
    },
    {
      title: 'Workspace Settings',
      description: 'Manage your company details and account settings.',
      href: '/dashboard/settings',
      icon: Settings,
      color: 'text-slate-500',
      bg: 'bg-slate-50 dark:bg-slate-500/10'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome to your Ladeway Admin Console.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="block group">
            <Card className="h-full hover:border-primary/50 transition-colors duration-200">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${link.bg}`}>
                    <link.icon className={`w-6 h-6 ${link.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{link.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{link.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
