export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, MessageSquare, ArrowRight, Building2 } from 'lucide-react';

interface TenantInfo {
  name: string;
  subdomain: string;
}

interface IndustryConfig {
  id: string;
  industryName: string;
  personaName: string;
  greeting?: string;
  tenant?: TenantInfo;
}

async function getConfigs(): Promise<{ configs: IndustryConfig[], error: boolean }> {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${apiUrl}/industry-configs/public`, { cache: 'no-store' });
    if (!res.ok) {
      return { configs: [], error: true };
    }
    const data = await res.json();
    return { configs: data, error: false };
  } catch (err) {
    return { configs: [], error: true };
  }
}

export default async function LandingPage() {
  const { configs, error } = await getConfigs();

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
          Explore the catalog of AI Agents created by our partner companies to automatically qualify, score, and route their inbound leads.
        </p>
      </div>

      {/* Agents Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {error ? (
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            Failed to load AI Agents. Is the API server running?
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">
            No AI Agents are currently available in the catalog. Be the first to build one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {configs.map(config => (
              <Card key={config.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {config.tenant?.name || 'Unknown Company'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">{config.personaName}</CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{config.industryName}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-6 line-clamp-3 relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                    "{config.greeting}"
                  </p>
                  <Link href={`/chat/${config.id}`} className="w-full mt-auto">
                    <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                      Start Conversation
                      <MessageSquare className="w-4 h-4 ml-2 opacity-70" />
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
