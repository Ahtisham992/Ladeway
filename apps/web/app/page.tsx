export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, ArrowRight } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
}

async function getTenants(): Promise<{ tenants: Tenant[], error: boolean }> {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${apiUrl}/tenants/public`, { cache: 'no-store' });
    if (!res.ok) {
      return { tenants: [], error: true };
    }
    const data = await res.json();
    return { tenants: data, error: false };
  } catch (err) {
    return { tenants: [], error: true };
  }
}

export default async function LandingPage() {
  const { tenants, error } = await getTenants();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform rotate-12">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ladeway</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AI-Powered Lead Qualification
        </h1>
        <p className="mt-4 text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Explore our network of partner companies using Ladeway's intelligent agents to automatically qualify, score, and route their inbound leads.
        </p>
      </div>

      {/* Tenants Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {error ? (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            Failed to load companies. Is the API server running?
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">
            No companies have joined yet. Be the first!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {tenants.map(tenant => (
              <Card key={tenant.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{tenant.subdomain}.ladeway.com</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href={`/company/${tenant.id}`} className="w-full">
                    <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                      View AI Agents
                      <ArrowRight className="w-4 h-4 ml-2 opacity-70" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
